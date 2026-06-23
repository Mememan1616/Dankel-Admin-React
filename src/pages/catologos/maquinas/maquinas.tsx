import { useState, useEffect, useMemo } from 'react';
import type { Maquina } from '../../../interfaces/maquinas';
import { ApiService } from '../../../services/ApiService';
import { Edit, Search, Filter, Settings, Plus, Zap } from 'lucide-react';
import FormularioMaquina from './formularioMaquina';

export default function MaquinasCrud() {
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedMaquina, setSelectedMaquina] = useState<Maquina | null>(null);
    const [title, setTitle] = useState('');

    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');

    useEffect(() => {
        cargarDatosCompletos();
    }, []);

    // Traemos Máquinas y la Tabla Intermedia al mismo tiempo
    const cargarDatosCompletos = async () => {
        try {
            const [maquinasData, relacionesData] = await Promise.all([
                ApiService.getAllMaquinas(),
                ApiService.getAllProduccionProductoMaquina()
            ]);

            // Formatear relaciones asegurando que id_relacion exista
            const relaciones = Array.isArray(relacionesData) 
                ? relacionesData.map(r => ({
                    ...r,
                    // Si tu base de datos usa 'id' o 'clave' en lugar de 'id_relacion', lo atrapamos aquí:
                    id_relacion: r.id_relacion || r.id || r.clave 
                }))
                : Object.keys(relacionesData || {}).map(k => ({ 
                    id_relacion: k, 
                    ...(relacionesData as any)[k] 
                }));

            // 🔥 DEBUG: Imprime el primer elemento de cada arreglo para ver la estructura real
            console.log("Estructura de UNA Máquina:", maquinasData[0]);
            console.log("Estructura de UNA Relación Procesada:", relaciones[0]);

            // Cruzar datos: Asignar capacidades a su máquina correspondiente
            const maquinasConCapacidad = (maquinasData || []).map(maq => {
                // Convertimos ambos a String por si hay discrepancia de tipos y filtramos inactivos
                const capacidadesAsignadas = relaciones.filter(r => 
                    String(r.id_maquina) === String(maq.id_maquina) && r.estatus !== false
                );
                
                return { ...maq, capacidades: capacidadesAsignadas };
            });

            setMaquinas(maquinasConCapacidad);
        } catch (error) {
            console.error("Error al cargar máquinas:", error);
        }
    };

    const MostrarFormulario = (action: string, maquina?: Maquina) => {
        setTitle(action + " máquina");
        setIsModalOpen(true);
        setAction(action);
        setSelectedMaquina(maquina || null);
    };

    const maquinasFiltradas = useMemo(() => {
        return maquinas.filter((maquina) => {
            const busqueda = searchTerm.toLowerCase();
            const coincideTexto = 
                maquina.maquina?.toLowerCase().includes(busqueda) || 
                maquina.linea?.toLowerCase().includes(busqueda);

            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? maquina.estatus === true :
                maquina.estatus === false;

            return coincideTexto && coincideEstatus;
        });
    }, [maquinas, searchTerm, filtroEstatus]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">Máquinas y Capacidades</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra el parque de máquinas y su asociación a productos.
                    </p>
                </div>
                <button 
                    onClick={() => MostrarFormulario('Crear')}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-xl shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2"
                >
                    <Plus className="w-4 h-4" /> Nueva Máquina
                </button>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por máquina o línea..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                    </div>
                    <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border ${mostrarFiltros ? 'bg-cyan-50 text-cyan-700 border-cyan-200' : 'bg-slate-100 text-slate-700 border-slate-200'}`}
                    >
                        <Filter className="w-4 h-4" /> {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros'}
                    </button>
                </div>

                {mostrarFiltros && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 animate-in fade-in">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 mb-1">Estatus</label>
                            <select value={filtroEstatus} onChange={(e) => setFiltroEstatus(e.target.value)} className="w-full sm:w-48 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-cyan-500 outline-none">
                                <option value="todos">Todos</option>
                                <option value="activos">Activos</option>
                                <option value="inactivos">Inactivos</option>
                            </select>
                        </div>
                    </div>
                )}

                <div className="bg-white dark:bg-slate-950 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800 text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">
                                    <th className="px-6 py-4 font-bold">Máquina</th>
                                    <th className="px-6 py-4 font-bold">Línea</th>
                                    <th className="px-6 py-4 font-bold">Productos Asociados</th>
                                    <th className="px-6 py-4 font-bold text-center">Estatus</th>
                                    <th className="px-6 py-4 font-bold text-right">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {maquinasFiltradas.length > 0 ? (
                                    maquinasFiltradas.map((maquina) => {
                                        const capacidades = maquina.capacidades || [];
                                        return (
                                        <tr key={maquina.id_maquina} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 shrink-0 border border-indigo-100 dark:border-indigo-500/20">
                                                        <Settings className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-extrabold text-slate-900 dark:text-white uppercase">{maquina.maquina}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[150px] truncate" title={maquina.descripcion}>{maquina.descripcion || 'Sin descripción'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-semibold text-cyan-700 bg-cyan-50 dark:bg-cyan-900/20 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 px-2 py-1 rounded-md uppercase">
                                                    {maquina.linea}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {capacidades.length === 0 ? (
                                                    <span className="text-xs text-slate-400 italic">No configurada</span>
                                                ) : (
                                                    <div className="flex flex-col gap-1.5">
                                                        {capacidades.slice(0, 2).map((c, i) => (
                                                            <div key={i} className="flex items-center text-xs gap-2">
                                                                <Zap className="w-3 h-3 text-amber-500" />
                                                                <span className="font-semibold text-slate-700 dark:text-slate-300">{c.producto}</span>
                                                                <span className="text-slate-500 dark:text-slate-400 font-mono">({c.velocidad} p/h)</span>
                                                            </div>
                                                        ))}
                                                        {capacidades.length > 2 && (
                                                            <span className="text-[10px] text-indigo-500 font-bold ml-5">
                                                                + {capacidades.length - 2} más...
                                                            </span>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${maquina.estatus ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                                                    {maquina.estatus ? 'ACTIVA' : 'INACTIVA'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" 
                                                    title="Editar Matriz"
                                                    onClick={() => MostrarFormulario('Editar', maquina)}
                                                >
                                                    <Edit className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    )})
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron máquinas.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <FormularioMaquina
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedMaquina(null);
                    setAction('');
                }}
                title={title}
                action={action}
                maquina={selectedMaquina || undefined}
                refreshData={cargarDatosCompletos}
                existingMaquinas={maquinas} 
            />
        </>
    );
}