import { useState, useEffect, useMemo } from 'react';
import type { LineaProduccion } from '../../../interfaces/lineas_produccion';
import { ApiService } from '../../../services/ApiService';
import {
    Edit,
    Trash2,
    Search,
    Filter,
    Factory, // Ícono representativo para Línea de Producción
    Plus,
} from 'lucide-react';
import FormularioLinea from './formularioLineaProduccion'; // Asegúrate de tener este componente

export default function LineasCrud() {
    const [lineas, setLineas] = useState<LineaProduccion[]>([]);
    
    // --- ESTADOS PARA EL MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedLinea, setSelectedLinea] = useState<LineaProduccion | null>(null);
    const [title, setTitle] = useState('');

    // --- ESTADOS PARA FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');

    useEffect(() => {
        getAllLineas();
    }, []);

    const getAllLineas = async () => {
        const lineasData: LineaProduccion[] = await ApiService.getAllineasProduccion();
        setLineas(lineasData);
    };

    // --- FUNCIÓN PARA ABRIR EL FORMULARIO ---
    const MostrarFormulario = (action: string, linea?: LineaProduccion) => {
        setTitle(action + " línea de producción");
        setIsModalOpen(true);
        setAction(action);
        
        if (linea) { 
            setSelectedLinea(linea); 
        } else {
            setSelectedLinea(null);
        }
    };

    // --- LÓGICA DE FILTRADO ---
    const lineasFiltradas = useMemo(() => {
        return lineas.filter((linea) => {
            // 1. Búsqueda por texto
            const busqueda = searchTerm.toLowerCase();
            const coincideTexto = 
                linea.linea?.toLowerCase().includes(busqueda) || 
                linea.descripcion?.toLowerCase().includes(busqueda);

            // 2. Filtro por Estatus
            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? linea.estatus === true :
                linea.estatus === false;

            return coincideTexto && coincideEstatus;
        });
    }, [lineas, searchTerm, filtroEstatus]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Líneas de Producción
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra y visualiza los registros de Líneas de Producción.
                    </p>
                </div>

                <button 
                    onClick={() => MostrarFormulario('Crear')}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-900"
                >
                    <Plus className="w-4 h-4" /> Nuevo Registro
                </button>
            </div>

            <div className="space-y-4">
                {/* --- Barra de Búsqueda y Filtros --- */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por línea o descripción..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
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

                {/* --- Panel desplegable de Filtros Adicionales --- */}
                {mostrarFiltros && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
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
                    </div>
                )}

                {/* --- Tabla --- */}
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-300">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Línea de Producción</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Descripción</th>
                                    <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                    <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {lineasFiltradas.length > 0 ? (
                                    lineasFiltradas.map((linea) => {
                                        return (
                                            <tr key={linea.id_linea_trabajo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-500 shrink-0">
                                                            <Factory className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{linea.linea}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">ID: {linea.id_linea_trabajo}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[300px] sm:max-w-md truncate" title={linea.descripcion}>
                                                        {linea.descripcion}
                                                    </p>   
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${linea.estatus
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                        }`}>
                                                        {linea.estatus ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" 
                                                            title="Editar"
                                                            onClick={() => MostrarFormulario('Editar', linea)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                                                            title="Eliminar"
                                                            onClick={() => MostrarFormulario('Eliminar', linea)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No se encontraron líneas de producción con los filtros actuales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- COMPONENTE DEL FORMULARIO --- */}
            <FormularioLinea
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedLinea(null);
                    setAction('');
                }}
                title={title}
                action={action}
                refreshData={getAllLineas}
                linea={selectedLinea ? selectedLinea : undefined}
            />
        </>
    );
}