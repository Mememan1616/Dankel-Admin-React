import { useState, useEffect, useMemo, useRef } from 'react';
import { ApiService } from '../../services/ApiService';
import { useDatosPorSemana } from '../../hooks/useDatosPorSemana';
import { getSemanaMasReciente } from '../../utils/semanas';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Filter,
  PieChart,
  Settings2,
  ChevronDown,
  Box
} from 'lucide-react';
import type { Maquina } from '../../interfaces/maquinas';
import type { Turno } from '../../interfaces/turnos';
import type { Semana } from '../../interfaces/semanas';

// --- COMPONENTE MULTI-SELECT PERSONALIZADO ---
const MultiSelectDropdown = ({ title, options, selectedValues, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleOption = (id: string) => {
    if (selectedValues.includes(id)) {
      onChange(selectedValues.filter((v: string) => v !== id));
    } else {
      onChange([...selectedValues, id]);
    }
  };

  const isAllSelected = selectedValues.length === 0;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors w-full sm:w-auto hover:bg-slate-100 dark:hover:bg-slate-700"
      >
        <Filter className="w-4 h-4 text-slate-400" />
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[120px]">
          {title} {isAllSelected ? '(Todos)' : `(${selectedValues.length})`}
        </span>
        <ChevronDown className="w-4 h-4 text-slate-400 ml-1" />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-2 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 max-h-64 overflow-y-auto">
          <label className="flex items-center px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors border-b border-slate-100 dark:border-slate-700">
            <input
              type="checkbox"
              checked={isAllSelected}
              onChange={() => onChange([])}
              className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 bg-slate-100 dark:bg-slate-900"
            />
            <span className="ml-3 text-sm font-bold text-slate-700 dark:text-slate-200">Seleccionar Todos</span>
          </label>
          {options.map((opt: any) => (
            <label key={opt.id} className="flex items-center px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors">
              <input
                type="checkbox"
                checked={selectedValues.includes(opt.id)}
                onChange={() => toggleOption(opt.id)}
                className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 bg-white dark:bg-slate-900"
              />
              <span className="ml-3 text-sm font-medium text-slate-600 dark:text-slate-300 truncate">{opt.label}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
};

export default function Dashboard2Page() {
  const [loading, setLoading] = useState(true);

  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);

  const [filtrosSemanas, setFiltrosSemanas] = useState<string[]>([]);
  const [filtrosTurnos, setFiltrosTurnos] = useState<string[]>([]);
  const [filtrosLotes, setFiltrosLotes] = useState<string[]>([]);

  const [filtroMaquina, setFiltroMaquina] = useState('todas');

  const { produccion, paros, loading: loadingDatos } = useDatosPorSemana({
    semanas,
    seleccionadas: filtrosSemanas
  });

  useEffect(() => {
    setFiltrosLotes([]);
  }, [filtroMaquina]);

  useEffect(() => {
    setFiltrosLotes([]);
  }, [filtrosSemanas]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [maqData, turnosData, semData, lotesData] = await Promise.all([
        ApiService.getAllMaquinas(),
        ApiService.getAllTurnos(),
        ApiService.getAllSemanas(),
        ApiService.getAllLotes()
      ]);
      setMaquinas(maqData || []);
      setTurnos(turnosData || []);
      setLotes(lotesData || []);

      const listaSemanas = semData || [];

      if (listaSemanas.length > 0) {
        setFiltrosSemanas([getSemanaMasReciente(listaSemanas)]);
      }

      setSemanas(listaSemanas);

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHoursDiff = (start: string, end: string) => {
    if (!start || !end) return 0;
    const [h1, m1, s1] = start.split(':').map(Number);
    const [h2, m2, s2] = end.split(':').map(Number);
    const d1 = new Date(2000, 1, 1, h1, m1, s1 || 0);
    const d2 = new Date(2000, 1, 1, h2, m2, s2 || 0);
    if (d2 < d1) d2.setDate(d2.getDate() + 1);
    return (d2.getTime() - d1.getTime()) / 3600000;
  };

  const isFromMaquina = (item: any, maq: Maquina) => {
    const mId = String(maq.id_maquina || '').trim().toLowerCase();
    const mName = String(maq.maquina || '').trim().toLowerCase();

    const itemId = String(item.id_maquina || '').trim().toLowerCase();
    const itemName = String(item.maquina || '').trim().toLowerCase();

    return itemId === mId || itemId === mName || itemName === mId || itemName === mName;
  };

  const calcularMetricas = (prod: any[], parosLogs: any[], options?: { modo: 'LOTE' | 'TURNO', turnosActivos: Turno[] }) => {
    const modo = options?.modo || 'LOTE';
    const turnosActivos = options?.turnosActivos || [];

    let t_paros_setup = 0;
    let t_paros_comida = 0;
    let t_paros_despeje = 0;
    let t_paros_noprog = 0;
    let piezasBuenas = 0;
    let piezasTotal = 0;
    let piezasMalas = 0;

    const conteoParos: Record<string, number> = {};

    parosLogs.filter(p => p.estatus !== true).forEach(p => {
      const horas = getHoursDiff(p.hora_inicio, p.hora_termino);
      const nombreParo = String(p.paro || p.descripcion_paro || '').toUpperCase();
      const idParoCrudo = String(p.id_paro || '').toUpperCase();

      if (nombreParo.includes('DESPEJE') || idParoCrudo === 'PAROP2') {
        t_paros_despeje += horas;
      }
      else if (nombreParo.includes('SET UP') || nombreParo.includes('SETUP') || idParoCrudo === 'PAROP1') {
        t_paros_setup += horas;
      }
      else if (nombreParo.includes('COMIDA')) {
        t_paros_comida += horas;
      }
      else {
        t_paros_noprog += horas;
        const nombre = p.paro || p.descripcion_paro || 'Otro';
        conteoParos[nombre] = (conteoParos[nombre] || 0) + (horas * 60);
      }
    });

    let calcOee = 0, calcDisp = 0, calcRend = 0, calcCal = 0;
    let globalTiempoReal = 0;
    let produccionTeoricaTotal = 0;
    let sumPeso = 0;
    let t_ausencia_min = 0;

    if (modo === 'LOTE') {
      const loteMap: Record<string, any[]> = {};
      prod.forEach(p => {
        const key = String(p.lote || p.id_lote || '__sin_lote__');
        if (!loteMap[key]) loteMap[key] = [];
        loteMap[key].push(p);
      });

      let sumDispPeso = 0;
      let sumRendPeso = 0;
      let sumCalPeso = 0;
      let sumOeePeso = 0;

      Object.values(loteMap).forEach(prodLote => {
        let tiempo_ideal_lote = 0;
        let tiempo_paros_lote = 0;
        let piezas_lote = 0;
        let buenas_lote = 0;
        let vel_lote = 0;

        prodLote.forEach(p => {
          if (p.hora_termino === "00:00:00" && String(p.estatus) !== "false") return;
          tiempo_ideal_lote += getHoursDiff(p.hora_inicio, p.hora_termino);
          const pReales = Number(p.piezas_producidas) || 0;
          const pBuenas = Number(p.piezas_buenas) || 0;
          piezas_lote += pReales;
          buenas_lote += pBuenas;

          if (!vel_lote && Number(p.produccionxHora) > 0) vel_lote = Number(p.produccionxHora);
          if (!vel_lote && Number(p.velocidad) > 0) vel_lote = Number(p.velocidad);

          parosLogs
            .filter(paro =>
              paro.estatus !== true &&
              (String(paro.id_produccion) === String(p.id_produccion) ||
              String(paro.id_produccion) === String(p.id))
            )
            .forEach(paro => {
              tiempo_paros_lote += getHoursDiff(paro.hora_inicio, paro.hora_termino);
            });
        });

        if (!vel_lote) vel_lote = 6000;

        const tiempo_real_lote = Math.max(tiempo_ideal_lote - tiempo_paros_lote, 0);
        const prod_teorica_lote = tiempo_real_lote * vel_lote;

        const D_lote = tiempo_ideal_lote > 0 ? tiempo_real_lote / tiempo_ideal_lote : 0;
        const R_lote = prod_teorica_lote > 0 ? piezas_lote / prod_teorica_lote : 0;
        const C_lote = piezas_lote > 0 ? buenas_lote / piezas_lote : 0;
        const O_lote = D_lote * R_lote * C_lote;

        sumPeso += tiempo_ideal_lote;
        sumDispPeso += D_lote * tiempo_ideal_lote;
        sumRendPeso += R_lote * tiempo_ideal_lote;
        sumCalPeso += C_lote * tiempo_ideal_lote;
        sumOeePeso += O_lote * tiempo_ideal_lote;

        globalTiempoReal += tiempo_real_lote;
        piezasBuenas += buenas_lote;
        piezasTotal += piezas_lote;
        piezasMalas += Math.max(piezas_lote - buenas_lote, 0);
        produccionTeoricaTotal += prod_teorica_lote;
      });

      calcDisp = sumPeso > 0 ? sumDispPeso / sumPeso : 0;
      calcRend = produccionTeoricaTotal > 0 ? piezasTotal / produccionTeoricaTotal : 0;
      calcCal = piezasTotal > 0 ? piezasBuenas / piezasTotal : 0;
      calcOee = calcDisp * calcRend * calcCal;
    } else {
      const turnosPorFecha = new Map<string, Set<string>>();
      prod.forEach(p => {
        const fecha = String(p.fecha_produccion || p.fecha || '');
        if (fecha && p.id_turno) {
          if (!turnosPorFecha.has(fecha)) turnosPorFecha.set(fecha, new Set());
          turnosPorFecha.get(fecha)!.add(String(p.id_turno));
        }
      });

      let horasTurno = 0;
      for (const turnos of turnosPorFecha.values()) {
        for (const idTurno of turnos) {
          const t = turnosActivos.find(t => String(t.id_turno) === idTurno);
          let h = t ? getHoursDiff(t.hora_inicio, t.hora_termino) : 0;
          horasTurno += h > 0 ? h : 8;
        }
      }


      sumPeso = horasTurno;

      let tiempo_bruto_prods = 0;

      prod.forEach(p => {
        if (p.hora_termino === "00:00:00" && String(p.estatus) !== "false") return;
        const horas_brutas = getHoursDiff(p.hora_inicio, p.hora_termino);
        tiempo_bruto_prods += horas_brutas;

        const prodReales = Number(p.piezas_producidas) || 0;
        const prodBuenas = Number(p.piezas_buenas) || 0;

        piezasTotal += prodReales;
        piezasBuenas += prodBuenas;
        piezasMalas += Math.max(prodReales - prodBuenas, 0);

        let horas_paros_prod = 0;
        parosLogs
          .filter(paro => paro.estatus !== true && (String(paro.id_produccion) === String(p.id_produccion) || String(paro.id_produccion) === String(p.id)))
          .forEach(paro => {
            horas_paros_prod += getHoursDiff(paro.hora_inicio, paro.hora_termino);
          });

        const tiempoRealReg = Math.max(horas_brutas - horas_paros_prod, 0);
        const vel = Number(p.produccionxHora) || Number(p.velocidad) || 6000;
        produccionTeoricaTotal += (tiempoRealReg * vel);
      });

      const total_paros_horas = t_paros_setup + t_paros_comida + t_paros_despeje + t_paros_noprog;
      const ausencia_horas = Math.max(horasTurno - tiempo_bruto_prods, 0);
      t_ausencia_min = Math.round(ausencia_horas * 60);

      const tiempo_real = Math.max(tiempo_bruto_prods - total_paros_horas, 0);
      globalTiempoReal = tiempo_real;

      calcDisp = horasTurno > 0 ? tiempo_real / horasTurno : 0;
      calcRend = produccionTeoricaTotal > 0 ? piezasTotal / produccionTeoricaTotal : 0;
      calcCal = piezasTotal > 0 ? piezasBuenas / piezasTotal : 0;
      calcOee = calcDisp * calcRend * calcCal;
    }

    const paretoArr = Object.keys(conteoParos)
      .map(k => ({ nombre: k, minutos: Math.round(conteoParos[k]) }))
      .sort((a, b) => b.minutos - a.minutos)
      .slice(0, 7);

    let sumCumulative = 0;
    const totalParosMinutos = paretoArr.reduce((acc, curr) => acc + curr.minutos, 0) || 1;
    const paretoData = paretoArr.map(p => {
      sumCumulative += p.minutos;
      return { ...p, acumulado: (sumCumulative / totalParosMinutos) * 100 };
    });

    return {
      oee: Math.round(calcOee * 10000) / 100,
      disponibilidad: Math.round(calcDisp * 10000) / 100,
      rendimiento: Math.round(calcRend * 10000) / 100,
      calidad: Math.round(calcCal * 10000) / 100,
      piezasBuenas,
      piezasTotal,
      piezasMalas,
      produccionTeorica: produccionTeoricaTotal,
      t_produciendo_min: Math.round(globalTiempoReal * 60),
      t_paros_setup_min: t_paros_setup > 0 && Math.round(t_paros_setup * 60) === 0 ? 1 : Math.round(t_paros_setup * 60),
      t_paros_comida_min: t_paros_comida > 0 && Math.round(t_paros_comida * 60) === 0 ? 1 : Math.round(t_paros_comida * 60),
      t_paros_despeje_min: t_paros_despeje > 0 && Math.round(t_paros_despeje * 60) === 0 ? 1 : Math.round(t_paros_despeje * 60),
      t_paros_noprog_min: t_paros_noprog > 0 && Math.round(t_paros_noprog * 60) === 0 ? 1 : Math.round(t_paros_noprog * 60),
      t_ausencia_min: t_ausencia_min,
      tiempoIdeal: sumPeso,
      paretoData
    };
  };

  const applyFilters = (data: any[], type: 'prod' | 'paro' = 'prod', referenceProd: any[] = []) => {
    return data.filter(item => {
      let passSemana = filtrosSemanas.length === 0 || filtrosSemanas.some(fs => String(fs).trim() === String(item.id_semana || '').trim());
      let passTurno = filtrosTurnos.length === 0 || filtrosTurnos.some(ft => String(ft).trim() === String(item.id_turno || '').trim());
      let passLote = filtrosLotes.length === 0 || filtrosLotes.some(fl => String(fl).trim() === String(item.lote || item.id_lote || '').trim());

      if (type === 'paro') {
        const fecha = item.fecha_produccion || item.fecha;

        if (!passSemana && (!item.id_semana || String(item.id_semana).trim() === 'undefined' || String(item.id_semana).trim() === 'null')) {
          if (fecha && referenceProd.some(prod => (prod.fecha_produccion || prod.fecha) === fecha && prod.id_maquina === item.id_maquina)) {
            passSemana = true;
          }
        }

        if (!passTurno && (!item.id_turno || String(item.id_turno).trim() === 'undefined' || String(item.id_turno).trim() === 'null')) {
          if (fecha && referenceProd.some(prod => (prod.fecha_produccion || prod.fecha) === fecha && prod.id_maquina === item.id_maquina)) {
            passTurno = true;
          }
        }

        if (!passLote && (!item.id_lote || String(item.id_lote).trim() === 'undefined' || String(item.id_lote).trim() === 'null')) {
          passLote = true;
        }
      }

      return passSemana && passTurno && passLote;
    });
  };
  /*
  const parseDateTime = (dateStr: any, timeStr: any) => {
    const tStr = String(timeStr || '00:00:00').trim();
    const timeParts = tStr.split(':');
    const h = parseInt(timeParts[0] || '0', 10);
    const m = parseInt(timeParts[1] || '0', 10);
    const s = parseInt(timeParts[2] || '0', 10);

    const today = new Date();
    const dStr = String(dateStr || '').trim();

    if (!dStr || dStr === 'undefined' || dStr === 'null' || dStr === '') {
      return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, s).getTime() || 0;
    }

    let parts = dStr.split('/');
    if (parts.length !== 3) parts = dStr.split('-'); 
    if (parts.length === 3) {
      const isYearFirst = parts[0].length === 4;
      const year = parseInt(isYearFirst ? parts[0] : parts[2], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(isYearFirst ? parts[2] : parts[0], 10);
      
      return new Date(year, month, day, h, m, s).getTime() || 0;
    }
    
    return new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m, s).getTime() || 0;
  };*/

  const datosGenerales = useMemo(() => {
    const p = applyFilters(produccion, 'prod');
    const pr = applyFilters(paros, 'paro', p);

    const modoCalculo = (filtrosLotes.length === 0 && filtrosTurnos.length > 0) ? 'TURNO' : 'LOTE';
    const turnosActivos = turnos.filter(t => filtrosTurnos.includes(t.id_turno));

    return maquinas.map(maq => {
      const prodMaq = p.filter(x => isFromMaquina(x, maq));
      const parosMaq = pr.filter(x => isFromMaquina(x, maq));
      const met = calcularMetricas(prodMaq, parosMaq, { modo: modoCalculo, turnosActivos });

      const allProdMaq = produccion.filter(x => isFromMaquina(x, maq));
      const allParosMaq = paros.filter(x => isFromMaquina(x, maq));

      let estado = 'inactiva';

      const hoy = new Date();
      const hoyStr = `${String(hoy.getDate()).padStart(2, '0')}/${String(hoy.getMonth() + 1).padStart(2, '0')}/${hoy.getFullYear()}`;

      const activeProd = allProdMaq.find(x => {
        const isActive = x.estatus === true || String(x.estatus).toLowerCase() === 'true';
        if (!isActive) return false;
        const fecha = String(x.fecha_produccion || x.fecha || '').trim();
        return fecha === '' || fecha === hoyStr;
      });

      const activeParo = allParosMaq.find(x => {
        const isActive = x.estatus === true || String(x.estatus).toLowerCase() === 'true';
        if (!isActive) return false;
        const fecha = String(x.fecha_produccion || '').trim();
        if (fecha && fecha !== hoyStr) return false;
        const horaFin = String(x.hora_termino || '00:00:00').trim();
        return horaFin === '00:00:00' || horaFin === '' || horaFin === 'null' || horaFin === 'undefined';
      });

      if (activeParo) {
        const nombreParo = String(activeParo.paro || activeParo.descripcion_paro || activeParo.id_paro || '').toUpperCase();
        estado = (nombreParo.includes('SET UP') || nombreParo.includes('SETUP') || nombreParo.includes('COMIDA') || nombreParo.includes('DESPEJE') || nombreParo === 'PAROP1' || nombreParo === 'PAROP2') ? 'setup' : 'paro';
      } else if (activeProd) {
        estado = 'produciendo';
      }

      return { maquina: maq.maquina, ...met, estado, nombreParo: activeParo?.paro || null };
    });
  }, [produccion, paros, filtrosSemanas, filtrosTurnos, filtrosLotes, maquinas, turnos]);


  const metricasMaquina = useMemo(() => {
    if (filtroMaquina === 'todas') return null;
    const selectedMaq = maquinas.find(m => m.id_maquina === filtroMaquina);
    if (!selectedMaq) return null;

    let p = applyFilters(produccion.filter(x => isFromMaquina(x, selectedMaq)), 'prod');
    let pr = applyFilters(paros.filter(x => isFromMaquina(x, selectedMaq)), 'paro', p);

    const modoCalculo = (filtrosLotes.length === 0 && filtrosTurnos.length > 0) ? 'TURNO' : 'LOTE';
    const turnosActivos = turnos.filter(t => filtrosTurnos.includes(t.id_turno));

    return calcularMetricas(p, pr, { modo: modoCalculo, turnosActivos });
  }, [produccion, paros, filtrosSemanas, filtrosTurnos, filtrosLotes, filtroMaquina, turnos, maquinas]);

  const parosOtros = useMemo(() => {
    const p = applyFilters(produccion, 'prod');
    const pr = applyFilters(paros, 'paro', p);

    const prFiltrada = filtroMaquina !== 'todas'
      ? pr.filter(x => {
        const maq = maquinas.find(m => m.id_maquina === filtroMaquina);
        return maq ? isFromMaquina(x, maq) : false;
      })
      : pr;

    return prFiltrada.filter(paroObj =>
      paroObj.estatus !== true && String(paroObj.id_paro || '').toUpperCase() === 'PAROG'
    ).sort((a, b) => {
      const parseDate = (dStr: any) => {
        if (!dStr) return 0;
        let parts = String(dStr).split('/');
        if (parts.length !== 3) parts = String(dStr).split('-');
        if (parts.length === 3) {
          const isYearFirst = parts[0].length === 4;
          const year = parseInt(isYearFirst ? parts[0] : parts[2], 10);
          const month = parseInt(parts[1], 10) - 1;
          const day = parseInt(isYearFirst ? parts[2] : parts[0], 10);
          return new Date(year, month, day).getTime();
        }
        return 0;
      };
      return parseDate(b.fecha_produccion || b.fecha) - parseDate(a.fecha_produccion || a.fecha);
    });
  }, [produccion, paros, filtroMaquina, filtrosSemanas, filtrosTurnos, filtrosLotes, maquinas]);

  const datosLotes = useMemo(() => {
    let mList = filtroMaquina !== 'todas' ? maquinas.filter(m => m.id_maquina === filtroMaquina) : maquinas;

    return mList.map(maq => {
      const mId = String(maq.id_maquina || '').trim().toLowerCase();
      const mName = String(maq.maquina || '').trim().toLowerCase();

      let programados = 0;
      let completados = 0;
      let pendientes = 0;

      lotes.forEach(l => {
        let pertenece = false;
        let estaCompletadoEnMaquina = false;

        if (Array.isArray(l.maquinas)) {
          const maqEnLote = l.maquinas.find((mObj: any) => {
            const catId = String(mObj?.id_maquina || '').trim().toLowerCase();
            const catName = String(mObj?.maquina || '').trim().toLowerCase();
            return catId === mId || catId === mName || catName === mId || catName === mName;
          });

          if (maqEnLote) {
            pertenece = true;
            // Si el estatus es false, significa que el lote ya se terminó en esta máquina
            if (maqEnLote.estatus === false || String(maqEnLote.estatus).toLowerCase() === 'false') {
              estaCompletadoEnMaquina = true;
            }
          }
        }

        const passSemana = filtrosSemanas.length === 0 || filtrosSemanas.some(fs => String(fs).trim() === String(l.id_semana || '').trim());
        const passTurno = filtrosTurnos.length === 0 || filtrosTurnos.some(ft => String(ft).trim() === String(l.id_turno || '').trim());
        const passLote = filtrosLotes.length === 0 || filtrosLotes.some(fl => String(fl).trim() === String(l.lote || l.id_lote || '').trim());

        if (pertenece && passSemana && passTurno && passLote) {
          programados++;
          if (estaCompletadoEnMaquina) {
            completados++;
          } else {
            pendientes++;
          }
        }
      });

      return {
        etiqueta: maq.maquina,
        completados,
        pendientes,
        totales: completados + pendientes,
        programados
      };
    }).filter(d => d.programados > 0);
  }, [lotes, maquinas, filtrosSemanas, filtrosTurnos, filtrosLotes, filtroMaquina]);

  if (datosLotes.length > 0) {
    const totalProg = datosLotes.reduce((sum, d) => sum + (d.programados || 0), 0);
    console.log(`%c📈 [DASHBOARD LOTES] Data calculada:`, 'background: #6366f1; color: white; padding: 3px; font-weight: bold;');
    console.log('  → Lotes esperados totales (programados):', totalProg);
    console.log('  → Máquinas con datos:', datosLotes.length);
    console.log('  → Data cruda para gráfica:', datosLotes);
  }

  const avanceSemanal = useMemo(() => {
    if (filtrosSemanas.length !== 1) return null;

    const semanaId = filtrosSemanas[0];
    const semana = semanas.find(s => String(s.id_semana) === String(semanaId));
    if (!semana) return null;

    const meta = Number(semana.numero_lotes) || 0;

    const lotesSemana = lotes.filter(l => String(l.id_semana) === String(semanaId));
    const realizados = lotesSemana.filter(l => {
      if (!Array.isArray(l.maquinas) || l.maquinas.length === 0) return false;
      return l.maquinas.every((m: any) =>
        m.estatus === false || String(m.estatus).toLowerCase() === 'false'
      );
    }).length;

    const pendientes = Math.max(meta - realizados, 0);
    const porcentaje = meta > 0 ? Math.round((realizados / meta) * 10000) / 100 : 0;

    return { meta, realizados, pendientes, porcentaje, semana: semana.descripcion };
  }, [lotes, semanas, filtrosSemanas]);

  const tablaRendimientoLotes = useMemo(() => {
    const p = applyFilters(produccion, 'prod');
    const pr = applyFilters(paros, 'paro', p);

    const pFiltrada = filtroMaquina !== 'todas'
      ? p.filter(x => {
        const maq = maquinas.find(m => m.id_maquina === filtroMaquina);
        return maq ? isFromMaquina(x, maq) : false;
      })
      : p;

    const prFiltrada = filtroMaquina !== 'todas'
      ? pr.filter(x => {
        const maq = maquinas.find(m => m.id_maquina === filtroMaquina);
        return maq ? isFromMaquina(x, maq) : false;
      })
      : pr;

    const agrupados: Record<string, any> = {};

    pFiltrada.forEach(reg => {
      const loteKey = reg.lote || reg.id_lote || 'Sin Lote';
      if (!agrupados[loteKey]) {
        agrupados[loteKey] = {
          lote: loteKey,
          buenas: 0,
          total: 0,
          horasDisponibles: 0,
          horasParos: 0,
          id_maquina: reg.id_maquina,
          velocidad_producto: 0
        };
      }
      agrupados[loteKey].buenas += Number(reg.piezas_buenas) || 0;
      agrupados[loteKey].total += Number(reg.piezas_producidas) || 0;

      let regVel = Number(reg.produccionxHora) > 0 ? Number(reg.produccionxHora) : (Number(reg.velocidad) > 0 ? Number(reg.velocidad) : 0);
      if (regVel > 0) {
        agrupados[loteKey].velocidad_producto = regVel;
      }

      const hs = getHoursDiff(reg.hora_inicio, reg.hora_termino);
      agrupados[loteKey].horasDisponibles += hs;
    });

    prFiltrada.filter(paro => paro.estatus !== true).forEach(paro => {
      const loteKey = paro.lote || paro.id_lote || 'Sin Lote';
      if (agrupados[loteKey]) {
        agrupados[loteKey].horasParos += getHoursDiff(paro.hora_inicio, paro.hora_termino);
      }
    });

    return Object.values(agrupados).map(g => {
      const malas = g.total - g.buenas;
      const horasEfectivas = Math.max(g.horasDisponibles - g.horasParos, 0);

      let vel = 6000;
      if (g.velocidad_producto > 0) {
        vel = g.velocidad_producto;
      }

      const teorica = horasEfectivas * vel;
      const rendimiento = teorica > 0 ? (g.total / teorica) * 100 : 0;

      return { ...g, malas, horasEfectivas, prodTeorica: teorica, rendimiento: Math.round(rendimiento * 100) / 100 };
    }).sort((a, b) => b.total - a.total);
  }, [produccion, paros, filtroMaquina, filtrosSemanas, filtrosTurnos, filtrosLotes, maquinas]);

  const getColorOEE = (val: number) => {
    if (val > 80) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
    return 'text-rose-600 bg-rose-50 border-rose-200';
  };

  const getTextColor = (val: number) => {
    if (val > 80) return 'text-emerald-600';
    if (val >= 60) return 'text-amber-500';
    return 'text-rose-600';
  };

  const getStatusIcon = (estado: string) => {
    if (estado === 'produciendo') return <CheckCircle2 className="w-6 h-6 text-emerald-500" />;
    if (estado === 'setup') return <AlertCircle className="w-6 h-6 text-amber-500" />;
    if (estado === 'paro') return <XCircle className="w-6 h-6 text-rose-500" />;
    return <div className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 m-0.5"></div>;
  };

  if (loading || loadingDatos) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-600"></div>
    </div>
  );

  const isGeneralView = filtroMaquina === 'todas';

  const opcionesSemanas = semanas.map(s => ({ id: s.id_semana, label: s.descripcion || s.id_semana }));
  const opcionesTurnos = turnos.map(t => ({ id: t.id_turno, label: t.turno }));

  const produccionParaLotes = filtroMaquina === 'todas'
    ? produccion
    : produccion.filter(p => {
      const maq = maquinas.find(m => m.id_maquina === filtroMaquina);
      return maq ? isFromMaquina(p, maq) : false;
    });

  const lotesUnicosIds = [...new Set(produccionParaLotes.map(p => p.lote || p.id_lote).filter(Boolean))];
  const opcionesLotes = lotesUnicosIds.map(l => ({ id: String(l), label: `Lote: ${l}` }));

  const BarChartAvanceSemanal = ({ data }: { data: { meta: number; realizados: number; pendientes: number; porcentaje: number; semana: string } }) => {
    const maxVal = Math.max(data.meta, data.realizados, 1);
    const pRealizados = (data.realizados / maxVal) * 100;
    const pMeta = (data.meta / maxVal) * 100;

    return (
      <div className="w-full flex flex-col font-sans">
        <div className="flex items-center gap-3 mb-6">
          <Box className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Avance de Lotes por Semana</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              {data.semana} • <span className="text-indigo-500 font-bold">{data.meta} Planeados</span>
            </p>
          </div>
        </div>

        <div className="relative pt-2 pb-6 px-1">
          <div className="flex items-center gap-4 group relative">
            <div className="w-36 pr-3 text-[11px] font-bold text-slate-600 dark:text-slate-400 text-right uppercase">
              Semana
            </div>

            <div className="flex-1 h-12 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg flex relative overflow-hidden group-hover:shadow-md transition-shadow">
              <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                <div className="font-extrabold text-white uppercase mb-1">{data.semana}</div>
                <div>Lotes Realizados: <span className="font-bold text-indigo-400">{data.realizados}</span></div>
                <div>Lotes Planeados: <span className="font-bold text-slate-300">{data.meta}</span></div>
                <div className="mt-1 font-bold text-emerald-400 border-t border-slate-700 pt-1">
                  {data.porcentaje}% completado
                </div>
              </div>

              <div className="absolute left-0 top-0 bottom-0 bg-slate-100 dark:bg-slate-700/50 rounded-lg" style={{ width: `${pMeta}%` }}></div>

              <div
                className="h-full bg-indigo-500 flex items-center justify-center text-white font-extrabold text-xs rounded-lg transition-all duration-1000 z-10 shadow-sm relative overflow-hidden text-ellipsis whitespace-nowrap px-2"
                style={{
                  width: `${pRealizados}%`,
                  minWidth: data.realizados > 0 ? '2.5rem' : '0',
                }}
              >
                {pRealizados > 10 ? `${data.realizados}` : ''}
              </div>
            </div>
          </div>

          <div className="absolute bottom-0 left-[10rem] right-0 h-6 flex items-center pt-1 px-1">
            <span className="text-[10px] font-bold text-slate-400">0</span>
            <span className="text-[10px] font-bold text-slate-400 ml-auto">{data.meta}</span>
          </div>
        </div>

        <div className="flex justify-center gap-10 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <div className="w-5 h-5 bg-indigo-500 rounded shadow-sm"></div> Realizados ({data.realizados})
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <div className="w-5 h-5 bg-slate-200 dark:bg-slate-700 rounded shadow-sm"></div> Planeados ({data.meta})
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {data.porcentaje}% completado
          </div>
        </div>
      </div>
    );
  };

  const BarChartLotes = ({ data }: { data: any[] }) => {
    const totalLotes = data.reduce((sum, d) => sum + d.totales, 0);
    const totalProgramados = data.reduce((sum, d) => sum + (d.programados || 0), 0);

    console.log(`%c📊 [GRÁFICA LOTES] Resumen:`, 'background: #ffb75e; color: #1a1a2e; padding: 3px; font-weight: bold;');
    console.log('  → Total lotes en gráfica:', totalLotes);
    console.log('  → Lotes programados (esperados):', totalProgramados);
    console.log('  → Detalle por máquina:', data.map((d: any) => ({
      maquina: d.etiqueta,
      completados: d.completados,
      pendientes: d.pendientes,
      total: d.totales,
      programados: d.programados || 0
    })));

    if (totalLotes === 0) {
      return (
        <div className="w-full flex flex-col font-sans">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
            <div>
              <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Producción VS Objetivo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Lotes completados por máquina
                {totalProgramados > 0 && <><span className="mx-2">•</span><span className="text-indigo-500 font-bold">{totalProgramados} Programados</span></>}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center h-40 text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
            <PieChart className="w-8 h-8 mb-2 opacity-50" />
            <p className="text-sm font-semibold">No hay lotes en el periodo seleccionado.</p>
          </div>
        </div>
      );
    }

    const maxVal = Math.max(...data.map(d => d.totales), 1);

    let ticks: number[] = [];
    if (maxVal <= 5) {
      ticks = Array.from({ length: maxVal + 1 }, (_, i) => i);
    } else {
      const numberOfIntervals = 4;
      ticks = Array.from({ length: numberOfIntervals + 1 }, (_, i) => Math.floor((maxVal / numberOfIntervals) * i));
    }

    return (
      <div className="w-full flex flex-col font-sans">
        <div className="flex items-center gap-3 mb-8">
          <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
          <div>
            <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Producción VS Objetivo</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Lotes completados por máquina
              {totalProgramados > 0 && <><span className="mx-2">•</span><span className="text-indigo-500 font-bold">{totalProgramados} Programados</span></>}
            </p>
          </div>
        </div>

        <div className="relative pt-2 pb-6 px-1">

          <div className="absolute inset-0 top-2 bottom-6 left-[10rem] flex justify-between z-0 pointer-events-none px-1">
            {ticks.map((_, i) => (
              <div key={i} className="relative flex flex-col items-center">
                <div className="absolute top-0 bottom-0 w-px bg-slate-100 dark:bg-slate-700/50"></div>
              </div>
            ))}
          </div>

          <div className="absolute top-2 bottom-6 left-[10rem] w-px bg-slate-200 dark:bg-slate-700 z-10"></div>

          <div className="space-y-6 relative z-10">
            {data.map((d, i) => {
              const avance = d.completados;
              const objetivo = d.totales;
              const restante = d.pendientes;

              const pctOfObjective = objetivo > 0 ? (avance / objetivo) * 100 : 0;
              const pAvance = maxVal > 0 ? (avance / maxVal) * 100 : 0;
              const pRestante = maxVal > 0 ? (restante / maxVal) * 100 : 0;
              const pObjectiveTrack = maxVal > 0 ? (objetivo / maxVal) * 100 : 0;

              return (
                <div key={i} className="flex items-center gap-4 group relative">

                  <div className="w-36 pr-3 text-[11px] font-bold text-slate-600 dark:text-slate-400 text-right truncate uppercase" title={d.etiqueta}>
                    {d.etiqueta}
                    {d.programados > 0 && (
                      <div className="text-[9px] font-normal text-slate-400 normal-case mt-0.5">Prog: {d.programados}</div>
                    )}
                  </div>

                  <div className="flex-1 h-10 bg-slate-50/50 dark:bg-slate-800/30 rounded-lg flex relative overflow-hidden group-hover:shadow-md transition-shadow">

                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 bg-slate-950 text-white text-xs font-semibold py-2 px-3 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity z-20 whitespace-nowrap pointer-events-none">
                      <div className="font-extrabold text-white uppercase mb-1">{d.etiqueta}</div>
                      <div>Lotes Terminados: <span className="font-bold text-[#ffb75e]">{avance}</span></div>
                      <div>Lotes Pendientes: <span className="font-bold text-[#a61723]">{restante}</span></div>
                      <div className="mt-1 font-bold text-emerald-400 border-t border-slate-700 pt-1 flex justify-between items-center gap-3">
                        <span>{pctOfObjective.toFixed(1)}% completado</span>
                        {d.programados > 0 && <span className="text-indigo-300">Total Prog: {d.programados}</span>}
                      </div>
                    </div>

                    <div className="absolute left-0 top-0 bottom-0 bg-slate-100 dark:bg-slate-700/50 rounded-lg" style={{ width: `${pObjectiveTrack}%` }}></div>

                    {avance > 0 && (
                      <div
                        className="h-full bg-[#ffb75e] flex items-center justify-center text-[#8a4200] font-extrabold text-xs rounded-l-lg transition-all duration-1000 z-10 shadow-sm relative overflow-hidden text-ellipsis whitespace-nowrap px-1"
                        style={{
                          width: `${pAvance}%`,
                          borderTopRightRadius: restante === 0 ? '0.5rem' : '0',
                          borderBottomRightRadius: restante === 0 ? '0.5rem' : '0'
                        }}
                      >
                        {pAvance > 5 ? avance : ''}
                      </div>
                    )}

                    {restante > 0 && (
                      <div
                        className="h-full bg-[#a61723] flex items-center justify-center text-white font-extrabold text-xs rounded-r-lg transition-all duration-1000 z-10 shadow-sm relative overflow-hidden text-ellipsis whitespace-nowrap px-1"
                        style={{
                          width: `${pRestante}%`,
                          borderTopLeftRadius: avance === 0 ? '0.5rem' : '0',
                          borderBottomLeftRadius: avance === 0 ? '0.5rem' : '0'
                        }}
                      >
                        {pRestante > 5 ? restante : ''}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-0 left-[10rem] right-0 h-6 flex justify-between z-10 px-1 pt-1">
            {ticks.map((t, i) => (
              <span key={i} className="text-[10px] font-bold text-slate-400 -translate-x-1/2">
                {t}
              </span>
            ))}
          </div>

        </div>

        <div className="flex justify-center gap-10 mt-6 pt-6 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <div className="w-5 h-5 bg-[#ffb75e] rounded shadow-sm"></div> Lotes Terminados
          </div>
          <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300">
            <div className="w-5 h-5 bg-[#a61723] rounded shadow-sm"></div> Lotes Pendientes
          </div>
        </div>
      </div>
    );
  };

  const ParetoChart = ({ data }: { data: any[] }) => {
    if (data.length === 0) return <p className="text-center text-slate-500 mt-10">Sin paros registrados</p>;
    const maxMin = Math.max(...data.map(d => d.minutos)) * 1.2;

    return (
      <div className="w-full h-72 flex mt-4 text-[10px] font-semibold text-slate-500 relative">
        <div className="flex flex-col justify-between w-10 text-right pr-2 pb-10">
          <span>{Math.round(maxMin)}</span>
          <span>{Math.round(maxMin * 0.75)}</span>
          <span>{Math.round(maxMin * 0.5)}</span>
          <span>{Math.round(maxMin * 0.25)}</span>
          <span>0</span>
        </div>

        <div className="flex-1 relative border-l border-r border-b border-slate-300">
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} className="absolute left-0 right-0 border-t border-slate-100" style={{ bottom: `${pct}%`, top: pct === 100 ? '0' : undefined }}></div>
          ))}
          <div className="absolute inset-x-0 top-0 bottom-16 flex items-end justify-around px-2 z-10">
            {data.map((d, i) => (
              <div key={i} className="w-[12%] bg-blue-600 rounded-t-sm flex flex-col items-center justify-start group relative" style={{ height: `${(d.minutos / maxMin) * 100}%` }}>
                <span className="opacity-0 group-hover:opacity-100 absolute -top-5 text-black bg-white shadow px-1 rounded text-[10px]">{d.minutos}m</span>
              </div>
            ))}
          </div>

          <svg className="absolute inset-x-0 top-0 bottom-16 z-20 overflow-visible" preserveAspectRatio="none">
            <polyline
              fill="none"
              stroke="#f97316"
              strokeWidth="2.5"
              points={data.map((d, i) => {
                const x = `${(i + 0.5) * (100 / data.length)}%`;
                const y = `${100 - d.acumulado}%`;
                return `${x},${y}`;
              }).join(' ')}
            />
            {data.map((d, i) => (
              <circle key={i} cx={`${(i + 0.5) * (100 / data.length)}%`} cy={`${100 - d.acumulado}%`} r="3" fill="#f97316" />
            ))}
          </svg>

          <div className="absolute bottom-0 left-0 right-0 h-16 flex justify-around items-start pt-2">
            {data.map((d, i) => (
              <div key={i} className="w-[13%] text-center leading-tight flex justify-center" title={d.nombre}>
                <span className="text-[9px] font-semibold text-slate-600 dark:text-slate-400 line-clamp-3 break-words">
                  {d.nombre}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col justify-between w-10 text-left pl-2 pb-10">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
      </div>
    );
  };

  const DonutChart = ({ tSetup, tComida, tNoProg, tEfectivo, tDespeje, tAusencia = 0 }: any) => {
    const total = tSetup + tComida + tNoProg + tEfectivo + tDespeje + tAusencia || 1;
    const pEfectivo = (tEfectivo / total) * 100;
    const pSetup = (tSetup / total) * 100;
    const pComida = (tComida / total) * 100;
    const pDespeje = (tDespeje / total) * 100;
    const pNoProg = (tNoProg / total) * 100;

    return (
      <div className="w-48 h-48 rounded-full relative shadow-sm"
        style={{
          background: `conic-gradient(
            #10b981 0% ${pEfectivo}%, 
            #3b82f6 ${pEfectivo}% ${pEfectivo + pSetup}%, 
            #0ea5e9 ${pEfectivo + pSetup}% ${pEfectivo + pSetup + pComida}%, 
            #a855f7 ${pEfectivo + pSetup + pComida}% ${pEfectivo + pSetup + pComida + pDespeje}%,
            #f43f5e ${pEfectivo + pSetup + pComida + pDespeje}% ${pEfectivo + pSetup + pComida + pDespeje + pNoProg}%,
            #f59e0b ${pEfectivo + pSetup + pComida + pDespeje + pNoProg}% 100%
          )`
        }}
      >
        <div className="absolute inset-0 m-auto w-24 h-24 bg-white dark:bg-slate-900 rounded-full flex flex-col items-center justify-center shadow-inner">
          <span className="text-xs font-bold text-slate-400">Total</span>
          <span className="text-lg font-black text-slate-700 dark:text-white">{Math.round(total)}m</span>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">

      {/* HEADER Y FILTROS MODERNO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg shadow-sm">
              <Activity className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
              Dashboard OEE
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 text-sm font-medium ml-11">
            {isGeneralView ? 'Vista general en planta por turno' : 'Análisis detallado por máquina con Pareto'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <MultiSelectDropdown title="Semanas" options={opcionesSemanas} selectedValues={filtrosSemanas} onChange={setFiltrosSemanas} />
          <MultiSelectDropdown title="Turnos" options={opcionesTurnos} selectedValues={filtrosTurnos} onChange={setFiltrosTurnos} />
          <MultiSelectDropdown title="Lotes" options={opcionesLotes} selectedValues={filtrosLotes} onChange={setFiltrosLotes} />

          <div className="flex items-center gap-2 bg-cyan-50 dark:bg-cyan-900/20 px-4 py-2.5 rounded-xl border border-cyan-200 dark:border-cyan-800 w-full sm:w-auto transition-colors">
            <Settings2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <select value={filtroMaquina} onChange={e => setFiltroMaquina(e.target.value)} className="bg-transparent border-none text-sm font-bold text-cyan-700 dark:text-cyan-400 focus:ring-0 cursor-pointer outline-none w-full">
              <option value="todas">Máquinas (Todas)</option>
              {maquinas.map(m => <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ========================================= */}
      {/* VISTA 1: TODAS LAS MÁQUINAS (General) */}
      {/* ========================================= */}
      {isGeneralView && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
              <Activity className="w-5 h-5 text-indigo-500" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Desempeño General por Máquina</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-white dark:bg-slate-900">
                    <th className="px-6 py-4 font-bold">Máquina</th>
                    <th className="px-6 py-4 font-bold text-center">OEE</th>
                    <th className="px-6 py-4 font-bold text-center">Disponibilidad</th>
                    <th className="px-6 py-4 font-bold text-center">Desempeño</th>
                    <th className="px-6 py-4 font-bold text-center">Calidad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {datosGenerales.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 uppercase">{row.maquina}</td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold border ${getColorOEE(row.oee)}`}>
                          {row.oee}%
                        </span>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 leading-tight">
                          {row.disponibilidad}% × {row.rendimiento}% × {row.calidad}%
                        </p>
                      </td>
                      <td className={`px-6 py-4 text-center font-bold ${getTextColor(row.disponibilidad)}`}>
                        {row.disponibilidad}%
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 leading-tight">
                          {Math.round(row.t_produciendo_min / 60 * 10) / 10}h / {Math.round((row.tiempoIdeal || 0) * 10) / 10}h
                        </p>
                      </td>
                      <td className={`px-6 py-4 text-center font-bold ${getTextColor(row.rendimiento)}`}>
                        {row.rendimiento}%
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 leading-tight">
                          {row.piezasTotal?.toLocaleString()} / {row.produccionTeorica?.toLocaleString()} pz
                        </p>
                      </td>
                      <td className={`px-6 py-4 text-center font-bold ${getTextColor(row.calidad)}`}>
                        {row.calidad}%
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-0.5 leading-tight">
                          {row.piezasBuenas?.toLocaleString()} / {row.piezasTotal?.toLocaleString()} pz
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
              <Activity className="w-5 h-5 text-cyan-500" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Estado de Máquinas</h3>
            </div>
            <div className="p-6 flex-1 flex flex-col justify-center gap-4">
              {datosGenerales.map((row, idx) => (
                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <span className="font-bold text-slate-700 dark:text-slate-200 uppercase">{row.maquina}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-400 capitalize">{row.estado === 'paro' && row.nombreParo ? `Paro: ${row.nombreParo}` : row.estado === 'setup' ? 'Set Up' : row.estado}</span>
                    {getStatusIcon(row.estado)}
                  </div>
                </div>
              ))}
            </div>
            {/* LEYENDA */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
              <div className="flex justify-center flex-wrap gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Produciendo</div>
                <div className="flex items-center gap-1.5"><AlertCircle className="w-4 h-4 text-amber-500" /> Set up</div>
                <div className="flex items-center gap-1.5"><XCircle className="w-4 h-4 text-rose-500" /> Paro</div>
                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600"></div> Inactiva</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3 space-y-6">
            {avanceSemanal && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <BarChartAvanceSemanal data={avanceSemanal} />
              </div>
            )}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <BarChartLotes data={datosLotes} />
            </div>
          </div>

        </div>
      )}

      {/* ========================================= */}
      {/* VISTA 2: MÁQUINA ESPECÍFICA (Detalle) */}
      {/* ========================================= */}
      {!isGeneralView && metricasMaquina && (
        <div className="space-y-6">

          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
            <div className={`col-span-2 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900`}>
              <div>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">OEE Total</p>
                <h3 className={`text-5xl font-black ${getTextColor(metricasMaquina.oee)}`}>{metricasMaquina.oee}%</h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                  {metricasMaquina.disponibilidad}% × {metricasMaquina.rendimiento}% × {metricasMaquina.calidad}%
                </p>
              </div>
              <div className={`p-4 rounded-full ${getColorOEE(metricasMaquina.oee).replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 text-')}`}>
                <Activity className="w-10 h-10" />
              </div>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Disponibilidad</p>
              <h4 className={`text-3xl font-black ${getTextColor(metricasMaquina.disponibilidad)}`}>{metricasMaquina.disponibilidad}%</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-1 leading-tight">
                {Math.round(metricasMaquina.t_produciendo_min / 60 * 10) / 10}h / {Math.round((metricasMaquina.tiempoIdeal || 0) * 10) / 10}h
              </p>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Desempeño</p>
              <h4 className={`text-3xl font-black ${getTextColor(metricasMaquina.rendimiento)}`}>{metricasMaquina.rendimiento}%</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-1 leading-tight">
                {metricasMaquina.piezasTotal?.toLocaleString()} / {metricasMaquina.produccionTeorica?.toLocaleString()} pz
              </p>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Calidad</p>
              <h4 className={`text-3xl font-black ${getTextColor(metricasMaquina.calidad)}`}>{metricasMaquina.calidad}%</h4>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-normal mt-1 leading-tight">
                {metricasMaquina.piezasBuenas?.toLocaleString()} / {metricasMaquina.piezasTotal?.toLocaleString()} pz
              </p>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase mb-2">Paros No Prog.</p>
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-500">{metricasMaquina.t_paros_noprog_min} min</h4>
            </div>
          </div>

          {avanceSemanal && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <BarChartAvanceSemanal data={avanceSemanal} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Gráfica Lotes Específica */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <BarChartLotes data={datosLotes} />
            </div>

            {/* Gráfica Dona */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col">
              <div className="flex items-center gap-3 mb-8 border-b border-slate-100 dark:border-slate-800 pb-4">
                <PieChart className="w-6 h-6 text-cyan-500" />
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Distribución de Tiempo</h3>
              </div>

              <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-6">
                <DonutChart
                  tSetup={metricasMaquina.t_paros_setup_min}
                  tComida={metricasMaquina.t_paros_comida_min}
                  tDespeje={metricasMaquina.t_paros_despeje_min}
                  tNoProg={metricasMaquina.t_paros_noprog_min}
                  tEfectivo={metricasMaquina.t_produciendo_min}
                  tAusencia={metricasMaquina.t_ausencia_min}
                />

                <div className="space-y-4 w-full md:w-auto">
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-600 dark:text-slate-300">Prod. Efectiva</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_produciendo_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-600 dark:text-slate-300">Set Up</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_setup_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-sky-500"></div><span className="text-slate-600 dark:text-slate-300">Comida</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_comida_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-slate-600 dark:text-slate-300">Despeje</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_despeje_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-slate-600 dark:text-slate-300">Paros No Prog.</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_noprog_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-amber-500"></div><span className="text-slate-600 dark:text-slate-300">Ausencia</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_ausencia_min} m</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pareto Real */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
              <div className="flex items-center gap-3 mb-2 border-b border-slate-100 dark:border-slate-800 pb-4">
                <TrendingUp className="w-6 h-6 text-orange-500" />
                <h3 className="text-xl font-extrabold text-slate-800 dark:text-white">Diagrama de Pareto de Paros</h3>
              </div>

              <ParetoChart data={metricasMaquina.paretoData} />

              <div className="flex justify-center gap-8 mt-12 border-t border-slate-100 dark:border-slate-800 pt-6">
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><div className="w-4 h-4 bg-blue-600 rounded-sm"></div> Minutos Perdidos (Eje Izq.)</div>
                <div className="flex items-center gap-2 text-sm font-bold text-slate-600 dark:text-slate-300"><div className="w-5 h-1 bg-orange-500 rounded-sm"></div> % Acumulado (Eje Der.)</div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* 👇 TABLA DE RENDIMIENTO POR LOTE 👇 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
          <Box className="w-5 h-5 text-teal-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Desempeño Detallado por Lote</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-white dark:bg-slate-900">
                <th className="px-6 py-4 font-bold">Lote</th>
                <th className="px-6 py-4 font-bold text-center">Piezas Buenas</th>
                <th className="px-6 py-4 font-bold text-center">Scrap</th>
                <th className="px-6 py-4 font-bold text-center">Total</th>
                <th className="px-6 py-4 font-bold text-center">H. Disp.</th>
                <th className="px-6 py-4 font-bold text-center">H. Paro</th>
                <th className="px-6 py-4 font-bold text-center">H. Efec.</th>
                <th className="px-6 py-4 font-bold text-center">Vel.</th>
                <th className="px-6 py-4 font-bold text-center">P. Teórica</th>
                <th className="px-6 py-4 font-bold text-center">Desempeño</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tablaRendimientoLotes.length > 0 ? (
                tablaRendimientoLotes.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{row.lote}</td>
                    <td className="px-6 py-4 text-center font-bold text-emerald-600">{row.buenas}</td>
                    <td className="px-6 py-4 text-center font-bold text-rose-500">{row.malas}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-700 dark:text-slate-300">{row.total}</td>
                    <td className="px-4 py-4 text-center text-sm font-mono text-slate-600 dark:text-slate-400">{row.horasDisponibles?.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center text-sm font-mono text-slate-600 dark:text-slate-400">{row.horasParos?.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center text-sm font-mono text-slate-600 dark:text-slate-400">{row.horasEfectivas?.toFixed(1)}</td>
                    <td className="px-4 py-4 text-center text-sm font-mono text-slate-600 dark:text-slate-400">{row.velocidad_producto || 6000}</td>
                    <td className="px-4 py-4 text-center text-sm font-mono text-slate-600 dark:text-slate-400">{Math.round(row.prodTeorica || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold border ${getColorOEE(row.rendimiento)}`}>
                        {row.rendimiento}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                    No hay datos de producción con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 👇 TABLA: REGISTRO DE PAROS "OTROS" 👇 */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 bg-slate-50/50 dark:bg-slate-800/50">
          <AlertCircle className="w-5 h-5 text-orange-500" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Auditoría de Paros "Otros"</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-white dark:bg-slate-900">
                <th className="px-6 py-4 font-bold">Fecha</th>
                <th className="px-6 py-4 font-bold">Máquina</th>
                <th className="px-6 py-4 font-bold">Lote</th>
                <th className="px-6 py-4 font-bold">Horario</th>
                <th className="px-6 py-4 font-bold">Duración</th>
                <th className="px-6 py-4 font-bold">Descripción / Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {parosOtros.length > 0 ? (
                parosOtros.map((row: any, idx: number) => {
                  const duracion = getHoursDiff(row.hora_inicio, row.hora_termino) * 60;
                  return (
                    <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-700 dark:text-slate-300">{row.fecha_produccion || row.fecha || 'Hoy'}</td>
                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100 uppercase">
                        {maquinas.find(m => m.id_maquina === row.id_maquina)?.maquina || row.id_maquina}
                      </td>
                      <td className="px-6 py-4 font-semibold text-slate-600 dark:text-slate-400">{row.lote || row.id_lote || 'Sin lote'}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{row.hora_inicio} - {row.hora_termino || 'Abierto'}</td>
                      <td className="px-6 py-4 font-bold text-rose-500">{Math.round(duracion)} min</td>
                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">{row.descripcion_paro || row.detalles || 'Sin detalles registrados'}</td>
                    </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No hay registros de paros categorizados como "Otros" en el periodo seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}