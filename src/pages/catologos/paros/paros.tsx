import { useState, useEffect, useMemo } from 'react';
import type { Paro } from '../../../interfaces/paros';
import { ApiService } from '../../../services/ApiService';
import {
    Edit,
    Trash2,
    Search,
    Filter,
    Plus,
    Download,
    FileSpreadsheet,
    X
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import FormularioParo from './formularioParo';

export default function ParosCrud() {
    const [paros, setParos] = useState<Paro[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedParo, setSelectedParo] = useState<Paro | null>(null);
    const [title, setTitle] = useState('');

    // variables del filtro de tabla
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');

    // --- ESTADOS PARA MODAL DE EXPORTACIÓN ---
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [catExport, setCatExport] = useState({ semanas: [] as any[], maquinas: [] as any[] });
    const [exportFiltros, setExportFiltros] = useState({
        semana: 'ultimas_4', // Por defecto
        maquina: 'todas',
        tipo: 'todos'
    });

    useEffect(() => {
        getAllParos();
    }, []);

    const getAllParos = async () => {
        const paros: Paro[] = await ApiService.getAllParos();
        setParos(paros);
    }

    const MostrarFormulario = (action: string, paro?: Paro) => {
        setAction(action);
        setTitle(action + " paro");
        setIsModalOpen(true);
        if (paro) { setSelectedParo(paro); } else {
            setSelectedParo(null);
        }
    }

    // --- FUNCIONES DE EXPORTACIÓN ---
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
            console.error("Error cargando catálogos de exportación:", error);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            // Traemos el historial operativo real, no el catálogo
            const logsData = await ApiService.getAllRegistroParos();
            let logs: any[] = logsData || [];

            // 1. Filtrar por Máquina
            if (exportFiltros.maquina !== 'todas') {
                logs = logs.filter(log => log.id_maquina === exportFiltros.maquina);
            }

            // 2. Filtrar por Semana
            if (exportFiltros.semana !== 'todas') {
                if (exportFiltros.semana === 'ultimas_4') {
                    // Tomamos las últimas 4 semanas registradas en el catálogo de semanas
                    const last4Semanas = catExport.semanas.slice(-4).map(s => s.id_semana);
                    logs = logs.filter(log => last4Semanas.includes(log.id_semana));
                } else {
                    logs = logs.filter(log => log.id_semana === exportFiltros.semana);
                }
            }

            // 3. Filtrar por Tipo (Programado vs No Programado)
            if (exportFiltros.tipo !== 'todos') {
                const programadosNames = ['SET UP', 'COMIDA', 'DESPEJE'];
                if (exportFiltros.tipo === 'programados') {
                    logs = logs.filter(log => programadosNames.some(pn => String(log.paro || log.descripcion_paro || '').toUpperCase().includes(pn)));
                } else {
                    logs = logs.filter(log => !programadosNames.some(pn => String(log.paro || log.descripcion_paro || '').toUpperCase().includes(pn)));
                }
            }

            if (logs.length === 0) {
                alert("No se encontraron registros operativos de paros con estos filtros.");
                setIsExporting(false);
                return;
            }

            // ARMADO DEL ARCHIVO EXCEL (CSV Nativo)
            const headers = ["Fecha", "Semana", "Turno", "Máquina", "Motivo de Paro", "Hora Inicio", "Hora Termino"];
            const csvRows = [];
            csvRows.push(headers.join(","));

            logs.forEach(row => {
                const fecha = row.fecha_produccion || row.fecha || '';
                const semana = row.id_semana || '';
                const turno = row.id_turno || '';
                
                // 👇 MAGIA DEL CRUCE DE DATOS: Buscamos el nombre real de la máquina usando el catálogo 👇
                const maquinaEncontrada = catExport.maquinas.find(m => m.id_maquina === row.id_maquina);
                const maquina = maquinaEncontrada ? maquinaEncontrada.maquina : (row.id_maquina || 'Desconocida');
                
                // Limpiamos comillas dobles para no romper el Excel
                const motivo = `"${String(row.paro || row.descripcion_paro || '').replace(/"/g, '""')}"`;
                const inicio = row.hora_inicio || '';
                const termino = row.hora_termino || 'En curso';

                csvRows.push([fecha, semana, turno, maquina, motivo, inicio, termino].join(","));
            });

            // \uFEFF fuerza a Excel a leer los acentos y las Ñ correctamente
            const csvString = "\uFEFF" + csvRows.join("\n");
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `Reporte_Paros_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setIsExportModalOpen(false);
        } catch (error) {
            console.error("Error al exportar:", error);
            alert("Ocurrió un error al generar el archivo.");
        } finally {
            setIsExporting(false);
        }
    };

    const parosFiltrados = useMemo(() => {
        return paros.filter((paro) => {
            const busqueda = searchTerm.toLowerCase();
            const coincideTexto = 
                paro.nombre.toLowerCase().includes(busqueda) || 
                paro.clave.toLowerCase().includes(busqueda);

            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? paro.estatus === true :
                paro.estatus === false;

            const coincideTipo = 
                filtroTipo === 'todos' ? true :
                filtroTipo === 'programados' ? paro.programado === true :
                paro.programado === false;

            return coincideTexto && coincideEstatus && coincideTipo;
        });
    }, [paros, searchTerm, filtroEstatus, filtroTipo]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Catálogo de Paros
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra y visualiza los tipos de paros registrados.
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

                    <button
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-900 w-full sm:w-auto"
                        onClick={() => MostrarFormulario('Crear')}
                    >
                        <Plus className="w-4 h-4" /> Nuevo Registro
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {/* Barra de Búsqueda y Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por clave o nombre..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-colors"
                        />
                    </div>
                   <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            mostrarFiltros 
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
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estatus</label>
                            <select 
                                value={filtroEstatus} 
                                onChange={(e) => setFiltroEstatus(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todos">Todos</option>
                                <option value="activos">Activos</option>
                                <option value="inactivos">Inactivos</option>
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
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Paro</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Máquina</th>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Descripción</th>
                                <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Tipo</th>
                                <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {parosFiltrados.map((paro) => {
                               const iconName = paro.icon as keyof typeof LucideIcons;
                                const IconoParo = (LucideIcons[iconName] as React.ElementType) || LucideIcons.AlertCircle;

                                return (
                                    <tr key={paro.id_paro} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 rounded-lg bg-red-50 dark:bg-red-500/10 text-red-500">
                                                    <IconoParo className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-white">{paro.nombre}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{paro.clave}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{paro.maquina}</p>
                                            <p className="text-xs text-slate-500 dark:text-slate-400">{paro.id_maquina}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={paro.descripcion}>
                                                {paro.descripcion}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paro.programado
                                                ? 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300'
                                                : 'bg-orange-100 text-orange-800 dark:bg-orange-500/20 dark:text-orange-300'
                                                }`}>
                                                {paro.programado ? 'Programado' : 'No Programado'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${paro.estatus
                                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                }`}>
                                                {paro.estatus ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" title="Editar"
                                                    onClick={() => MostrarFormulario('Editar', paro)}>
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar"
                                                    onClick={() => MostrarFormulario('Eliminar', paro)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div >
            
            <FormularioParo
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedParo(null);
                    setTitle('');
                }}
                title={title}
                action={action}
                refreshData={getAllParos} 
                paro={selectedParo ? selectedParo : undefined}
            />

            {/* 👇 MODAL DE EXPORTACIÓN EXCEL 👇 */}
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
                                    <p className="text-xs text-slate-500">Historial Operativo de Paros</p>
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
                                    onChange={(e) => setExportFiltros({...exportFiltros, semana: e.target.value})}
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
                                    onChange={(e) => setExportFiltros({...exportFiltros, maquina: e.target.value})}
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
                                    onChange={(e) => setExportFiltros({...exportFiltros, tipo: e.target.value})}
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