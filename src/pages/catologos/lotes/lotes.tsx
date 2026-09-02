import { useState, useEffect, useMemo } from 'react';
import type { Lote } from '../../../interfaces/lotes';
import type { Maquina } from '../../../interfaces/maquinas';
import type { Semana } from '../../../interfaces/semanas';
import { ApiService } from '../../../services/ApiService';
import { parseFecha } from '../../../utils/fechas';
import {
    Edit,
    Search,
    Filter,
    Package, // Cambiado para representar un Lote
    Plus,
} from 'lucide-react';
import FormularioLote from './formularioLote'; // Asegúrate de que este componente exista y esté adaptado

export default function LotesCrud() {
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [catalogoMaquinas, setCatalogoMaquinas] = useState<Maquina[]>([]);
    const [semanas, setSemanas] = useState<Semana[]>([]);
    
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
        loadMaquinasCatalog();
        loadSemanasCatalog();
    }, []);

    const loadSemanasCatalog = async () => {
        try {
            const data = await ApiService.getAllSemanas();
            setSemanas(data);
        } catch (error) {
            console.error('Error al cargar catálogo de semanas:', error);
        }
    };

    const loadMaquinasCatalog = async () => {
        try {
            const data = await ApiService.getAllMaquinasLote();
            setCatalogoMaquinas(data);
        } catch (error) {
            console.error('Error al cargar catálogo de máquinas:', error);
        }
    };

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

    // --- FUNCIÓN PARA CAMBIAR ESTATUS DIRECTO EN TABLA ---
    const handleToggleEstatus = async (lote: Lote) => {
        try {
            const loteActualizado = { ...lote, estatus: !lote.estatus };
            const response = await ApiService.updateLote(loteActualizado);
            if (response.success) {
                getAllLotes(); // Refrescar la tabla
            } else {
                alert('Hubo un error al actualizar el estatus.');
            }
        } catch (error) {
            console.error('Error al actualizar estatus:', error);
            alert('Error de conexión al intentar actualizar el estatus.');
        }
    };

    const semanasMap = useMemo(() => {
        const map = new Map<string, Semana>();
        semanas.forEach(s => map.set(s.id_semana, s));
        return map;
    }, [semanas]);

    // --- LÓGICA DE FILTRADO Y ORDENAMIENTO ---
    const lotesFiltrados = useMemo(() => {
        const filtrados = lotes.filter((lote) => {
            const busqueda = searchTerm.toLowerCase();
            
            // CONVERSIÓN SEGURA: Transformamos a String explícitamente y manejamos undefined/null
            const strLote = String(lote.lote || '').toLowerCase();
            const strLinea = String(lote.linea || '').toLowerCase();
            const strDesc = String(lote.descripcion || '').toLowerCase();

            // 1. Búsqueda por texto segura
            const coincideTexto = 
                strLote.includes(busqueda) || 
                strLinea.includes(busqueda) ||
                strDesc.includes(busqueda);

            // 2. Filtro por Estatus
            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? lote.estatus === true :
                lote.estatus === false;

            return coincideTexto && coincideEstatus;
        });

        // Ordenar por fecha de inicio de la semana, descendente (más recientes primero).
        // Los lotes sin semana o con fecha inválida van al final.
        return filtrados.sort((a, b) => {
            const inicioA = a.id_semana ? parseFecha(semanasMap.get(a.id_semana)?.fecha_inicio || '') : NaN;
            const inicioB = b.id_semana ? parseFecha(semanasMap.get(b.id_semana)?.fecha_inicio || '') : NaN;
            const valA = isNaN(inicioA) ? -Infinity : inicioA;
            const valB = isNaN(inicioB) ? -Infinity : inicioB;
            return valB - valA;
        });
    }, [lotes, searchTerm, filtroEstatus, semanasMap]);

    const maquinasMap = useMemo(() => {
        const map = new Map<string, string>();
        catalogoMaquinas.forEach(m => map.set(m.id_maquina, m.maquina));
        return map;
    }, [catalogoMaquinas]);

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
                                        placeholder="Buscar por lote, departamento o descripción..."
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
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Semana</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Departamento</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Descripción</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Máquinas asignadas</th>
                                    <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                    <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {lotesFiltrados.length > 0 ? (
                                    lotesFiltrados.map((lote) => {
                                        const sem = lote.id_semana ? semanasMap.get(lote.id_semana) : undefined;
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
                                                    {sem ? (
                                                        <>
                                                            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">{sem.descripcion}</p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">{sem.fecha_inicio} al {sem.fecha_termino}</p>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400 italic">Sin semana</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="text-sm text-slate-700 dark:text-slate-300 capitalize">{lote.linea}</p>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400">{lote.id_linea_trabajo}</p>
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
                                                                    {maquinasMap.get(maq.id_maquina) || maq.id_maquina}
                                                                </span>
                                                            ))
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Sin máquinas</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        <span className={`text-xs font-medium ${lote.estatus ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-500 dark:text-slate-400'}`}>
                                                            {lote.estatus ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleToggleEstatus(lote)}
                                                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${lote.estatus ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`}
                                                            title={lote.estatus ? 'Desactivar lote' : 'Activar lote'}
                                                        >
                                                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${lote.estatus ? 'translate-x-6' : 'translate-x-1'}`} />
                                                        </button>
                                                    </div>
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
                                                      
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
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
                existingLotes={lotes} // Pasamos los lotes para validar duplicados
            />
        </>
    );
}