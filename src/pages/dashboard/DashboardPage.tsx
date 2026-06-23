import { useState, useEffect, useMemo, useRef } from 'react';
import { ApiService } from '../../services/ApiService';
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  
  const [produccion, setProduccion] = useState<any[]>([]);
  const [paros, setParos] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [turnos, setTurnos] = useState<Turno[]>([]);
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [lotes, setLotes] = useState<any[]>([]); 

  const [filtrosSemanas, setFiltrosSemanas] = useState<string[]>([]);
  const [filtrosTurnos, setFiltrosTurnos] = useState<string[]>([]);
  const [filtrosLotes, setFiltrosLotes] = useState<string[]>([]);
  
  const [filtroMaquina, setFiltroMaquina] = useState('todas');

  useEffect(() => {
    setFiltrosLotes([]);
  }, [filtroMaquina]);

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [prodData, parosData, maqData, turnosData, semData, lotesData] = await Promise.all([
        ApiService.getAllProduccion(),
        ApiService.getAllRegistroParos(),
        ApiService.getAllMaquinas(),
        ApiService.getAllTurnos(),
        ApiService.getAllSemanas(),
        ApiService.getAllLotes() 
      ]);
      setProduccion(prodData || []);
      setParos(parosData || []);
      setMaquinas(maqData || []);
      setTurnos(turnosData || []);
      setLotes(lotesData || []); 

      const listaSemanas = semData || [];
      setSemanas(listaSemanas);
      
      if (listaSemanas.length > 0) {
        const semanasOrdenadas = [...listaSemanas].sort((a: any, b: any) => {
           if (a.fecha_inicio && b.fecha_inicio) {
               const parseDate = (dStr: string) => {
                 let parts = dStr.split('/');
                 if (parts.length !== 3) parts = dStr.split('-');
                 if (parts.length === 3) {
                   const isYearFirst = parts[0].length === 4;
                   const year = parseInt(isYearFirst ? parts[0] : parts[2], 10);
                   const month = parseInt(parts[1], 10) - 1;
                   const day = parseInt(isYearFirst ? parts[2] : parts[0], 10);
                   return new Date(year, month, day).getTime();
                 }
                 return 0;
               };
               return parseDate(b.fecha_inicio) - parseDate(a.fecha_inicio);
           }
           return String(b.id_semana).localeCompare(String(a.id_semana));
        });

        const idSemanaMasReciente = semanasOrdenadas[0].id_semana;
        setFiltrosSemanas([idSemanaMasReciente]);
      }

    } catch (error) {
      console.error("Error cargando dashboard:", error);
    } finally {
      setLoading(false);
    }
  };

  const getHoursDiff = (start: string, end: string) => {
    if (!start || !end || end === "00:00:00") return 0;
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

  const calcularMetricas = (prod: any[], parosLogs: any[], catTurnos: Turno[]) => {
    let t_paros_prog = 0;
    let t_paros_despeje = 0; 
    let t_paros_noprog = 0;
    let piezasBuenas = 0;
    let piezasTotal = 0;

    const turnosOperados = new Set<string>();

    prod.forEach(p => {
      const fecha = p.fecha_produccion || p.fecha || 'SinFecha';
      if (p.id_turno) turnosOperados.add(`${fecha}|${p.id_turno}`);
      
      piezasBuenas += Number(p.piezas_buenas) || 0;
      piezasTotal += Number(p.piezas_producidas) || 0;
    });

    const conteoParos: Record<string, number> = {};

    parosLogs.forEach(p => {
      const horas = getHoursDiff(p.hora_inicio, p.hora_termino);
      
      const nombreParo = String(p.paro || p.descripcion_paro || '').toUpperCase();
      const idParoCrudo = String(p.id_paro || '').toUpperCase();

      const fecha = p.fecha_produccion || p.fecha || 'SinFecha';
      if (p.id_turno) turnosOperados.add(`${fecha}|${p.id_turno}`);

      if (nombreParo.includes('DESPEJE') || idParoCrudo === 'PAROP2') {
        t_paros_despeje += horas;
      } 
      else if (nombreParo.includes('SET UP') || nombreParo.includes('SETUP') || nombreParo.includes('COMIDA') || idParoCrudo === 'PAROP1') {
        t_paros_prog += horas;
      } 
      else {
        t_paros_noprog += horas;
        const nombre = p.paro || p.descripcion_paro || 'Otro';
        conteoParos[nombre] = (conteoParos[nombre] || 0) + (horas * 60);
      }
    });

    let tiempo_disponible_total = 0;
    
    turnosOperados.forEach(clave => {
      const [, id_turno] = clave.split('|'); 
      const turnoObj = catTurnos.find(t => t.id_turno === id_turno);
      let horasTurno = 0;
      if (turnoObj) {
        if (turnoObj.hora_inicio && turnoObj.hora_termino) {
            horasTurno = getHoursDiff(turnoObj.hora_inicio, turnoObj.hora_termino);
        } else if ((turnoObj as any).horas) { 
            horasTurno = Number((turnoObj as any).horas);
        }
      }
      if (horasTurno <= 0) horasTurno = 8.5; 
      
      tiempo_disponible_total += horasTurno;
    });

    if (tiempo_disponible_total === 0) {
      let brutoFallback = 0;
      prod.forEach(p => { brutoFallback += getHoursDiff(p.hora_inicio, p.hora_termino); });
      tiempo_disponible_total = brutoFallback > 0 ? brutoFallback : 8.5;
    }

    const total_paros = t_paros_prog + t_paros_despeje + t_paros_noprog;
    const t_produciendo = Math.max(tiempo_disponible_total - total_paros, 0);

    let calcDisp = tiempo_disponible_total > 0 ? (t_produciendo / tiempo_disponible_total) * 100 : 0;
    
    let velocidadIdeal = 6000;
    const prodConVelocidad = prod.find(p => Number(p.velocidad) > 0);
    if (prodConVelocidad) {
      velocidadIdeal = Number(prodConVelocidad.velocidad);
    }
    
    const produccionTeorica = t_produciendo * velocidadIdeal;
    
    let calcRend = produccionTeorica > 0 ? (piezasTotal / produccionTeorica) * 100 : 0;
    let calcCal = piezasTotal > 0 ? (piezasBuenas / piezasTotal) * 100 : 0;

    calcDisp = isNaN(calcDisp) || !isFinite(calcDisp) ? 0 : calcDisp;
    calcRend = isNaN(calcRend) || !isFinite(calcRend) ? 0 : calcRend;
    calcCal = isNaN(calcCal) || !isFinite(calcCal) ? 0 : calcCal;

    let calcOee = (calcDisp * calcRend * calcCal) / 10000; 
    calcOee = isNaN(calcOee) || !isFinite(calcOee) ? 0 : calcOee;

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
      oee: Math.min(Math.round(calcOee), 100),
      disponibilidad: Math.min(Math.round(calcDisp), 100),
      rendimiento: Math.min(Math.round(calcRend), 100),
      calidad: Math.min(Math.round(calcCal), 100),
      piezasBuenas,
      piezasTotal,
      produccionTeorica,
      t_produciendo_min: Math.round(t_produciendo * 60),
      t_paros_prog_min: t_paros_prog > 0 && Math.round(t_paros_prog * 60) === 0 ? 1 : Math.round(t_paros_prog * 60),
      t_paros_despeje_min: t_paros_despeje > 0 && Math.round(t_paros_despeje * 60) === 0 ? 1 : Math.round(t_paros_despeje * 60), 
      t_paros_noprog_min: t_paros_noprog > 0 && Math.round(t_paros_noprog * 60) === 0 ? 1 : Math.round(t_paros_noprog * 60),
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
  };

  const getAbsoluteLatest = (records: any[]) => {
    if (records.length === 0) return null;
    return [...records].sort((a, b) => {
      const tA = parseDateTime(a.fecha_produccion || a.fecha, a.hora_inicio);
      const tB = parseDateTime(b.fecha_produccion || b.fecha, b.hora_inicio);
      return tB - tA; 
    })[0];
  };

  const datosGenerales = useMemo(() => {
    const p = applyFilters(produccion, 'prod');
    const pr = applyFilters(paros, 'paro', p);

    const NOW = new Date().getTime();

    return maquinas.map(maq => {
      const prodMaq = p.filter(x => isFromMaquina(x, maq));
      const parosMaq = pr.filter(x => isFromMaquina(x, maq));
      const met = calcularMetricas(prodMaq, parosMaq, turnos);
      
      const allProdMaq = produccion.filter(x => isFromMaquina(x, maq));
      const allParosMaq = paros.filter(x => isFromMaquina(x, maq));
      
      let estado = 'inactiva'; 

      const openParos = allParosMaq.filter(x => {
        const isClosed = x.hora_termino && String(x.hora_termino).trim() !== "" && String(x.hora_termino).trim() !== "00:00:00";
        if (isClosed) return false;
        const ms = parseDateTime(x.fecha_produccion || x.fecha, x.hora_inicio);
        return (NOW - ms) / 3600000 <= 24; 
      });

      const openProds = allProdMaq.filter(x => {
        const isClosed = x.hora_termino && String(x.hora_termino).trim() !== "" && String(x.hora_termino).trim() !== "00:00:00";
        if (isClosed) return false;
        const ms = parseDateTime(x.fecha_produccion || x.fecha, x.hora_inicio);
        return (NOW - ms) / 3600000 <= 24;
      });

      const latestParo = getAbsoluteLatest(openParos);
      const latestProd = getAbsoluteLatest(openProds);

      if (latestParo && !latestProd) {
         const nombreParo = String(latestParo.paro || latestParo.descripcion_paro || latestParo.id_paro || '').toUpperCase();
         estado = (nombreParo.includes('SET UP') || nombreParo.includes('SETUP') || nombreParo.includes('COMIDA') || nombreParo.includes('DESPEJE') || nombreParo === 'PAROP1' || nombreParo === 'PAROP2') ? 'setup' : 'paro';
      } 
      else if (!latestParo && latestProd) {
         estado = 'produciendo';
      } 
      else if (latestParo && latestProd) {
         const tParo = parseDateTime(latestParo.fecha_produccion || latestParo.fecha, latestParo.hora_inicio);
         const tProd = parseDateTime(latestProd.fecha_produccion || latestProd.fecha, latestProd.hora_inicio);

         if (tParo >= tProd) {
            const nombreParo = String(latestParo.paro || latestParo.descripcion_paro || latestParo.id_paro || '').toUpperCase();
            estado = (nombreParo.includes('SET UP') || nombreParo.includes('SETUP') || nombreParo.includes('COMIDA') || nombreParo.includes('DESPEJE') || nombreParo === 'PAROP1' || nombreParo === 'PAROP2') ? 'setup' : 'paro';
         } else {
            estado = 'produciendo';
         }
      }

      return { maquina: maq.maquina, ...met, estado };
    });
  }, [produccion, paros, filtrosSemanas, filtrosTurnos, filtrosLotes, maquinas, turnos]);


  const metricasMaquina = useMemo(() => {
    if (filtroMaquina === 'todas') return null;
    const selectedMaq = maquinas.find(m => m.id_maquina === filtroMaquina);
    if (!selectedMaq) return null;

    let p = applyFilters(produccion.filter(x => isFromMaquina(x, selectedMaq)), 'prod');
    let pr = applyFilters(paros.filter(x => isFromMaquina(x, selectedMaq)), 'paro', p);
    
    return calcularMetricas(p, pr, turnos);
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
    
    return prFiltrada.filter(paroObj => {
      const nombreParo = String(paroObj.paro || paroObj.descripcion_paro || '').toUpperCase();
      const idParoCrudo = String(paroObj.id_paro || '').toUpperCase();
      
      if (nombreParo.includes('SET UP') || nombreParo.includes('SETUP') || nombreParo.includes('DESPEJE') || nombreParo.includes('COMIDA')) return false;
      if (idParoCrudo === 'PAROP1' || idParoCrudo === 'PAROP2') return false;

      return true; 
    }).sort((a, b) => {
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

      // --- MODO ESPÍA: Ver exactamente QUÉ lotes del catálogo está jalando React ---
      let programados = 0;
      const nombresLotesMisteriosos: string[] = []; // Array espía

      lotes.forEach(l => {
        let pertenece = false;
        if (Array.isArray(l.maquinas)) {
          pertenece = l.maquinas.some((mObj: any) => {
            const catId = String(mObj?.id_maquina || '').trim().toLowerCase();
            const catName = String(mObj?.maquina || '').trim().toLowerCase();
            return catId === mId || catId === mName || catName === mId || catName === mName;
          });
        }
        
        const passSemana = filtrosSemanas.length === 0 || filtrosSemanas.some(fs => String(fs).trim() === String(l.id_semana || '').trim());
        const passTurno = filtrosTurnos.length === 0 || filtrosTurnos.some(ft => String(ft).trim() === String(l.id_turno || '').trim());
        const passLote = filtrosLotes.length === 0 || filtrosLotes.some(fl => String(fl).trim() === String(l.lote || l.id_lote || '').trim());

        if (pertenece && passSemana && passTurno && passLote) {
          programados++;
          nombresLotesMisteriosos.push(`ID interno: ${l.id || l.id_lote} | Lote: ${l.lote}`); // Guardamos el nombre para el log
        }
      });

      // Imprimimos el reporte en la consola de Chrome si hay lotes programados encontrados
      if (programados > 0) {
         console.log(`%c🔍 REPORTE DE REACT PARA LA MÁQUINA: ${maq.maquina.toUpperCase()}`, 'background: #222; color: #bada55; padding: 4px; font-weight: bold;');
         console.log(`↳ Lotes encontrados en el catálogo maestro para los filtros actuales: ${programados}`);
         console.table(nombresLotesMisteriosos);
      }
      // -----------------------------------------------------------------------------

      const pFiltered = applyFilters(produccion, 'prod');
      const prodDeMaquina = pFiltered.filter(x => isFromMaquina(x, maq));
      
      const mapLotesUnicos = new Map<string, any>();

      prodDeMaquina.forEach(x => {
        const nombreReal = String(x.lote || x.id_lote || '').trim();
        const lKey = nombreReal.toLowerCase();
        
        if (lKey && !mapLotesUnicos.has(lKey)) {
           mapLotesUnicos.set(lKey, { originalName: nombreReal });
        }
      });

      let completados = 0; 
      let pendientes = 0;  

      mapLotesUnicos.forEach((_, lKey) => {
        const globalLote = lotes.find(g => 
           String(g.lote || '').trim().toLowerCase() === lKey || 
           String(g.id_lote || '').trim().toLowerCase() === lKey || 
           String(g.id || '').trim().toLowerCase() === lKey
        );

        if (globalLote) {
           const isActivo = globalLote.estatus === true || String(globalLote.estatus).toLowerCase() === 'true';
           if (isActivo) {
               pendientes++;
           } else {
               completados++;
           }
        } else {
           const prodsDelLote = prodDeMaquina.filter(x => String(x.lote || x.id_lote || '').trim().toLowerCase() === lKey);
           const todasCerradas = prodsDelLote.every(x => x.hora_termino && x.hora_termino !== "00:00:00" && String(x.hora_termino).trim() !== "");
           if (todasCerradas && prodsDelLote.length > 0) {
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
    }).filter(d => d.totales > 0); 
  }, [produccion, lotes, maquinas, filtrosSemanas, filtrosTurnos, filtrosLotes, filtroMaquina]);

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
      
      if (Number(reg.velocidad) > 0) {
        agrupados[loteKey].velocidad_producto = Number(reg.velocidad);
      }
      
      const hs = getHoursDiff(reg.hora_inicio, reg.hora_termino);
      agrupados[loteKey].horasDisponibles += hs;
    });

    prFiltrada.forEach(paro => {
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

      return { ...g, malas, rendimiento: Math.min(Math.round(rendimiento), 100) };
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

  if (loading) return (
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

  const BarChartLotes = ({ data }: { data: any[] }) => {
    const totalLotes = data.reduce((sum, d) => sum + d.totales, 0);
    const totalProgramados = data.reduce((sum, d) => sum + (d.programados || 0), 0);

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

        <div className="flex-1 relative border-l border-r border-b border-slate-300 pb-10">
          {[0, 25, 50, 75, 100].map(pct => (
            <div key={pct} className="absolute left-0 right-0 border-t border-slate-100" style={{ bottom: `${pct}%`, top: pct===100?'0':undefined }}></div>
          ))}
          <div className="absolute inset-0 flex items-end justify-around px-2 z-10">
            {data.map((d, i) => (
              <div key={i} className="w-[12%] bg-blue-600 rounded-t-sm flex flex-col items-center justify-start group relative" style={{ height: `${(d.minutos / maxMin) * 100}%` }}>
                <span className="opacity-0 group-hover:opacity-100 absolute -top-5 text-black bg-white shadow px-1 rounded text-[10px]">{d.minutos}m</span>
              </div>
            ))}
          </div>

          <svg className="absolute inset-0 w-full h-full z-20 overflow-visible" preserveAspectRatio="none">
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

          <div className="absolute bottom-0 left-0 right-0 h-10 flex justify-around items-start translate-y-full pt-2">
            {data.map((d, i) => (
              <div key={i} className="w-[12%] text-center break-words leading-tight text-[9px]" title={d.nombre}>
                {d.nombre.length > 12 ? d.nombre.substring(0, 12) + '...' : d.nombre}
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

  const DonutChart = ({ tProg, tNoProg, tEfectivo, tDespeje }: any) => {
    const total = tProg + tNoProg + tEfectivo + tDespeje || 1;
    const pEfectivo = (tEfectivo / total) * 100;
    const pProg = (tProg / total) * 100;
    const pDespeje = (tDespeje / total) * 100;
    
    return (
      <div className="w-48 h-48 rounded-full relative shadow-sm"
        style={{
          background: `conic-gradient(
            #10b981 0% ${pEfectivo}%, 
            #3b82f6 ${pEfectivo}% ${pEfectivo + pProg}%, 
            #a855f7 ${pEfectivo + pProg}% ${pEfectivo + pProg + pDespeje}%,
            #f43f5e ${pEfectivo + pProg + pDespeje}% 100%
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
                    <th className="px-6 py-4 font-bold text-center">Rendimiento</th>
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
                      </td>
                      <td className={`px-6 py-4 text-center font-bold ${getTextColor(row.disponibilidad)}`}>{row.disponibilidad}%</td>
                      <td className={`px-6 py-4 text-center font-bold ${getTextColor(row.rendimiento)}`}>{row.rendimiento}%</td>
                      <td className={`px-6 py-4 text-center font-bold ${getTextColor(row.calidad)}`}>{row.calidad}%</td>
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
                    <span className="text-xs font-semibold text-slate-400 capitalize">{row.estado === 'setup' ? 'Set Up' : row.estado}</span>
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

          <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
            <BarChartLotes data={datosLotes} />
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
              </div>
              <div className={`p-4 rounded-full ${getColorOEE(metricasMaquina.oee).replace('text-', 'bg-').replace('bg-', 'bg-opacity-20 text-')}`}>
                <Activity className="w-10 h-10" />
              </div>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Disponibilidad</p>
              <h4 className={`text-3xl font-black ${getTextColor(metricasMaquina.disponibilidad)}`}>{metricasMaquina.disponibilidad}%</h4>
            </div>
            
            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Rendimiento</p>
              <h4 className={`text-3xl font-black ${getTextColor(metricasMaquina.rendimiento)}`}>{metricasMaquina.rendimiento}%</h4>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-slate-200 bg-white dark:bg-slate-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase mb-2">Calidad</p>
              <h4 className={`text-3xl font-black ${getTextColor(metricasMaquina.calidad)}`}>{metricasMaquina.calidad}%</h4>
            </div>

            <div className="col-span-1 p-5 rounded-2xl shadow-sm border border-rose-200 bg-rose-50 dark:bg-rose-950/20 dark:border-rose-900 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-bold text-rose-700 dark:text-rose-400 uppercase mb-2">Paros No Prog.</p>
              <h4 className="text-2xl font-black text-rose-600 dark:text-rose-500">{metricasMaquina.t_paros_noprog_min} min</h4>
            </div>
          </div>

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
                  tProg={metricasMaquina.t_paros_prog_min} 
                  tDespeje={metricasMaquina.t_paros_despeje_min} 
                  tNoProg={metricasMaquina.t_paros_noprog_min} 
                  tEfectivo={metricasMaquina.t_produciendo_min} 
                />
                
                <div className="space-y-4 w-full md:w-auto">
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-emerald-500"></div><span className="text-slate-600 dark:text-slate-300">Prod. Efectiva</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_produciendo_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500"></div><span className="text-slate-600 dark:text-slate-300">Set Up / Comida</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_prog_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500"></div><span className="text-slate-600 dark:text-slate-300">Despeje</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_despeje_min} m</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 text-sm font-semibold">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-rose-500"></div><span className="text-slate-600 dark:text-slate-300">Paros No Prog.</span></div>
                    <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">{metricasMaquina.t_paros_noprog_min} m</span>
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
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Rendimiento Detallado por Lote</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider bg-white dark:bg-slate-900">
                <th className="px-6 py-4 font-bold">Lote</th>
                <th className="px-6 py-4 font-bold text-center">Piezas Buenas</th>
                <th className="px-6 py-4 font-bold text-center">Scrap (Malas)</th>
                <th className="px-6 py-4 font-bold text-center">Total Producido</th>
                <th className="px-6 py-4 font-bold text-center">Rendimiento</th>
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
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-bold border ${getColorOEE(row.rendimiento)}`}>
                        {row.rendimiento}%
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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