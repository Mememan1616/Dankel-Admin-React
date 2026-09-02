import { useState, useEffect, useMemo } from 'react';
import type { RegistroParo } from '../../../interfaces/produccion';
import type { Paro } from '../../../interfaces/paros';
import { ApiService } from '../../../services/ApiService';
import {
    Search,
    Filter,
    FileSpreadsheet,
    Download,
    X,
    AlertCircle,
    Clock
} from 'lucide-react';

export default function RegistroParosCrud() {
    const [registros, setRegistros] = useState<RegistroParo[]>([]);
    const [parosCatalogo, setParosCatalogo] = useState<Paro[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroMaquina, setFiltroMaquina] = useState('todas');
    const [filtroSemana, setFiltroSemana] = useState('todas');
    const [filtroTipo, setFiltroTipo] = useState('todos');

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [catExport, setCatExport] = useState({ semanas: [] as any[], maquinas: [] as any[] });
    const [exportFiltros, setExportFiltros] = useState({
        semana: 'ultimas_4',
        maquina: 'todas',
        tipo: 'todos'
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [registrosData, parosData] = await Promise.all([
                ApiService.getAllRegistroParos(),
                ApiService.getAllParos()
            ]);
            setRegistros(registrosData || []);
            setParosCatalogo(parosData || []);
        } catch (error) {
            console.error('Error cargando datos:', error);
        }
    };

    const getParoInfo = (id_paro?: string) => {
        if (!id_paro) return undefined;
        return parosCatalogo.find(p => p.id_paro === id_paro);
    };

    const registrosFiltrados = useMemo(() => {
        return registros.filter((reg) => {
            const busqueda = searchTerm.toLowerCase();
            const paroInfo = getParoInfo(reg.id_paro);

            const coincideTexto =
                String(reg.paro || '').toLowerCase().includes(busqueda) ||
                String(reg.maquina || '').toLowerCase().includes(busqueda) ||
                String(paroInfo?.descripcion || '').toLowerCase().includes(busqueda) ||
                String(reg.fecha_produccion || '').includes(busqueda);

            const coincideMaquina = filtroMaquina === 'todas' || reg.id_maquina === filtroMaquina;
            const coincideSemana = filtroSemana === 'todas' || reg.id_semana === filtroSemana;

            let coincideTipo = true;
            if (filtroTipo !== 'todos') {
                if (paroInfo) {
                    coincideTipo = filtroTipo === 'programados' ? paroInfo.programado : !paroInfo.programado;
                } else {
                    const programadosNames = ['SET UP', 'COMIDA', 'DESPEJE'];
                    const isProgramado = programadosNames.some(pn => String(reg.paro || '').toUpperCase().includes(pn));
                    coincideTipo = filtroTipo === 'programados' ? isProgramado : !isProgramado;
                }
            }

            return coincideTexto && coincideMaquina && coincideSemana && coincideTipo;
        });
    }, [registros, searchTerm, filtroMaquina, filtroSemana, filtroTipo, parosCatalogo]);

    const semanasOptions = useMemo(() => {
        const semanaSet = new Set(registros.map(r => r.id_semana));
        return Array.from(semanaSet).sort();
    }, [registros]);

    const maquinasOptions = useMemo(() => {
        const maquinaSet = new Map<string, string>();
        registros.forEach(r => maquinaSet.set(r.id_maquina, r.maquina));
        return Array.from(maquinaSet.entries()).map(([id, nombre]) => ({ id, nombre }));
    }, [registros]);

    const openExportModal = async () => {
        setIsExportModalOpen(true);
        try {
            const [semanasData, maquinasData] = await Promise.all([
                ApiService.getAllSemanas(),
                ApiService.getAllMaquinas()
            ]);
            setCatExport({
                semanas: semanasData || [],
                maquinas: maquinasData || []
            });
        } catch (error) {
            console.error('Error cargando catálogos de exportación:', error);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let logs = [...registros];

            if (exportFiltros.maquina !== 'todas') {
                logs = logs.filter(log => log.id_maquina === exportFiltros.maquina);
            }

            if (exportFiltros.semana !== 'todas') {
                if (exportFiltros.semana === 'ultimas_4') {
                    const last4Semanas = catExport.semanas.slice(-4).map(s => s.id_semana);
                    logs = logs.filter(log => last4Semanas.includes(log.id_semana));
                } else {
                    logs = logs.filter(log => log.id_semana === exportFiltros.semana);
                }
            }

            if (exportFiltros.tipo !== 'todos') {
                if (exportFiltros.tipo === 'programados') {
                    logs = logs.filter(log => {
                        const paroInfo = getParoInfo(log.id_paro);
                        if (paroInfo) return paroInfo.programado;
                        return ['SET UP', 'COMIDA', 'DESPEJE'].some(pn => String(log.paro || '').toUpperCase().includes(pn));
                    });
                } else {
                    logs = logs.filter(log => {
                        const paroInfo = getParoInfo(log.id_paro);
                        if (paroInfo) return !paroInfo.programado;
                        return !['SET UP', 'COMIDA', 'DESPEJE'].some(pn => String(log.paro || '').toUpperCase().includes(pn));
                    });
                }
            }

            if (logs.length === 0) {
                alert('No se encontraron registros de paros con estos filtros.');
                setIsExporting(false);
                return;
            }

            const headers = ['Fecha', 'Semana', 'Turno', 'Operador', 'Máquina', 'Lote', 'Motivo de Paro', 'Descripción', 'Hora Inicio', 'Hora Término'];
            const csvRows = [headers.join(',')];

            logs.forEach(row => {

                const fecha = row.fecha_produccion || '';
                const semana = row.id_semana || '';
                const turno = row.turno || '';
                const operador = row.operador || '';
                const maquinaEncontrada = catExport.maquinas.find(m => m.id_maquina === row.id_maquina);
                const maquina = maquinaEncontrada ? maquinaEncontrada.maquina : (row.maquina || 'Desconocida');
                const motivo = `"${String(row.paro || '').replace(/"/g, '""')}"`;
                const descripcion = `"${String(row.descripcion_paro || '').replace(/"/g, '""')}"`;
                const inicio = row.hora_inicio || '';
                const lote = row.lote || '';
                const termino = row.hora_termino || 'En curso';
                csvRows.push([fecha, semana, turno, operador, maquina, lote, motivo, descripcion, inicio, termino].join(','));
            });

            const csvString = '\uFEFF' + csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Registro_Paros_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setIsExportModalOpen(false);
        } catch (error) {
            console.error('Error al exportar:', error);
            alert('Ocurrió un error al generar el archivo.');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Registro de Paros
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Visualiza el historial de paros registrados en producción.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={openExportModal}
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg shadow-sm font-medium text-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        Exportar a Excel
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por motivo, máquina o fecha..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-colors"
                        />
                    </div>
                    <button
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${mostrarFiltros
                            ? 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-900/30 dark:text-cyan-400 dark:border-cyan-800'
                            : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Filter className="w-4 h-4" /> {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros'}
                    </button>
                </div>

                {mostrarFiltros && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Máquina</label>
                            <select
                                value={filtroMaquina}
                                onChange={(e) => setFiltroMaquina(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todas">Todas</option>
                                {maquinasOptions.map(m => (
                                    <option key={m.id} value={m.id}>{m.nombre}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Semana</label>
                            <select
                                value={filtroSemana}
                                onChange={(e) => setFiltroSemana(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todas">Todas</option>
                                {semanasOptions.map(s => (
                                    <option key={s} value={s}>{s}</option>
                                ))}
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Tipo de Paro</label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todos">Todos</option>
                                <option value="programados">Programados</option>
                                <option value="no_programados">No Programados</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Fecha</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Máquina</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Turno</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Operador</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Motivo de Paro</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Descripción</th>
                                <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Inicio</th>
                                <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Término</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {registrosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center">
                                        <div className="flex flex-col items-center gap-2 text-slate-400 dark:text-slate-500">
                                            <AlertCircle className="w-8 h-8" />
                                            <p className="text-sm font-medium">No se encontraron registros</p>
                                            <p className="text-xs">Intentá ajustar los filtros o la búsqueda.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                registrosFiltrados.map((reg) => {
                                    const paroInfo = getParoInfo(reg.id_paro);
                                    return (
                                        <tr key={reg.id_registro_paro} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{reg.fecha_produccion || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-700 dark:text-slate-300">{reg.maquina || reg.id_maquina}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{reg.turno || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-600 dark:text-slate-400">{reg.operador || '-'}</p>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className={`p-1.5 rounded-lg ${paroInfo?.programado ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-500' : 'bg-orange-100 dark:bg-orange-500/20 text-orange-500'}`}>
                                                        <Clock className="w-4 h-4" />
                                                    </div>
                                                    <span className="text-sm font-medium text-slate-900 dark:text-white">{reg.paro}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs truncate" title={paroInfo?.descripcion || ''}>
                                                    {paroInfo?.descripcion || '-'}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="text-sm text-slate-700 dark:text-slate-300">{reg.hora_inicio || '-'}</span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`text-sm ${reg.hora_termino ? 'text-slate-700 dark:text-slate-300' : 'text-amber-500 font-medium'}`}>
                                                    {reg.hora_termino || 'En curso'}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {isExportModalOpen && (
                <div className="fixed inset-0 z-[60] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl w-full max-w-md border border-slate-200 dark:border-slate-800">
                        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg">
                                    <FileSpreadsheet className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-slate-100">Exportar Reporte</h3>
                                    <p className="text-xs text-slate-500">Historial de Registro de Paros</p>
                                </div>
                            </div>
                            <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-rose-500">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Rango de Semanas</label>
                                <select
                                    value={exportFiltros.semana}
                                    onChange={(e) => setExportFiltros({ ...exportFiltros, semana: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="ultimas_4">⚡ Últimas 4 Semanas Registradas</option>
                                    <option value="todas">Todas las Semanas (Histórico completo)</option>
                                    <optgroup label="Semanas Específicas">
                                        {catExport.semanas.map(s => (
                                            <option key={s.id_semana} value={s.id_semana}>{s.descripcion || s.id_semana}</option>
                                        ))}
                                    </optgroup>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Máquina</label>
                                <select
                                    value={exportFiltros.maquina}
                                    onChange={(e) => setExportFiltros({ ...exportFiltros, maquina: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="todas">Todas las Máquinas</option>
                                    {catExport.maquinas.map(m => (
                                        <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Tipo de Paro Operativo</label>
                                <select
                                    value={exportFiltros.tipo}
                                    onChange={(e) => setExportFiltros({ ...exportFiltros, tipo: e.target.value })}
                                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-lg py-2.5 px-3 text-sm outline-none focus:ring-2 focus:ring-emerald-500"
                                >
                                    <option value="todos">Todos los motivos</option>
                                    <option value="programados">Solo Programados (Set Up, Comida, Despeje)</option>
                                    <option value="no_programados">Solo Fallas / No Programados</option>
                                </select>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/30 rounded-b-2xl">
                            <button
                                onClick={() => setIsExportModalOpen(false)}
                                className="px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleExport}
                                disabled={isExporting}
                                className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-bold shadow-md shadow-emerald-600/20 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isExporting ? (
                                    <>Procesando...</>
                                ) : (
                                    <><Download className="w-4 h-4" /> Generar Excel</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
