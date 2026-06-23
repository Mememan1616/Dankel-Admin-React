import React, { useState, useEffect } from 'react';
import { Save, AlignLeft, Settings, Factory, X, Database } from 'lucide-react';
import type { Maquina, CapacidadMaquina, TipoAlimentacion } from '../../../interfaces/maquinas';
import type { LineaProduccion } from '../../../interfaces/lineas_produccion';
import type { Producto } from '../../../interfaces/productos';
import { ApiService } from '../../../services/ApiService';

interface FormularioMaquinaProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  maquina?: Maquina;
  refreshData: () => void;
  existingMaquinas: Maquina[];
}

export default function FormularioMaquina({ isOpen, onClose, title, maquina, action, refreshData, existingMaquinas }: FormularioMaquinaProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [lineasDisponibles, setLineasDisponibles] = useState<LineaProduccion[]>([]);
  const [productosDisponibles, setProductosDisponibles] = useState<Producto[]>([]);

  // Estados de la Matriz Intermedia
  const [addCapProd, setAddCapProd] = useState('');
  const [addCapSpeed, setAddCapSpeed] = useState('');
  const [addCapType, setAddCapType] = useState<TipoAlimentacion>('Automática');
  
  // Guardamos un historial de los IDs que el usuario quita para borrarlos al final de la BD
  const [relacionesAEliminar, setRelacionesAEliminar] = useState<string[]>([]);

  const defaultFormData: Maquina = {
    id_maquina: '',
    id_linea: '',
    descripcion: '',
    estatus: true,
    linea: '',
    maquina: '',
    capacidades: [] 
  };

  const [formData, setFormData] = useState<Maquina>(defaultFormData);

  useEffect(() => {
    getCatalogos();
  }, []);

  const getCatalogos = async () => {
    try {
      const [lineasData, prodData] = await Promise.all([
        ApiService.getAllineasProduccion(),
        ApiService.getAllProductos()
      ]);
      setLineasDisponibles(lineasData || []);
      setProductosDisponibles(prodData || []);
    } catch (error) {
      console.error('Error al obtener catálogos:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      if (maquina) {
        setFormData({ ...maquina, capacidades: maquina.capacidades || [] });
      } else {
        setFormData(defaultFormData);
      }
      setAddCapProd('');
      setAddCapSpeed('');
      setRelacionesAEliminar([]); // Resetear cola de eliminados
    }
  }, [isOpen, maquina]);

  useEffect(() => {
    if (isOpen && productosDisponibles.length > 0) {
      const alreadyAssigned = formData.capacidades?.map(c => c.producto) || [];
      const available = productosDisponibles.filter(p => !alreadyAssigned.includes(p.producto));
      if (available.length > 0 && !available.map(a=>a.producto).includes(addCapProd)) {
        setAddCapProd(available[0].producto);
      } else if (available.length === 0) {
        setAddCapProd('');
      }
    }
  }, [isOpen, formData.capacidades, productosDisponibles]);

  if (!isOpen) return null;

  const handleLineaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const lineaSeleccionada = lineasDisponibles.find((l) => l.id_linea_trabajo === selectedId);
    setFormData((prev) => ({
      ...prev,
      id_linea: selectedId,
      linea: lineaSeleccionada ? lineaSeleccionada.linea : '',
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- LÓGICA DE TABLA INTERMEDIA (En Memoria hasta que se de Guardar) ---
  const handleAddCapacity = () => {
    if (!addCapProd) {
      alert("Seleccione un producto."); return;
    }
    const speed = parseInt(addCapSpeed);
    if (isNaN(speed) || speed <= 0) {
      alert("Ingrese una velocidad válida."); return;
    }

    const prodInfo = productosDisponibles.find(p => p.producto === addCapProd);

    const nuevaCapacidad: CapacidadMaquina = {
        id_producto: prodInfo?.id_producto || '',
        producto: addCapProd,
        velocidad: speed,
        tipo: addCapType
    };

    setFormData(prev => ({
        ...prev,
        capacidades: [...(prev.capacidades || []), nuevaCapacidad]
    }));
    setAddCapSpeed('');
  };

  const handleRemoveCapacity = (productName: string, id_relacion?: string) => {
    // 🔥 DEBUG preventivo: Verificamos si el ID llega correctamente desde la BD
    console.log("Intentando remover:", productName, "| ID recibido de la BD:", id_relacion);

    // Si tenía un id_relacion válido, se registra para enviarse al backend
    if (id_relacion) {
        setRelacionesAEliminar(prev => [...prev, id_relacion]);
        console.log("Añadido a la cola de eliminación:", id_relacion);
    } else {
        console.warn("⚠️ ALERTA: id_relacion es undefined. No se enviará ninguna orden de eliminación al servidor.");
    }

    setFormData(prev => ({
        ...prev,
        capacidades: (prev.capacidades || []).filter(c => c.producto !== productName)
    }));
  };

  // --- GUARDADO A LAS DOS TABLAS ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    if (!formData.maquina.trim()) { alert("El nombre es obligatorio."); return; }
    if (!formData.id_linea) { alert("Seleccione una línea."); return; }

    const nombreIngresado = formData.maquina.trim().toLowerCase();
    const maquinaExiste = existingMaquinas.find(m => m.maquina.trim().toLowerCase() === nombreIngresado);

    if (action === 'Crear' && maquinaExiste) {
        alert('Este nombre de máquina ya existe.'); return;
    }
    if (action === 'Editar' && maquinaExiste && maquinaExiste.id_maquina !== formData.id_maquina) {
        alert('Nombre usado por otra máquina.'); return;
    }

    setIsLoading(true);

    try {
      let finalMachineId = formData.id_maquina;

      // 1. Crear o Actualizar la Máquina Principal
      if (action === 'Crear') {
        const res = await ApiService.insertMaquina(formData);
        if (!res.success) throw new Error("Error creando máquina");
        finalMachineId = (res.result as any)?.clave || (res.result as any)?.id || formData.id_maquina; 
      } else {
        await ApiService.updateMaquina(formData);
      }

      // 2. Ejecutar Eliminaciones en la Tabla Intermedia
      console.log("Procediendo a eliminar de la BD los siguientes IDs:", relacionesAEliminar);
      for (const id_rel of relacionesAEliminar) {
          await ApiService.deleteProduccionProductoMaquina(id_rel);
      }

      // 3. Ejecutar Inserciones en la Tabla Intermedia (Solo las nuevas)
      const nuevasRelaciones = (formData.capacidades || []).filter(c => !c.id_relacion);
      for (const cap of nuevasRelaciones) {
          await ApiService.insertProduccionProductoMaquina({
              id_maquina: finalMachineId,
              id_producto: cap.id_producto,
              producto: cap.producto,
              velocidad: cap.velocidad,
              tipo: cap.tipo
          });
      }

      refreshData();
      onClose();
      
    } catch (error) {
      console.error('Error en la petición:', error);
      alert('Ocurrió un error al guardar o asociar.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentCaps = formData.capacidades || [];
  const assignedProdNames = currentCaps.map(c => c.producto);
  const availableProducts = productosDisponibles.filter(p => !assignedProdNames.includes(p.producto));

  return (
    <div className="font-sans">
      <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity" onClick={onClose}>
        <div className="w-full max-w-3xl bg-white dark:bg-[#0e1320] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[95vh]" onClick={(e) => e.stopPropagation()}>
          
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-transparent">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-100 dark:bg-indigo-600/10 p-2.5 rounded-lg border border-indigo-200 dark:border-indigo-500/20">
                <Settings className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{title}</h3>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Datos y tabla intermedia `produccion_producto_maquina`.</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-rose-500 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6">
            
            {/* DATOS GENERALES */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Nombre de la Máquina</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input type="text" name="maquina" value={formData.maquina} onChange={handleInputChange} required
                    className="w-full bg-white dark:bg-[#161c2a] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Línea de Producción</label>
                <select value={formData.id_linea} onChange={handleLineaSelect} required
                  className="w-full bg-white dark:bg-[#161c2a] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 px-3 text-sm outline-none"
                >
                  <option value="" disabled>Seleccione línea...</option>
                  {lineasDisponibles.map((linea) => <option key={linea.id_linea_trabajo} value={linea.id_linea_trabajo}>{linea.linea}</option>)}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-2 uppercase">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute top-3 left-3 h-4 w-4 text-slate-400" />
                  <textarea name="descripcion" value={formData.descripcion} onChange={handleInputChange} rows={2}
                    className="w-full bg-white dark:bg-[#161c2a] text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 focus:border-indigo-500 rounded-xl py-2.5 pl-9 pr-3 text-sm outline-none resize-none"
                  />
                </div>
              </div>
            </div>

            {/* SECCIÓN TABLA INTERMEDIA */}
            <div className="border-t border-slate-200 dark:border-slate-800/80 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                    <Database className="w-4 h-4 text-indigo-500" /> Asignación Producción - Producto - Máquina
                  </h4>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-[#111623] p-4 rounded-xl border border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-5">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Producto</label>
                  <select 
                    value={addCapProd}
                    onChange={(e) => setAddCapProd(e.target.value)}
                    disabled={availableProducts.length === 0}
                    className="w-full bg-white dark:bg-[#1c2335] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/60 rounded-lg py-2 px-3 text-xs outline-none focus:border-indigo-500 disabled:opacity-50"
                  >
                    {availableProducts.length === 0 ? <option value="">Todos asignados</option> : availableProducts.map(p => <option key={p.id_producto} value={p.producto}>{p.producto}</option>)}
                  </select>
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Vel. (pzs x hr)</label>
                  <input type="number" value={addCapSpeed} onChange={(e) => setAddCapSpeed(e.target.value)}
                    className="w-full bg-white dark:bg-[#1c2335] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/60 rounded-lg py-2 px-3 text-xs outline-none focus:border-indigo-500" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tipo</label>
                  <select value={addCapType} onChange={(e) => setAddCapType(e.target.value as TipoAlimentacion)}
                    className="w-full bg-white dark:bg-[#1c2335] text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700/60 rounded-lg py-2 px-3 text-xs outline-none focus:border-indigo-500"
                  >
                    <option value="Automática">Automática</option>
                    <option value="Manual">Manual</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button type="button" onClick={handleAddCapacity} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-2 rounded-lg transition-colors">
                    + Insertar
                  </button>
                </div>
              </div>

              {/* Tabla de Rendimientos Asignados */}
              <div className="mt-4 border border-slate-200 dark:border-slate-800/60 rounded-xl overflow-hidden bg-white dark:bg-[#111623]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/40 text-[10px] text-slate-500 uppercase font-bold">
                      <th className="py-3 px-4">Producto</th>
                      <th className="py-3 px-4 text-right">Vel. Teórica</th>
                      <th className="py-3 px-4 text-center">Tipo</th>
                      <th className="py-3 px-4 text-center w-12">Remover</th>
                    </tr>
                  </thead>
                  <tbody className="text-xs divide-y divide-slate-100 dark:divide-slate-800/50">
                    {currentCaps.map(cap => (
                      <tr key={cap.producto} className="hover:bg-slate-50 dark:hover:bg-slate-900/30">
                        <td className="py-2.5 px-4 font-semibold text-slate-800 dark:text-slate-200">{cap.producto}</td>
                        <td className="py-2.5 px-4 text-right font-mono text-indigo-600 dark:text-indigo-400 font-bold">{cap.velocidad.toLocaleString()} pzs/h</td>
                        <td className="py-2.5 px-4 text-center">
                          <span className={`inline-block px-2 py-0.5 rounded-md font-bold text-[10px] ${cap.tipo === 'Manual' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>{cap.tipo}</span>
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {/* Pasamos id_relacion para asegurar que se registre el borrado */}
                          <button type="button" onClick={() => handleRemoveCapacity(cap.producto, cap.id_relacion)} className="text-rose-500 hover:text-rose-600 p-1">
                            <X className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-[#0e1320] z-10">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-slate-300 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-700 dark:text-slate-300">
                Cancelar
              </button>
              <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-md">
                <Save className="w-4 h-4" /> {isLoading ? 'Guardando DB...' : 'Guardar Registros'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}