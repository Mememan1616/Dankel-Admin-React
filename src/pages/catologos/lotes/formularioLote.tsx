import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { Lote, Maquina_Lote } from '../../../interfaces/lotes';
import type { Maquina } from '../../../interfaces/maquinas';
import type { LineaProduccion } from '../../../interfaces/lineas_produccion';
import type { Producto } from '../../../interfaces/productos';
import type { Semana } from '../../../interfaces/semanas';
import type { ProduccionProductoMaquina } from '../../../interfaces/produccionxmaquina';
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import { parseFecha } from '../../../utils/fechas';
import {
  Sun,
  Moon,
  Save,
  Hash,
  AlignLeft,
  Package,
  X,
  Plus,
  Layers,
  Calendar,
  CheckCircle2,
  FolderTree,
  Search
} from 'lucide-react';

interface FormularioLoteProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  lote?: Lote;
  refreshData: () => void;
  existingLotes: Lote[];
}

export default function FormularioLote({ isOpen, onClose, title, lote, action, refreshData, existingLotes }: FormularioLoteProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para catálogos
  const [lineas, setLineas] = useState<LineaProduccion[]>([]);
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);
  const [semanas, setSemanas] = useState<Semana[]>([]);
  const [todasLasSemanas, setTodasLasSemanas] = useState<Semana[]>([]);
  const [capacidades, setCapacidades] = useState<ProduccionProductoMaquina[]>([]);
  const [busquedaSemana, setBusquedaSemana] = useState('');
  const [semanaDropdownOpen, setSemanaDropdownOpen] = useState(false);
  const semanaRef = useRef<HTMLDivElement>(null);

  const defaultFormData: Lote = {
    id_lote: '',
    lote: '',
    descripcion: '',
    estatus: true, 
    id_linea_trabajo: '',
    linea: '',
    id_producto: '',
    producto: '',
    id_semana: '', 
    maquinas: []
  };

  const [formData, setFormData] = useState<Lote>(defaultFormData);

  // Mapa: id_producto → Set<id_maquina> de máquinas compatibles
  const productoMaquinasMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    capacidades.forEach((c: ProduccionProductoMaquina) => {
      if (!c.id_producto || !c.id_maquina) return;
      if (!map.has(c.id_producto)) map.set(c.id_producto, new Set());
      map.get(c.id_producto)!.add(c.id_maquina);
    });
    console.log(`%c🔗 [CAPACIDADES] Mapa producto→máquinas construido:`, 'background: #6366f1; color: white; padding: 3px;');
    console.log('  → Total relaciones cargadas:', capacidades.length);
    console.log('  → Mapa:', Object.fromEntries(map));
    return map;
  }, [capacidades]);

  const semanasVisibles = useMemo(() => {
    const source = action === 'Crear' ? semanas : todasLasSemanas;
    if (!busquedaSemana.trim()) return source;
    const term = busquedaSemana.toLowerCase();
    return source.filter(s =>
      (s.descripcion || '').toLowerCase().includes(term) ||
      (s.id_semana || '').toLowerCase().includes(term) ||
      (s.fecha_inicio || '').includes(term) ||
      (s.fecha_termino || '').includes(term)
    );
  }, [action, semanas, todasLasSemanas, busquedaSemana]);

  useEffect(() => {
    if (isOpen) {
      if (lote) {
        setFormData({
          ...lote,
          maquinas: lote.maquinas || [] 
        });
      } else {
        setFormData(defaultFormData);
      }

      setShowSuccess(false);
      setBusquedaSemana('');
      setSemanaDropdownOpen(false);
      loadAllData();
    }
  }, [isOpen, lote]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (semanaRef.current && !semanaRef.current.contains(e.target as Node)) {
        setSemanaDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateSemanaLotes = async (id_semana: string) => {
    try {
      const response = await ApiService.updateSemanaLotes(id_semana);
      if (!response.success) {
        throw new Error(`Error del servidor (${response.status}): ${response.error}`);
      }
      console.log(response);
      return response;
    } catch (error) {
      console.error('Error en updateLoteProduccion:', error);
      throw error;
    }
  }
  const loadAllData = async () => {
    try {
      const [lineasData, maquinasData, productosData, semanasData, capacidadesData] = await Promise.all([
        ApiService.getAllineasProduccion(),
        ApiService.getAllMaquinasLote(),
        ApiService.getAllProductos(),
        ApiService.getAllSemanas(),
        ApiService.getAllProduccionProductoMaquina()
      ]);

      const productosOrdenados = productosData.sort((a, b) => a.producto.localeCompare(b.producto));

      setLineas(lineasData);
      setMaquinas(maquinasData);
      setProductos(productosOrdenados);
      setCapacidades(capacidadesData || []);
      console.log('📦 [getAllProduccionProductoMaquina] Respuesta:', capacidadesData);
      
      setTodasLasSemanas(semanasData);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      setSemanas(semanasData.filter((s) => {
        const termino = parseFecha(s.fecha_termino);
        return !isNaN(termino) && termino >= hoy.getTime();
      }));
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProductoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = productos.find(p => p.id_producto === selectedId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        id_producto: selected.id_producto,
        producto: selected.producto 
      }));

      const maquinasCompatibles = maquinas.filter(m =>
        productoMaquinasMap.get(selected.id_producto)?.has(m.id_maquina)
      );
      console.log(`%c🔍 [PRODUCTO] "${selected.producto}" seleccionado:`, 'background: #22c55e; color: white; padding: 3px; font-weight: bold;');
      console.log('  → Máquinas compatibles:', maquinasCompatibles.map(m => m.maquina));
      console.log('  → IDs:', maquinasCompatibles.map(m => m.id_maquina));
    }
  };

  const handleMaquinaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const maquinaSeleccionada = maquinas.find(
      (m) => m.id_maquina.toString() === selectedId.toString()
    );

    const yaExiste = formData.maquinas.some(
      (m) => m.id_maquina.toString() === selectedId.toString()
    );

    if (maquinaSeleccionada && !yaExiste) {
      setFormData((prev) => ({
        ...prev,
        maquinas: [...prev.maquinas, { id_maquina: maquinaSeleccionada.id_maquina, estatus: true }]
      }));
    }
    e.target.value = "";
  };

  const removeMaquina = (id: string | number) => {
    setFormData((prev) => ({
      ...prev,
      maquinas: prev.maquinas.filter(
        (m) => m.id_maquina.toString() !== id.toString()
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    const nombreLoteIngresado = formData.lote.trim().toLowerCase();
    const loteExistente = existingLotes.find(l => l.lote.trim().toLowerCase() === nombreLoteIngresado);

    if (action === 'Crear' && loteExistente) {
        alert('Ya existe un lote con este nombre. Por favor, ingresa un nombre distinto.');
        return;
    }

    if (action === 'Editar' && loteExistente && loteExistente.id_lote !== formData.id_lote) {
        alert('Ya existe otro lote con este nombre. Por favor, ingresa un nombre distinto.');
        return;
    }

    setIsLoading(true);
    

    // Eliminamos el campo display 'linea' del payload para no enviarlo al backend
    const payload = { ...formData };
    delete (payload as any).linea;

    

    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertLote(payload as Lote),
      'Editar': () => ApiService.updateLote(payload as Lote),
      'Eliminar': () => ApiService.deleteLote(payload.id_lote)
    };

    console.log(`%c📦 [${action.toUpperCase()} LOTE] Payload enviado al backend:`, 'background: #6366f1; color: white; padding: 3px; font-weight: bold;');
    console.log('  → Lote:', payload.lote);
    console.log('  → Máquinas:', payload.maquinas);
    console.log('  → Payload completo:', payload);

    try {
      const executeAction = actionMap[action];

      if (!executeAction) {
        throw new Error(`Acción no permitida: ${action}`);
      }

      const response = await executeAction();

      if (response.success) {
        if ((action === 'Crear' || action === 'Editar') && formData.id_semana) {
          updateSemanaLotes(formData.id_semana).catch(() => {});
        }
        setShowSuccess(true);
        refreshData();
        setTimeout(() => { setShowSuccess(false); onClose(); }, 1500);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`${isDarkMode ? 'dark' : ''} font-sans`}>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col max-h-[95vh]" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white shadow-sm"><Package className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detalles del lote de trabajo y recursos.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"><X className="w-6 h-6" /></button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ID Lote */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID del Lote</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="id_lote"
                    value={formData.id_lote}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-gray-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed"
                    placeholder="Lo generará el sistema..."
                  />
                </div>
              </div>

              {/* Nombre Lote */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Lote</label>
                <div className="relative">
                  <Package className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lote"
                    value={formData.lote}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Producción Mañana"
                    required
                  />
                </div>
              </div>

              {/* Selector de Departamento / Línea */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Departamento / Línea</label>
                <div className="relative">
                  <FolderTree className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    name="id_linea_trabajo"
                    value={formData.id_linea_trabajo || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="" disabled>Seleccione el departamento...</option>
                    {lineas.filter(l => l.estatus).map((ln) => (
                      <option key={ln.id_linea_trabajo} value={ln.id_linea_trabajo}>
                        {ln.linea} — {ln.descripcion}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selector de Semana */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Semana Asignada</label>
                <div className="relative" ref={semanaRef}>
                  <div
                    onClick={() => setSemanaDropdownOpen(!semanaDropdownOpen)}
                    className="flex items-center w-full border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 cursor-pointer hover:border-indigo-400 transition-colors"
                  >
                    <Calendar className="ml-3 h-5 w-5 text-gray-400 shrink-0" />
                    <div className="flex-1 px-3 py-2.5 text-sm text-gray-900 dark:text-white truncate">
                      {formData.id_semana
                        ? (todasLasSemanas.find(s => s.id_semana === formData.id_semana)
                            ? `${todasLasSemanas.find(s => s.id_semana === formData.id_semana)!.descripcion} (${todasLasSemanas.find(s => s.id_semana === formData.id_semana)!.fecha_inicio} al ${todasLasSemanas.find(s => s.id_semana === formData.id_semana)!.fecha_termino})`
                            : formData.id_semana)
                        : <span className="text-gray-400">Seleccione la semana de trabajo...</span>
                      }
                    </div>
                    <svg className={`mr-3 h-4 w-4 text-gray-400 transition-transform ${semanaDropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </div>

                  {semanaDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg max-h-64 flex flex-col">
                      <div className="p-2 border-b border-gray-100 dark:border-slate-700">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-2 h-4 w-4 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Buscar semana..."
                            value={busquedaSemana}
                            onChange={(e) => setBusquedaSemana(e.target.value)}
                            autoFocus
                            className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 dark:border-slate-600 rounded-lg bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <div className="overflow-y-auto flex-1">
                        {semanasVisibles.length === 0 && (
                          <div className="px-3 py-2 text-sm text-gray-400 text-center">No se encontraron semanas</div>
                        )}
                        {(() => {
                          const hoy = new Date();
                          hoy.setHours(0, 0, 0, 0);
                          const activas = semanasVisibles.filter(s => {
                            const termino = parseFecha(s.fecha_termino);
                            return !isNaN(termino) && termino >= hoy.getTime();
                          });
                          const vencidas = semanasVisibles.filter(s => {
                            const termino = parseFecha(s.fecha_termino);
                            return isNaN(termino) || termino < hoy.getTime();
                          });
                          return (
                            <>
                              {activas.map(s => (
                                <div
                                  key={s.id_semana}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, id_semana: s.id_semana }));
                                    setSemanaDropdownOpen(false);
                                    setBusquedaSemana('');
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center justify-between ${
                                    formData.id_semana === s.id_semana ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-900 dark:text-white'
                                  }`}
                                >
                                  <span className="truncate">{s.descripcion}</span>
                                  <span className="text-xs text-gray-400 shrink-0 ml-2">{s.fecha_inicio} - {s.fecha_termino}</span>
                                </div>
                              ))}
                              {activas.length > 0 && vencidas.length > 0 && (
                                <div className="px-3 py-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-slate-900 border-t border-gray-100 dark:border-slate-700">
                                  Vencidas
                                </div>
                              )}
                              {vencidas.map(s => (
                                <div
                                  key={s.id_semana}
                                  onClick={() => {
                                    setFormData(prev => ({ ...prev, id_semana: s.id_semana }));
                                    setSemanaDropdownOpen(false);
                                    setBusquedaSemana('');
                                  }}
                                  className={`px-3 py-2 text-sm cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-700 flex items-center justify-between ${
                                    formData.id_semana === s.id_semana ? 'bg-indigo-50 dark:bg-slate-700 text-indigo-700 dark:text-indigo-300 font-semibold' : 'text-gray-500 dark:text-gray-400'
                                  }`}
                                >
                                  <span className="truncate">{s.descripcion} <span className="text-[10px] text-amber-500 font-bold">(vencida)</span></span>
                                  <span className="text-xs text-gray-400 shrink-0 ml-2">{s.fecha_inicio} - {s.fecha_termino}</span>
                                </div>
                              ))}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Select Producto */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Producto</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.id_producto}
                    onChange={handleProductoChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500"
                    required
                  >
                    <option value="" disabled>Seleccione producto...</option>
                    {productos.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>{p.producto}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Selección de Máquinas (Multi-select) */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 text-indigo-600 dark:text-indigo-400 font-bold">Asignar Máquinas</label>
                <div className="relative mb-3">
                  <Plus className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    onChange={handleMaquinaChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none focus:ring-2 focus:ring-indigo-500"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      {formData.id_producto ? 'Añadir máquina...' : 'Primero seleccione un producto'}
                    </option>
                    {maquinas.map((m) => {
                      const yaSeleccionada = formData.maquinas.some(sel => sel.id_maquina.toString() === m.id_maquina.toString());
                      const esCompatible = formData.id_producto
                        ? productoMaquinasMap.get(formData.id_producto)?.has(m.id_maquina) ?? false
                        : true;
                      const deshabilitada = yaSeleccionada || !esCompatible || !formData.id_producto;
                      return (
                        <option key={m.id_maquina} value={m.id_maquina} disabled={deshabilitada}>
                          {m.maquina}{!esCompatible && formData.id_producto ? ' ❌' : ''}
                        </option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="flex flex-wrap gap-2 p-3 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/30 min-h-[50px]">
                  {formData.maquinas.map((m: Maquina_Lote) => {
                    const nombreMaquina = maquinas.find(mq => mq.id_maquina === m.id_maquina)?.maquina || m.id_maquina;
                    return (
                      <span key={m.id_maquina} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                        {nombreMaquina}
                        <button type="button" onClick={() => removeMaquina(m.id_maquina)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Descripción */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={2}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Detalles sobre el lote..."
                  />
                </div>
              </div>

            </div>

            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Registro guardado con éxito!</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button type="submit" disabled={isLoading} className="flex justify-center items-center gap-2 px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors">
                {isLoading ? 'Procesando...' : <><Save className="w-4 h-4" /> Guardar Lote</>}
              </button>
            </div>
          </form>

        </div>
      </div>
    </div>
  );
}