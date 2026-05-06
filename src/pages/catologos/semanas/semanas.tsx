import { useState, useEffect, useMemo } from 'react';
import type { Semana } from '../../../interfaces/semanas'; // Ajusta la ruta
import { ApiService } from '../../../services/ApiService';
import {
    Edit,
    Trash2,
    Search,
    Filter,
    Calendar, // Ícono más apropiado para semanas
    Plus,
} from 'lucide-react';
import FormularioSemanas from './formularioSemanas';

export default function SemanasCrud() {
    const [semanas, setSemanas] = useState<Semana[]>([]);
    
    // --- ESTADOS PARA EL MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedSemana, setSelectedSemana] = useState<Semana | null>(null);
    const [title, setTitle] = useState('');

    // --- ESTADOS PARA FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');

    useEffect(() => {
        getSemanas();
    }, []);

    const getSemanas = async () => {
        try {
            // Ajusta este método en tu ApiService
            const data: Semana[] = await ApiService.getAllSemanas();
            setSemanas(data);
        } catch (error) {
            console.error("Error al cargar semanas:", error);
        }
    };

    // --- FUNCIÓN PARA ABRIR EL FORMULARIO ---
    const MostrarFormulario = (action: string, semana?: Semana) => {
        setTitle(`${action} semana`);
        setIsModalOpen(true);
        setAction(action);
        
        if (semana) { 
            setSelectedSemana(semana); 
        } else {
            setSelectedSemana(null);
        }
    };

    // --- LÓGICA DE FILTRADO ---
    const semanasFiltradas = useMemo(() => {
        return semanas.filter((sem) => {
            // 1. Búsqueda por descripción o ID
            const busqueda = searchTerm.toLowerCase();
            const coincideTexto = 
                sem.descripcion?.toLowerCase().includes(busqueda) || 
                sem.id_semana?.toString().includes(busqueda);

            // 2. Filtro por Estatus
            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? sem.estatus === true :
                sem.estatus === false;

            return coincideTexto && coincideEstatus;
        });
    }, [semanas, searchTerm, filtroEstatus]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Gestión de Semanas
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Configura los periodos semanales, fechas de inicio y término.
                    </p>
                </div>

                <button 
                    onClick={() => MostrarFormulario('Crear')}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-slate-900"
                >
                    <Plus className="w-4 h-4" /> Nueva Semana
                </button>
            </div>

            <div className="space-y-4">
                {/* --- Barra de Búsqueda y Filtros --- */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 transition-colors"
                        />
                    </div>
                    <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            mostrarFiltros 
                                ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 dark:hover:bg-slate-700'
                        }`}
                    >
                        <Filter className="w-4 h-4" /> {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros'}
                    </button>
                </div>

                {/* --- Panel de Filtros Adicionales --- */}
                {mostrarFiltros && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estatus</label>
                            <select 
                                value={filtroEstatus} 
                                onChange={(e) => setFiltroEstatus(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todos">Todos</option>
                                <option value="activos">Vigentes</option>
                                <option value="inactivos">Cerradas</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- Tabla --- */}
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Semana</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Fecha Inicio</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Fecha Término</th>
                                    <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                    <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {semanasFiltradas.length > 0 ? (
                                    semanasFiltradas.map((sem) => (
                                        <tr key={sem.id_semana} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0">
                                                        <Calendar className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">{sem.descripcion}</p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">ID: {sem.id_semana}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {sem.fecha_inicio}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 dark:text-slate-400">
                                                    {sem.fecha_termino}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${sem.estatus
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {sem.estatus ? 'Vigente' : 'Cerrada'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" 
                                                        onClick={() => MostrarFormulario('Editar', sem)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                                                        onClick={() => MostrarFormulario('Eliminar', sem)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No se encontraron semanas disponibles.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- COMPONENTE DEL FORMULARIO --- */}
            <FormularioSemanas
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedSemana(null);
                    setAction('');
                }}
                title={title}
                action={action}
                semana={selectedSemana || undefined}
                refreshData={getSemanas} // Útil para recargar la tabla tras guardar
            />
        </>
    );
}