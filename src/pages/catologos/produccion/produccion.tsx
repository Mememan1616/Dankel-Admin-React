import { useState, useEffect, useMemo } from 'react';

import { Edit, Search, Trash2, Factory, Clock } from 'lucide-react';
import type { Produccion } from '../../../interfaces/produccion';
import type { Maquina } from '../../../interfaces/maquinas';
import type { Turno } from '../../../interfaces/turnos';
import { ApiService } from '../../../services/ApiService';
import FormularioProduccion from './formularioProduccion';

export default function ProduccionCrud() {
    const [producciones, setProducciones] = useState<Produccion[]>([]);
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [turnos, setTurnos] = useState<Turno[]>([]);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedProd, setSelectedProd] = useState<Produccion | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroMaquina, setFiltroMaquina] = useState('todas');

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [prodData, maqData, turnosData] = await Promise.all([
                ApiService.getAllProduccion(),
                ApiService.getAllMaquinas(),
                ApiService.getAllTurnos()
            ]);
            
            const produccionesArray = Array.isArray(prodData) ? prodData : Object.keys(prodData || {}).map(key => ({
                id_produccion: key,
                ...(prodData as any)[key]
            }));

            setProducciones(produccionesArray);
            setMaquinas(maqData || []);
            setTurnos(turnosData || []);
        } catch (error) {
            console.error("Error al cargar producción:", error);
        }
    };

    const MostrarFormulario = (action: string, prod?: Produccion) => {
        setIsModalOpen(true);
        setAction(action);
        setSelectedProd(prod || null);
    };

    const getNombreMaquina = (id: string) => maquinas.find(m => m.id_maquina === id)?.maquina || 'Desconocida';
    const getNombreTurno = (id: string) => turnos.find(t => t.id_turno === id)?.turno || id;

    const filtradas = useMemo(() => {
        return producciones.filter((p) => {
            const busqueda = searchTerm.toLowerCase();
            const nombreMaq = getNombreMaquina(p.id_maquina).toLowerCase();
            const lote = String(p.lote || '').toLowerCase();
            
            const coincideTexto = nombreMaq.includes(busqueda) || lote.includes(busqueda);
            const coincideMaquina = filtroMaquina === 'todas' ? true : p.id_maquina === filtroMaquina;

            return coincideTexto && coincideMaquina;
        });
    }, [producciones, searchTerm, filtroMaquina, maquinas]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">Registros de Producción</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Audita y corrige los tiempos o piezas declaradas por los operadores.
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por lote..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-white"
                        />
                    </div>
                    
                    <select 
                        value={filtroMaquina} 
                        onChange={(e) => setFiltroMaquina(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                    >
                        <option value="todas">Todas las Máquinas</option>
                        {maquinas.map(m => <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>)}
                    </select>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Máquina / Lote</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Turno</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Horario Real</th>
                                    <th className="px-6 py-4 font-bold text-center text-slate-700 dark:text-slate-200">Piezas</th>
                                    <th className="px-6 py-4 font-bold text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filtradas.length > 0 ? (
                                    filtradas.map((prod) => (
                                        <tr key={prod.id_produccion} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                        <Factory className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{getNombreMaquina(prod.id_maquina)}</p>
                                                        <p className="text-xs font-semibold text-slate-500">Lote: {prod.lote || 'N/A'}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                {getNombreTurno(prod.id_turno)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg w-max">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    {prod.hora_inicio} - {prod.hora_termino}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-sm font-bold text-slate-800 dark:text-slate-200">{prod.piezas_buenas} <span className="text-xs font-normal text-slate-500">Buenas</span></span>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1">{prod.piezas_producidas} Totales</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button 
                                                    className="p-1.5 text-slate-400 hover:text-indigo-600 transition-colors" 
                                                    title="Corregir Registro"
                                                    onClick={() => MostrarFormulario('Editar', prod)}
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button 
                                                    className="p-1.5 text-slate-400 hover:text-red-600 transition-colors ml-2" 
                                                    title="Eliminar Registro"
                                                    onClick={() => MostrarFormulario('Eliminar', prod)}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                                            No se encontraron registros de producción.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <FormularioProduccion
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                action={action}
                produccion={selectedProd}
                refreshData={cargarDatos} 
                maquinas={maquinas}
            />
        </>
    );
}