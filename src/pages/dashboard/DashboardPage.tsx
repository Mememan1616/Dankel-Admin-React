import React, { useState } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  AlertCircle, 
  CalendarDays, 
  Clock, 
  Settings2,
  TrendingUp,
  Activity
} from 'lucide-react';

// --- DATOS FICTICIOS (Hardcoded para la vista) ---
const mockTableData = [
  { maquina: 'ARCA', oee: 80, disponibilidad: 92, rendimiento: 87, calidad: 100, estado: 'produciendo' },
  { maquina: 'BERGAMI', oee: 23, disponibilidad: 40, rendimiento: 60, calidad: 99, estado: 'produciendo' },
  { maquina: 'GF', oee: 72, disponibilidad: 95, rendimiento: 78, calidad: 98, estado: 'paro' },
];

const mockChartData = [
  { lote: 'Lote 1', avance: 5, objetivo: 8 },
  { lote: 'Lote 2', avance: 2, objetivo: 6 },
  { lote: 'Lote 3', avance: 4, objetivo: 8 },
  { lote: 'Lote 4', avance: 2, objetivo: 5 },
  { lote: 'Lote 5', avance: 7, objetivo: 7 },
];

export default function DashboardPage() {
  // Estados para los filtros (Interactividad básica)
  const [semana, setSemana] = useState('Semana 19 (05-MAY-26)');
  const [turno, setTurno] = useState('1');
  const [maquinaFiltro, setMaquinaFiltro] = useState('Todas');

  // Funciones auxiliares para colores de métricas
  const getMetricColor = (value: number) => {
    if (value >= 80) return 'text-emerald-600 dark:text-emerald-400';
    if (value >= 60) return 'text-amber-500 dark:text-amber-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusIcon = (estado: string) => {
    switch (estado) {
      case 'produciendo':
        return <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-sm" />;
      case 'setup':
        return <AlertCircle className="w-8 h-8 text-amber-500 drop-shadow-sm" />;
      case 'paro':
        return <XCircle className="w-8 h-8 text-red-500 drop-shadow-sm" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800">
        <div>
          <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-indigo-600 dark:from-cyan-400 dark:to-indigo-400">
            Dankel Medical
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1 font-medium">
            Dashboard OEE • Vista general en planta por turno
          </p>
        </div>

        {/* FILTROS INTERACTIVOS */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <CalendarDays className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <select 
              className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none w-full"
              value={semana}
              onChange={(e) => setSemana(e.target.value)}
            >
              <option>Semana 19 (05-MAY-26)</option>
              <option>Semana 18 (28-ABR-26)</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <Clock className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <select 
              className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none w-full"
              value={turno}
              onChange={(e) => setTurno(e.target.value)}
            >
              <option value="1">Turno 1</option>
              <option value="2">Turno 2</option>
              <option value="3">Turno 3</option>
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 w-full sm:w-auto">
            <Settings2 className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <select 
              className="bg-transparent border-none text-sm font-semibold text-slate-700 dark:text-slate-200 focus:ring-0 cursor-pointer outline-none w-full"
              value={maquinaFiltro}
              onChange={(e) => setMaquinaFiltro(e.target.value)}
            >
              <option>Todas</option>
              <option>ARCA</option>
              <option>BERGAMI</option>
              <option>GF</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* SECCIÓN: TABLA POR MÁQUINA */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Activity className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Desempeño por Máquina</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50">
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300">Máquina</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-center">OEE</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-center">Disponibilidad</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-center">Rendimiento</th>
                  <th className="px-6 py-4 font-semibold text-sm text-slate-600 dark:text-slate-300 text-center">Calidad</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {mockTableData.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-800 dark:text-slate-100">{row.maquina}</td>
                    <td className={`px-6 py-4 text-center font-bold ${getMetricColor(row.oee)}`}>{row.oee}%</td>
                    <td className={`px-6 py-4 text-center font-bold ${getMetricColor(row.disponibilidad)}`}>{row.disponibilidad}%</td>
                    <td className={`px-6 py-4 text-center font-bold ${getMetricColor(row.rendimiento)}`}>{row.rendimiento}%</td>
                    <td className={`px-6 py-4 text-center font-bold ${getMetricColor(row.calidad)}`}>{row.calidad}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* SECCIÓN: ESTADO DE MÁQUINAS */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center gap-3">
            <Settings2 className="w-5 h-5 text-indigo-500" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Estado Actual</h3>
          </div>
          
          <div className="p-6 flex-1 flex flex-col justify-center gap-6">
            {mockTableData.map((row, idx) => (
              <div key={idx} className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl">
                <span className="font-bold text-slate-700 dark:text-slate-200 text-lg">{row.maquina}</span>
                {getStatusIcon(row.estado)}
              </div>
            ))}
          </div>

          {/* LEYENDA */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 rounded-b-2xl">
            <div className="flex justify-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400">
              <div className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Produciendo</div>
              <div className="flex items-center gap-1"><AlertCircle className="w-4 h-4 text-amber-500" /> Set up</div>
              <div className="flex items-center gap-1"><XCircle className="w-4 h-4 text-red-500" /> Paro</div>
            </div>
          </div>
        </div>

        {/* SECCIÓN: GRÁFICA PRODUCCIÓN VS OBJETIVO */}
        <div className="lg:col-span-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-8">
            <TrendingUp className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Producción VS Objetivo</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">Avance de producción por lotes</p>
            </div>
          </div>

          {/* Construcción de Gráfica de Barras con Tailwind */}
          <div className="space-y-6 max-w-4xl mx-auto">
            {mockChartData.map((data, index) => {
              // Cálculos simples para el ancho de las barras (Max objetivo = 10 para escala)
              const maxScale = 10;
              const avancePercent = (data.avance / maxScale) * 100;
              const objetivoRestantePercent = ((data.objetivo - data.avance) / maxScale) * 100;

              return (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 text-right text-sm font-bold text-slate-600 dark:text-slate-300">
                    {data.lote}
                  </div>
                  
                  {/* Contenedor de la barra */}
                  <div className="flex-1 h-8 bg-slate-100 dark:bg-slate-800 rounded-r-lg flex relative group">
                    {/* Tooltip on hover */}
                    <div className="absolute -top-10 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs py-1 px-2 rounded pointer-events-none z-10 whitespace-nowrap">
                      Avance: {data.avance} / Objetivo: {data.objetivo}
                    </div>

                    {/* Barra de Avance (Color claro como en tu imagen) */}
                    <div 
                      className="h-full bg-orange-300 dark:bg-orange-400 transition-all duration-1000 ease-out flex items-center justify-center text-xs font-bold text-orange-900 overflow-hidden"
                      style={{ width: `${avancePercent}%` }}
                    >
                      {data.avance > 0 && data.avance}
                    </div>
                    
                    {/* Barra de Objetivo Restante (Color oscuro) */}
                    <div 
                      className="h-full bg-red-800 dark:bg-red-900 rounded-r-md transition-all duration-1000 ease-out flex items-center justify-center text-xs font-bold text-white overflow-hidden shadow-inner"
                      style={{ width: `${objetivoRestantePercent}%` }}
                    >
                      {data.objetivo - data.avance > 0 && (data.objetivo - data.avance)}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Eje X (Leyenda de números) */}
            <div className="flex items-center gap-4 mt-2">
              <div className="w-16"></div>
              <div className="flex-1 flex justify-between px-2 text-xs font-semibold text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-2">
                {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <span key={num}>{num}</span>
                ))}
              </div>
            </div>

            {/* Leyenda de la gráfica */}
            <div className="flex justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 bg-orange-300 dark:bg-orange-400 rounded-sm"></div>
                Avance Real
              </div>
              <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-300">
                <div className="w-4 h-4 bg-red-800 dark:bg-red-900 rounded-sm"></div>
                Objetivo Restante
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}