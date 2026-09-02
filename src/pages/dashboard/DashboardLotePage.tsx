import { useState, useEffect, useMemo } from 'react';
import { ApiService } from '../../services/ApiService';
import { Factory, TrendingUp, AlertCircle, RefreshCw, PieChart, Box } from 'lucide-react';
import type { Maquina } from '../../interfaces/maquinas';
import type { Semana } from '../../interfaces/semanas';

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

const DonutChart = ({ tSetup, tComida, tNoProg, tEfectivo, tDespeje }: any) => {
  const total = tSetup + tComida + tNoProg + tEfectivo + tDespeje || 1;
  const pEfectivo = (tEfectivo / total) * 100;
  const pSetup = (tSetup / total) * 100;
  const pComida = (tComida / total) * 100;
  const pDespeje = (tDespeje / total) * 100;

  return (
    <div className="w-48 h-48 rounded-full relative shadow-sm"
      style={{
        background: `conic-gradient(
          #10b981 0% ${pEfectivo}%, 
          #3b82f6 ${pEfectivo}% ${pEfectivo + pSetup}%, 
          #0ea5e9 ${pEfectivo + pSetup}% ${pEfectivo + pSetup + pComida}%, 
          #a855f7 ${pEfectivo + pSetup + pComida}% ${pEfectivo + pSetup + pComida + pDespeje}%,
          #f43f5e ${pEfectivo + pSetup + pComida + pDespeje}% 100%
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

const calcularMetricas = (prod: any[], parosLogs: any[]) => {
  let tiempoIdealTotal = 0;
  let tiempoRealTotal = 0;
  let piezasBuenas = 0;
  let piezasReales = 0;
  let piezasEsperadas = 0;

  let t_paros_setup = 0;
  let t_paros_comida = 0;
  let t_paros_despeje = 0;
  let t_paros_noprog = 0;
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

  prod.forEach(p => {
    if (p.hora_termino === "00:00:00" && String(p.estatus) !== "false") return;
    const horas_brutas = getHoursDiff(p.hora_inicio, p.hora_termino);
    tiempoIdealTotal += horas_brutas;

    const prodReales = Number(p.piezas_producidas) || 0;
    const prodBuenas = Number(p.piezas_buenas) || 0;

    piezasReales += prodReales;
    piezasBuenas += prodBuenas;

    let horas_paros_prod = 0;
    parosLogs
      .filter(paro => paro.estatus !== true && (String(paro.id_produccion) === String(p.id_produccion) || String(paro.id_produccion) === String(p.id)))
      .forEach(paro => {
        horas_paros_prod += getHoursDiff(paro.hora_inicio, paro.hora_termino);
      });

    const tiempoRealReg = Math.max(horas_brutas - horas_paros_prod, 0);
    tiempoRealTotal += tiempoRealReg;
    const vel = Number(p.produccionxHora) || Number(p.velocidad) || 6000;
    piezasEsperadas += (tiempoRealReg * vel);
  });

  const D = tiempoIdealTotal > 0 ? tiempoRealTotal / tiempoIdealTotal : 0;
  const R = piezasEsperadas > 0 ? piezasReales / piezasEsperadas : 0;
  const C = piezasReales > 0 ? piezasBuenas / piezasReales : 0;
  const O = D * R * C;

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
    oee: Math.round(O * 10000) / 100,
    disponibilidad: Math.round(D * 10000) / 100,
    rendimiento: Math.round(R * 10000) / 100,
    calidad: Math.round(C * 10000) / 100,
    piezasBuenas,
    piezasTotal: piezasReales,
    produccionTeorica: piezasEsperadas,
    t_produciendo_min: Math.round(tiempoRealTotal * 60),
    t_ideal_min: Math.round(tiempoIdealTotal * 60),
    t_paros_setup_min: Math.round(t_paros_setup * 60),
    t_paros_comida_min: Math.round(t_paros_comida * 60),
    t_paros_despeje_min: Math.round(t_paros_despeje * 60),
    t_paros_noprog_min: Math.round(t_paros_noprog * 60),
    tiempoIdeal: tiempoIdealTotal,
    tiempoReal: tiempoRealTotal,
    paretoData
  };
};

const getColorOEE = (val: number) => {
  if (val >= 85) return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  if (val >= 60) return 'text-amber-600 bg-amber-50 border-amber-200';
  return 'text-rose-600 bg-rose-50 border-rose-200';
};

const getTextColor = (val: number) => {
  if (val >= 85) return 'text-emerald-600';
  if (val >= 60) return 'text-amber-500';
  return 'text-rose-600';
};

export default function DashboardLotePage() {
  const [loading, setLoading] = useState(true);

  const [produccion, setProduccion] = useState<any[]>([]);
  const [paros, setParos] = useState<any[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [lotes, setLotes] = useState<any[]>([]);

  const [filtroSemana, setFiltroSemana] = useState('');
  const [filtroMaquina, setFiltroMaquina] = useState('todas');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    setLoading(true);
    try {
      const [prodData, parosData, maqData, semData, lotesData] = await Promise.all([
        ApiService.getAllProduccion(),
        ApiService.getAllRegistroParos(),
        ApiService.getAllMaquinas(),
        ApiService.getAllSemanas(),
        ApiService.getAllLotes(),
      ]);
      setProduccion(prodData || []);
      setParos(parosData || []);
      setMaquinas(maqData || []);
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
        setFiltroSemana(idSemanaMasReciente);
      }
    } catch (error) {
      console.error("Error cargando datos para el Dashboard Lote:", error);
    } finally {
      setLoading(false);
    }
  };

  const lotesDeSemana = useMemo(() => {
    if (!filtroSemana) return [];
    return lotes.filter(l => String(l.id_semana) === String(filtroSemana));
  }, [lotes, filtroSemana]);

  const datosAgrupadosLotes = useMemo(() => {
    if (lotesDeSemana.length === 0) return [];

    const resultados: any[] = [];

    lotesDeSemana.forEach(lote => {
      const idLote = String(lote.lote || lote.id_lote || '').trim();
      const prodLote = produccion.filter(p => String(p.lote || p.id_lote || '').trim() === idLote);
      const parosLote = paros.filter(p => p.estatus !== true && String(p.lote || p.id_lote || '').trim() === idLote);

      let prodFiltrada = prodLote;
      let parosFiltrada = parosLote;

      if (filtroMaquina !== 'todas') {
        const maq = maquinas.find(m => m.id_maquina === filtroMaquina);
        if (maq) {
          prodFiltrada = prodLote.filter(p => isFromMaquina(p, maq));
          parosFiltrada = parosLote.filter(p => isFromMaquina(p, maq));
        }
      }

      if (filtroMaquina !== 'todas' && prodFiltrada.length === 0) return;

      const globalMetrics = calcularMetricas(prodFiltrada, parosFiltrada);

      const maquinasDesglose: any[] = [];
      if (filtroMaquina === 'todas') {
        const maquinasUsadas = new Set(prodFiltrada.map(p => p.id_maquina));
        maquinasUsadas.forEach(idMaq => {
           const maq = maquinas.find(m => m.id_maquina === idMaq);
           if (maq) {
             const prodM = prodFiltrada.filter(p => isFromMaquina(p, maq));
             const parosM = parosFiltrada.filter(p => isFromMaquina(p, maq));
             const met = calcularMetricas(prodM, parosM);
             if (prodM.length > 0) {
               maquinasDesglose.push({ maquina: maq.maquina, ...met });
             }
           }
        });
      }

      resultados.push({
        lote: lote.lote || lote.id_lote,
        descripcion: lote.descripcion,
        producto: lote.producto,
        global: globalMetrics,
        maquinasDesglose
      });
    });

    return resultados;
  }, [produccion, paros, lotesDeSemana, filtroMaquina, maquinas]);

  const resumenSemanal = useMemo(() => {
    if (datosAgrupadosLotes.length === 0) return null;

    let sumTiempoIdeal = 0;
    let sumTiempoReal = 0;
    let sumPzsEsperadas = 0;
    let sumPzsReales = 0;
    let sumPzsBuenas = 0;

    datosAgrupadosLotes.forEach(l => {
      sumTiempoIdeal += l.global.tiempoIdeal;
      sumTiempoReal += l.global.tiempoReal;
      sumPzsEsperadas += l.global.produccionTeorica;
      sumPzsReales += l.global.piezasTotal;
      sumPzsBuenas += l.global.piezasBuenas;
    });

    const D = sumTiempoIdeal > 0 ? sumTiempoReal / sumTiempoIdeal : 0;
    const R = sumPzsEsperadas > 0 ? sumPzsReales / sumPzsEsperadas : 0;
    const C = sumPzsReales > 0 ? sumPzsBuenas / sumPzsReales : 0;
    const O = D * R * C;

    return {
      oee: Math.round(O * 10000) / 100,
      disponibilidad: Math.round(D * 10000) / 100,
      rendimiento: Math.round(R * 10000) / 100,
      calidad: Math.round(C * 10000) / 100,
    };

  }, [datosAgrupadosLotes]);

  return (
    <div className="w-full h-full min-h-screen bg-slate-50 dark:bg-slate-900 p-2 sm:p-4 lg:p-6 transition-colors duration-300 font-sans">
      
      <div className="bg-white dark:bg-slate-950 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 mb-6 flex flex-col md:flex-row md:items-center justify-between gap-6 transition-colors duration-300">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800 dark:text-white flex items-center gap-3">
            <Box className="w-8 h-8 text-indigo-500" />
            Dashboard OEE por Lote
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Análisis de Eficiencia agrupado por Lote para una semana programada.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Semana</label>
            <select
              value={filtroSemana}
              onChange={(e) => setFiltroSemana(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              {semanas.map(s => (
                <option key={s.id_semana} value={s.id_semana}>{s.descripcion || s.id_semana}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col w-full sm:w-auto">
            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase tracking-wider">Máquina</label>
            <select
              value={filtroMaquina}
              onChange={(e) => setFiltroMaquina(e.target.value)}
              className="bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
            >
              <option value="todas">Todas</option>
              {maquinas.map(m => (
                <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>
              ))}
            </select>
          </div>

          <button 
            onClick={cargarDatos}
            className="self-end sm:self-auto bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/30 p-2.5 rounded-xl hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : datosAgrupadosLotes.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-12 flex flex-col items-center justify-center text-center">
          <div className="w-20 h-20 bg-slate-50 dark:bg-slate-900 rounded-full flex items-center justify-center mb-4">
            <AlertCircle className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200">No hay lotes programados</h3>
          <p className="text-slate-500 dark:text-slate-400 mt-2 max-w-md">
            No se encontraron lotes para la semana y máquina seleccionadas.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {resumenSemanal && (
             <div className="bg-indigo-600 dark:bg-indigo-900 rounded-2xl shadow-sm border border-indigo-500 p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-bl-full -z-10"></div>
                <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><TrendingUp className="w-6 h-6" /> OEE Global de la Semana (Lotes Filtrados)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                   <div>
                     <p className="text-indigo-200 text-sm font-semibold uppercase">OEE</p>
                     <p className="text-4xl font-black">{resumenSemanal.oee}%</p>
                   </div>
                   <div>
                     <p className="text-indigo-200 text-sm font-semibold uppercase">Disponibilidad</p>
                     <p className="text-2xl font-bold">{resumenSemanal.disponibilidad}%</p>
                   </div>
                   <div>
                     <p className="text-indigo-200 text-sm font-semibold uppercase">Desempeño</p>
                     <p className="text-2xl font-bold">{resumenSemanal.rendimiento}%</p>
                   </div>
                   <div>
                     <p className="text-indigo-200 text-sm font-semibold uppercase">Calidad</p>
                     <p className="text-2xl font-bold">{resumenSemanal.calidad}%</p>
                   </div>
                </div>
             </div>
          )}

          <div className="space-y-8">
          {datosAgrupadosLotes.map((loteData, idx) => (
            <div key={idx} className="bg-slate-100 dark:bg-slate-900/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-800">
              
              <div className="flex items-center gap-3 mb-6 border-b border-slate-200 dark:border-slate-700 pb-4">
                <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center shadow-sm">
                  <Box className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-slate-800 dark:text-white uppercase tracking-wide">
                    {loteData.lote}
                  </h2>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {loteData.producto} {loteData.descripcion ? `- ${loteData.descripcion}` : ''}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-6">
                  <div className="bg-white dark:bg-slate-950 rounded-2xl p-6 shadow-sm border border-slate-200 dark:border-slate-800 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-bl-full -z-10"></div>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800">
                              <Factory className="w-6 h-6 text-indigo-500 dark:text-indigo-400" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white leading-tight">
                                OEE Lote Global
                              </h3>
                              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-0.5">
                                OEE: {loteData.global.oee}%
                              </p>
                            </div>
                          </div>
                          
                          <div className={`px-4 py-2 rounded-xl border-2 font-black text-2xl flex items-center gap-1 shadow-sm ${getColorOEE(loteData.global.oee)}`}>
                            {loteData.global.oee}%
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Disponibilidad</p>
                            <p className={`text-lg font-black ${getTextColor(loteData.global.disponibilidad)}`}>{loteData.global.disponibilidad}%</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Desempeño</p>
                            <p className={`text-lg font-black ${getTextColor(loteData.global.rendimiento)}`}>{loteData.global.rendimiento}%</p>
                          </div>
                          <div className="bg-slate-50 dark:bg-slate-900 rounded-xl p-3 border border-slate-100 dark:border-slate-800 text-center">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Calidad</p>
                            <p className={`text-lg font-black ${getTextColor(loteData.global.calidad)}`}>{loteData.global.calidad}%</p>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs font-semibold text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 py-2.5 px-4 rounded-xl border border-slate-100 dark:border-slate-800">
                          <div className="flex items-center gap-1.5">
                            <TrendingUp className="w-4 h-4 text-emerald-500" />
                            <span>Piezas: {loteData.global.piezasBuenas.toLocaleString()} / {loteData.global.piezasTotal.toLocaleString()}</span>
                          </div>
                          <div>
                            Hr Ideales: {loteData.global.tiempoIdeal.toFixed(1)}h
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
                        <div className="flex items-center gap-2 mb-4 w-full">
                          <PieChart className="w-5 h-5 text-indigo-500" />
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Distribución de Tiempo</h4>
                        </div>
                        <div className="flex-1 flex flex-col md:flex-row items-center justify-around gap-4 w-full">
                          <DonutChart
                            tSetup={loteData.global.t_paros_setup_min}
                            tComida={loteData.global.t_paros_comida_min}
                            tDespeje={loteData.global.t_paros_despeje_min}
                            tNoProg={loteData.global.t_paros_noprog_min}
                            tEfectivo={loteData.global.t_produciendo_min}
                          />

                          <div className="space-y-2.5 w-full md:w-auto text-xs font-semibold">
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div><span className="text-slate-600 dark:text-slate-300">Efectiva</span></div>
                              <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{loteData.global.t_produciendo_min} m</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div><span className="text-slate-600 dark:text-slate-300">Set Up</span></div>
                              <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{loteData.global.t_paros_setup_min} m</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-sky-500"></div><span className="text-slate-600 dark:text-slate-300">Comida</span></div>
                              <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{loteData.global.t_paros_comida_min} m</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500"></div><span className="text-slate-600 dark:text-slate-300">Despeje</span></div>
                              <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{loteData.global.t_paros_despeje_min} m</span>
                            </div>
                            <div className="flex items-center justify-between gap-3">
                              <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-rose-500"></div><span className="text-slate-600 dark:text-slate-300">No Prog.</span></div>
                              <span className="text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">{loteData.global.t_paros_noprog_min} m</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-800/20 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col">
                        <div className="flex items-center gap-2 mb-2 w-full">
                          <TrendingUp className="w-5 h-5 text-orange-500" />
                          <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200">Pareto de Paros</h4>
                        </div>
                        <div className="flex-1">
                          <ParetoChart data={loteData.global.paretoData} />
                        </div>
                      </div>

                    </div>
                  </div>
              </div>
              
              {filtroMaquina === 'todas' && loteData.maquinasDesglose.length > 0 && (
                 <div className="mt-4 bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                       <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">Desglose por Máquina</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
                            <th className="px-4 py-3 font-bold">Máquina</th>
                            <th className="px-4 py-3 font-bold text-center">T. Ideal (h)</th>
                            <th className="px-4 py-3 font-bold text-center">T. Real (h)</th>
                            <th className="px-4 py-3 font-bold text-center">Pzs Esperadas</th>
                            <th className="px-4 py-3 font-bold text-center">Pzs Reales</th>
                            <th className="px-4 py-3 font-bold text-center">Pzs Buenas</th>
                            <th className="px-4 py-3 font-bold text-center">D%</th>
                            <th className="px-4 py-3 font-bold text-center">R%</th>
                            <th className="px-4 py-3 font-bold text-center">C%</th>
                            <th className="px-4 py-3 font-bold text-center">OEE%</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                           {loteData.maquinasDesglose.map((maqD: any, idxD: number) => (
                             <tr key={idxD} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td className="px-4 py-3 font-bold text-slate-700 dark:text-slate-200 uppercase">{maqD.maquina}</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{maqD.tiempoIdeal.toFixed(1)}</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{maqD.tiempoReal.toFixed(1)}</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{Math.round(maqD.produccionTeorica).toLocaleString()}</td>
                                <td className="px-4 py-3 text-center text-slate-600 dark:text-slate-400">{maqD.piezasTotal.toLocaleString()}</td>
                                <td className="px-4 py-3 text-center font-semibold text-emerald-600">{maqD.piezasBuenas.toLocaleString()}</td>
                                <td className={`px-4 py-3 text-center font-bold ${getTextColor(maqD.disponibilidad)}`}>{maqD.disponibilidad}%</td>
                                <td className={`px-4 py-3 text-center font-bold ${getTextColor(maqD.rendimiento)}`}>{maqD.rendimiento}%</td>
                                <td className={`px-4 py-3 text-center font-bold ${getTextColor(maqD.calidad)}`}>{maqD.calidad}%</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${getColorOEE(maqD.oee)}`}>
                                    {maqD.oee}%
                                  </span>
                                </td>
                             </tr>
                           ))}
                        </tbody>
                      </table>
                    </div>
                 </div>
              )}
            </div>
          ))}
          </div>
        </div>
      )}
    </div>
  );
}
