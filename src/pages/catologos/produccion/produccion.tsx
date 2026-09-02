import { useState, useEffect, useMemo } from 'react';

import { Edit, Search, Trash2, Factory, Clock, FileSpreadsheet, Download, X } from 'lucide-react';
import type { Produccion } from '../../../interfaces/produccion';
import type { Maquina } from '../../../interfaces/maquinas';
import type { Turno } from '../../../interfaces/turnos';
import type { Semana } from '../../../interfaces/semanas';
import type { Lote } from '../../../interfaces/lotes';
import type { Producto } from '../../../interfaces/productos';
import type { Usuario } from '../../../interfaces/usuarios';
import { ApiService } from '../../../services/ApiService';
import FormularioProduccion from './formularioProduccion';

export default function ProduccionCrud() {
    const [producciones, setProducciones] = useState<Produccion[]>([]);
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
    const [filtroSemana, setFiltroSemana] = useState('todas');

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [exportFiltros, setExportFiltros] = useState({
        semana: 'ultimas_4',
        maquina: 'todas'
    });

    useEffect(() => {
        cargarDatos();
    }, []);

    const cargarDatos = async () => {
        try {
            const [prodData, maqData, turnosData, semanasData, lotesData, prodCatalogData, usersData] = await Promise.all([
                ApiService.getAllProduccion(),
                ApiService.getAllMaquinas(),
                ApiService.getAllTurnos(),
                ApiService.getAllSemanas(),
                ApiService.getAllLotes(),
                ApiService.getAllProductos(),
                ApiService.getAllUsers()
            ]);
            
            const produccionesArray = Array.isArray(prodData) ? prodData : Object.keys(prodData || {}).map(key => ({
                id_produccion: key,
                ...(prodData as any)[key]
            }));

            setProducciones(produccionesArray);
            setMaquinas(maqData || []);
            setTurnos(turnosData || []);
            setSemanas(semanasData || []);
            setLotes(lotesData || []);
            setProductos(prodCatalogData || []);
            setUsuarios(usersData || []);
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
    const getNombreSemana = (id: string) => semanas.find(s => s.id_semana === id)?.descripcion || id;

    const filtradas = useMemo(() => {
        return producciones.filter((p) => {
            const busqueda = searchTerm.toLowerCase();
            const nombreMaq = getNombreMaquina(p.id_maquina).toLowerCase();
            const lote = String(p.lote || '').toLowerCase();
            
            const coincideTexto = nombreMaq.includes(busqueda) || lote.includes(busqueda);
            const coincideMaquina = filtroMaquina === 'todas' ? true : p.id_maquina === filtroMaquina;
            const coincideSemana = filtroSemana === 'todas' ? true : p.id_semana === filtroSemana;

            return coincideTexto && coincideMaquina && coincideSemana;
        });
    }, [producciones, searchTerm, filtroMaquina, filtroSemana, maquinas]);

    const handleExport = async () => {
        setIsExporting(true);
        try {
            let logs = [...producciones];

            if (exportFiltros.maquina !== 'todas') {
                logs = logs.filter(log => log.id_maquina === exportFiltros.maquina);
            }

            if (exportFiltros.semana !== 'todas') {
                if (exportFiltros.semana === 'ultimas_4') {
                    const last4Semanas = semanas.slice(-4).map(s => s.id_semana);
                    logs = logs.filter(log => last4Semanas.includes(log.id_semana));
                } else {
                    logs = logs.filter(log => log.id_semana === exportFiltros.semana);
                }
            }

            if (logs.length === 0) {
                alert('No se encontraron registros de producción con estos filtros.');
                setIsExporting(false);
                return;
            }

            const headers = ['Semana', 'Lote', 'Máquina', 'Operador', 'Producto', 'Turno', 'Fecha Producción', 'Fecha Término', 'Hora Inicio', 'Hora Término', 'Piezas Buenas', 'Piezas Malas', 'Piezas Totales'];
            const csvRows = [headers.join(',')];

            logs.forEach(row => {
                const semana = getNombreSemana(row.id_semana);
                const lote = `"${String(row.lote || row.id_lote || '').replace(/"/g, '""')}"`;
                const maquina = `"${getNombreMaquina(row.id_maquina).replace(/"/g, '""')}"`;
                const operador = `"${String(row.operador || row.id_operador || '').replace(/"/g, '""')}"`;
                const producto = `"${String(row.producto || row.id_producto || '').replace(/"/g, '""')}"`;
                const turno = getNombreTurno(row.id_turno);
                const fechaProd = row.fecha_produccion || '';
                const fechaTerm = row.fecha_termino || '';
                const horaInicio = row.hora_inicio || '';
                const horaTermino = row.hora_termino || '';
                const buenas = row.piezas_buenas ?? '';
                const malas = row.piezas_malas ?? '';
                const totales = row.piezas_producidas ?? '';
                csvRows.push([semana, lote, maquina, operador, producto, turno, fechaProd, fechaTerm, horaInicio, horaTermino, buenas, malas, totales].join(','));
            });

            const csvString = '\uFEFF' + csvRows.join('\n');
            const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `Produccion_${new Date().toISOString().split('T')[0]}.csv`);
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">Registros de Producción</h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Audita y corrige los tiempos o piezas declaradas por los operadores.
                    </p>
                </div>

                <button
                    onClick={() => setIsExportModalOpen(true)}
                    className="px-4 py-2 bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg shadow-sm font-medium text-sm transition-all flex items-center gap-2 w-full sm:w-auto justify-center"
                >
                    <FileSpreadsheet className="w-4 h-4" />
                    Exportar a Excel
                </button>
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
                        {semanas.map(s => <option key={s.id_semana} value={s.id_semana}>{s.descripcion || s.id_semana}</option>)}
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
                                    <th className="px-6 py-4 font-bold text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                    <th className="px-6 py-4 font-bold text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {filtradas.length > 0 ? (
                                    filtradas.map((prod, index) => (
                                        <tr key={(prod as any).id || index} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-slate-900 dark:text-white">{getNombreSemana(prod.id_semana)}</span>
                                                    <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Lote: {prod.lote || prod.id_lote || 'N/A'}</span>
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
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${prod.estatus ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'}`}>
                                                    {prod.estatus ? 'Activo' : 'Inactivo'}
                                                </span>
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
                turnos={turnos}
                semanas={semanas}
                lotes={lotes}
                productos={productos}
                usuarios={usuarios}
            />

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
                                    <p className="text-xs text-slate-500">Historial de Producción</p>
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
                                    <option value="ultimas_4">Últimas 4 Semanas Registradas</option>
                                    <option value="todas">Todas las Semanas (Histórico completo)</option>
                                    <optgroup label="Semanas Específicas">
                                        {semanas.map(s => (
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
                                    {maquinas.map(m => (
                                        <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>
                                    ))}
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