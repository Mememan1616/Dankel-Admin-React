import { useState, useEffect, useMemo } from 'react';
import type { Paro } from '../../../interfaces/paros';
import { ApiService } from '../../../services/ApiService';
import {
    Edit,
    Trash2,
    Search,
    Filter,
    Plus,
    
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import FormularioParo from './formularioParo';


export default function ParosCrud() {

    const [paros, setParos] = useState<Paro[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedParo, setSelectedParo] = useState<Paro | null>(null);
    const [title, setTitle] = useState('');

    //variables del filtro
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [filtroTipo, setFiltroTipo] = useState('todos');
    useEffect(() => {
        getAllParos();
    }, []);
    const getAllParos = async () => {
        const paros: Paro[] = await ApiService.getAllParos();
        console.log(paros);
        setParos(paros);

    }
    const MostrarFormulario = (action: string, paro?: Paro) => {
        console.log(action);
        setAction(action);
        setTitle(action +" paro");
        setIsModalOpen(true);
        
        
        if (paro) { setSelectedParo(paro); } else {
            setSelectedParo(null);
        }

    }
    const parosFiltrados = useMemo(() => {
        return paros.filter((paro) => {
            // 1. Búsqueda por texto (nombre o clave)
            const busqueda = searchTerm.toLowerCase();
            const coincideTexto = 
                paro.nombre.toLowerCase().includes(busqueda) || 
                paro.clave.toLowerCase().includes(busqueda);

            // 2. Filtro por Estatus
            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? paro.estatus === true :
                paro.estatus === false;

            // 3. Filtro por Tipo (Programado/No programado)
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
                        Paros
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra y visualiza los registros de Paros.
                    </p>
                </div>

                <button
                    className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-900"
                    onClick={() => MostrarFormulario('Crear')}
                >
                    <Plus className="w-4 h-4" /> Nuevo Registro
                </button>
            </div>
            <div className="space-y-4">
                {/* Barra de Búsqueda y Filtros */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm} // Vinculado al estado
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por clave o nombre..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-colors"
                        />
                    </div>
                   <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)} // Alterna visibilidad de filtros
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
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 
                transition-colors duration-300
                overflow-x-auto">

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
                                // Mapeo simple del string a un componente de ícono de Lucide
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


        </>



    );
}
