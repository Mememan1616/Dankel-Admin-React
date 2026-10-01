import { useState, useEffect, useMemo } from 'react';

import { Edit, Search, Trash2, Factory, Clock, FileSpreadsheet } from 'lucide-react';
import type { Produccion } from '../../../interfaces/produccion';
import type { Maquina } from '../../../interfaces/maquinas';
import type { Turno } from '../../../interfaces/turnos';
import type { Semana } from '../../../interfaces/semanas';
import type { Lote } from '../../../interfaces/lotes';
import type { Producto } from '../../../interfaces/productos';
import type { Usuario } from '../../../interfaces/usuarios';
import { ApiService } from '../../../services/ApiService';
import { useDatosPorSemana } from '../../../hooks/useDatosPorSemana';
import { getSemanaMasReciente } from '../../../utils/semanas';
import { exportarProduccion } from '../../../utils/exportarProduccion';
import FormularioProduccion from './formularioProduccion';

export default function ProduccionCrud() {
    const [maquinas, setMaquinas] = useState<Maquina[]>([]);
    const [turnos, setTurnos] = useState<Turno[]>([]);
    const [semanas, setSemanas] = useState<Semana[]>([]);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [productos, setProductos] = useState<Producto[]>([]);
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedProd, setSelectedProd] = useState<Produccion | null>(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [filtroMaquina, setFiltroMaquina] = useState('todas');
    const [filtroSemana, setFiltroSemana] = useState('');
    const [isExporting, setIsExporting] = useState(false);

    const { produccion: producciones, loading, recargar } = useDatosPorSemana({
        semanas,
        seleccionadas: filtroSemana === 'todas' ? [] : [filtroSemana],
        incluir: { produccion: true, paros: false }
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [maqData, turnosData, semanasData, lotesData, prodCatalogData, usersData] = await Promise.all([
                ApiService.getAllMaquinas(),
                ApiService.getAllTurnos(),
                ApiService.getAllSemanas(),
                ApiService.getAllLotes(),
                ApiService.getAllProductos(),
                ApiService.getAllUsers()
            ]);

            setMaquinas(maqData || []);
            setTurnos(turnosData || []);
            setSemanas(semanasData || []);
            setLotes(lotesData || []);
            setProductos(prodCatalogData || []);
            setUsuarios(usersData || []);

            const listaSemanas = semanasData || [];
            if (listaSemanas.length > 0) {
                setFiltroSemana(getSemanaMasReciente(listaSemanas));
            }
        } catch (error) {
            console.error("Error al cargar producción:", error);
        }
    };

    const refrescar = () => {
        cargarDatos();
        recargar();
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

    const handleExport = async () => {
        if (filtradas.length === 0 || isExporting) return;
        setIsExporting(true);
        try {
            await exportarProduccion(filtradas as Produccion[], semanas, maquinas);
        } catch (error) {
            console.error('Error al exportar producción:', error);
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">Registros de Producción</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Audita y corrige los tiempos o piezas declaradas por los operadores.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        onClick={handleExport}
                        disabled={isExporting || filtradas.length === 0}
                        title={
                            filtradas.length === 0
                                ? 'No hay registros para exportar con los filtros actuales'
                                : `Exportar ${filtradas.length} registros a Excel`
                        }
                        className="px-4 py-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg shadow-sm font-medium text-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white dark:disabled:hover:bg-slate-800"
                    >
                        {isExporting ? (
                            <Clock className="w-4 h-4 animate-spin" />
                        ) : (
                            <FileSpreadsheet className="w-4 h-4" />
                        )}
                        {isExporting ? 'Generando...' : 'Exportar a Excel'}
                    </button>
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

                    <select
                        value={filtroSemana}
                        onChange={(e) => setFiltroSemana(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 text-slate-700 dark:text-slate-200"
                    >
                        <option value="todas">Todas las Semanas</option>
                        {semanas.map(s => (
                            <option key={s.id_semana} value={s.id_semana}>{s.descripcion || s.id_semana}</option>
                        ))}
                    </select>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Semana / Lote</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Máquina</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Operador</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Producto</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Turno / Fechas</th>
                                    <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200">Horario Real</th>
                                    <th className="px-6 py-4 font-bold text-center text-slate-700 dark:text-slate-200">Piezas</th>
                                    <th className="px-6 py-4 font-bold text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filtradas.length > 0 ? (
                                    filtradas.map((prod, index) => (
                                        <tr key={(prod as any).id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">{prod.id_semana}</span>
                                                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Lote: {prod.lote}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400">
                                                        <Factory className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900 dark:text-white">{getNombreMaquina(prod.id_maquina)}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {prod.operador || prod.id_operador || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm font-medium text-slate-700 dark:text-slate-300">
                                                {prod.producto || prod.id_producto || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-slate-700 dark:text-slate-300">
                                                <div className="flex flex-col gap-1">
                                                    <span className="font-bold text-slate-800 dark:text-slate-200">{getNombreTurno(prod.id_turno)}</span>
                                                    <span className="text-xs text-slate-500">{prod.fecha_produccion} a {prod.fecha_termino}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg w-max">
                                                    <Clock className="w-4 h-4 text-slate-400" />
                                                    {prod.hora_inicio} - {prod.hora_termino}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col items-center">
                                                    <div className="flex gap-2">
                                                        <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{prod.piezas_buenas} <span className="text-xs font-normal">Buenas</span></span>
                                                        <span className="text-sm font-bold text-rose-600 dark:text-rose-400">{prod.piezas_malas} <span className="text-xs font-normal">Malas</span></span>
                                                    </div>
                                                    <span className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-200 dark:border-slate-700 pt-1 mt-1 w-full text-center">{prod.piezas_producidas} Totales</span>
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
                                        <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                                            {loading ? 'Cargando registros de producción...' : 'No se encontraron registros de producción.'}
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
                refreshData={refrescar}
                maquinas={maquinas}
                turnos={turnos}
                semanas={semanas}
                lotes={lotes}
                productos={productos}
                usuarios={usuarios}
            />
        </>
    );
}