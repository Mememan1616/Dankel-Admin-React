import { useState, useEffect, useMemo } from 'react';
import type { Lote } from '../../../interfaces/lotes'; // Ajusta esta ruta según tu proyecto
import { ApiService } from '../../../services/ApiService';
import {
    Edit,
    Trash2,
    Search,
    Filter,
    Package, // Cambiado para representar un Lote
    Plus,
} from 'lucide-react';
import FormularioLote from './formularioLote'; // Asegúrate de que este componente exista y esté adaptado

export default function LotesCrud() {
    const [lotes, setLotes] = useState<Lote[]>([]);
    
    // --- ESTADOS PARA EL MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
    const [title, setTitle] = useState('');

    // --- ESTADOS PARA FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');

    useEffect(() => {
        getAllLotes();
    }, []);

    const getAllLotes = async () => {
        // Asegúrate de tener este método adaptado en tu ApiService
        const lotesData: Lote[] = await ApiService.getAllLotes();
        setLotes(lotesData);
    };

    // --- FUNCIÓN PARA ABRIR EL FORMULARIO ---
    const MostrarFormulario = (action: string, lote?: Lote) => {
        setTitle(action + " lote");
        setIsModalOpen(true);
        setAction(action);
        
        if (lote) { 
            setSelectedLote(lote); 
        } else {
            setSelectedLote(null);
        }
    };

    // --- LÓGICA DE FILTRADO ---
    // --- LÓGICA DE FILTRADO ---
    const lotesFiltrados = useMemo(() => {
        return lotes.filter((lote) => {
            const busqueda = searchTerm.toLowerCase();
            
            // CONVERSIÓN SEGURA: Transformamos a String explícitamente y manejamos undefined/null
            const strLote = String(lote.lote || '').toLowerCase();
            const strForma = String(lote.forma_trabajo || '').toLowerCase();
            const strDesc = String(lote.descripcion || '').toLowerCase();

            // 1. Búsqueda por texto segura
            const coincideTexto = 
                strLote.includes(busqueda) || 
                strForma.includes(busqueda) ||
                strDesc.includes(busqueda);

            // 2. Filtro por Estatus
            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? lote.estatus === true :
                lote.estatus === false;

            return coincideTexto && coincideEstatus;
        });
    }, [lotes, searchTerm, filtroEstatus]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Lotes
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra y visualiza los registros de Lotes de trabajo.
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
                            placeholder="Buscar por lote, forma de trabajo o descripción..."
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
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Lote</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Forma de trabajo</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Descripción</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Máquinas asignadas</th>
                                    <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                    <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {lotesFiltrados.length > 0 ? (
                                    lotesFiltrados.map((lote) => {
                                        return (
                                            <tr key={lote.id_lote} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 shrink-0">
                                                            <Package className="w-5 h-5" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{lote.lote}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{lote.forma_trabajo}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{lote.id_forma_trabajo}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] sm:max-w-xs truncate" title={lote.descripcion}>
                                                        {lote.descripcion}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-wrap gap-1 max-w-[250px]">
                                                        {lote.maquinas && lote.maquinas.length > 0 ? (
                                                            lote.maquinas.map((maq) => (
                                                                <span key={maq.id_maquina} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                                                                    {maq.maquina}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Sin máquinas</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${lote.estatus
                                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                        : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                        }`}>
                                                        {lote.estatus ? 'Activo' : 'Inactivo'}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button 
                                                            className="p-1.5 text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors" 
                                                            title="Editar"
                                                            onClick={() => MostrarFormulario('Editar', lote)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button 
                                                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                                                            title="Eliminar"
                                                            onClick={() => MostrarFormulario('Eliminar', lote)}
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No se encontraron lotes con los filtros actuales.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* --- COMPONENTE DEL FORMULARIO --- */}
            <FormularioLote
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedLote(null);
                    setAction('');
                }}
                title={title}
                action={action}
                refreshData={getAllLotes}
                lote={selectedLote ? selectedLote : undefined}
            />
        </>
    );
}