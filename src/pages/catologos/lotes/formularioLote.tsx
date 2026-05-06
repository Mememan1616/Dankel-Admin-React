import React, { useState, useEffect } from 'react';
import type { Lote } from '../../../interfaces/lotes';
import type { Maquina } from '../../../interfaces/maquinas';
import type { FormaTrabajo } from '../../../interfaces/forma_trabajo';
import type { Producto } from '../../../interfaces/productos';
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import {
  Sun,
  Moon,
  Save,
  Hash,
  AlignLeft,
  Activity,
  Package,
  Briefcase,

  X,
  Plus,
  Layers
} from 'lucide-react';

interface FormularioLoteProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  lote?: Lote;
  refreshData: () => void;
}

export default function FormularioLote({ isOpen, onClose, title, lote, action, refreshData }: FormularioLoteProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para catálogos
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [formasTrabajo, setFormasTrabajo] = useState<FormaTrabajo[]>([]);
  const [productos, setProductos] = useState<Producto[]>([]);

  const defaultFormData: Lote = {
    id_lote: '',
    lote: '',
    descripcion: '',
    estatus: true,
    id_forma_trabajo: '',
    forma_trabajo: '',
    id_producto: '',
    producto: '',
    maquinas: []
  };

  const [formData, setFormData] = useState<Lote>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (lote) {
        // Si hay un lote, nos aseguramos de que tenga el array de máquinas
        setFormData({
          ...lote,
          maquinas: lote.maquinas || [] // Si lote.maquinas es null/undefined, usa []
        });
      } else {
        // Si es un lote nuevo, usamos los valores por defecto
        setFormData(defaultFormData);
      }

      setShowSuccess(false);
      loadAllData();
    }
  }, [isOpen, lote]);

  const loadAllData = async () => {
    try {


      const maquinas: Maquina[] = await ApiService.getAllMaquinasLote();
      const formasTrabajo: FormaTrabajo[] = await ApiService.getAllFormasTrabajo();
      const productos: Producto[] = await ApiService.getAllProductos() // Asegúrate de tener este método en tu ApiService

      setMaquinas(maquinas);
      setFormasTrabajo(formasTrabajo);
      setProductos(productos);
    } catch (error) {
      console.error('Error al cargar catálogos:', error);
    }
  };

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Manejador para Forma de Trabajo (ID y Nombre)
  const handleFormaTrabajoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = formasTrabajo.find(f => f.id_forma_trabajo === selectedId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        id_forma_trabajo: selected.id_forma_trabajo,
        forma_trabajo: selected.nombre
      }));
    }
  };

  // Manejador para Producto (ID y Nombre)
  const handleProductoChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const selected = productos.find(p => p.id_producto === selectedId);
    if (selected) {
      setFormData(prev => ({
        ...prev,
        id_producto: selected.id_producto,
        producto: selected.producto // Ajusta si el campo en la interfaz Producto es 'producto' o 'nombre'
      }));
    }
  };
  // ... dentro de FormularioLote

  const handleMaquinaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    // Buscamos la máquina en el catálogo comparando como strings
    const maquinaSeleccionada = maquinas.find(
      (m) => m.id_maquina.toString() === selectedId.toString()
    );

    // Verificamos si ya existe en el estado actual para evitar duplicados
    const yaExiste = formData.maquinas.some(
      (m) => m.id_maquina.toString() === selectedId.toString()
    );

    if (maquinaSeleccionada && !yaExiste) {
      setFormData((prev) => ({
        ...prev,
        maquinas: [...prev.maquinas, maquinaSeleccionada]
      }));
    }

    // IMPORTANTE: Resetear el valor visual del select
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



  const handleToggleChange = (field: keyof Lote) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertLote(formData),
      'Editar': () => ApiService.updateLote(formData),
      'Eliminar': () => ApiService.deleteLote(formData.id_lote)
    };
    try {

      const executeAction = actionMap[action];

      if (!executeAction) {
        throw new Error(`Acción no permitida: ${action}`);
      }

      const response = await executeAction();

      if (response.success) {
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
                    onChange={handleInputChange}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-950 transition-colors"
                    placeholder="Lo generara el sistema..."

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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    placeholder="Ej. Producción Mañana"
                    required
                  />
                </div>
              </div>

              {/* Select Producto */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Producto</label>
                <div className="relative">
                  <Layers className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.id_producto}
                    onChange={handleProductoChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none"
                    required
                  >
                    <option value="" disabled>Seleccione producto...</option>
                    {productos.map((p) => (
                      <option key={p.id_producto} value={p.id_producto}>{p.producto}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Select Forma de Trabajo */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Forma de Trabajo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    value={formData.id_forma_trabajo}
                    onChange={handleFormaTrabajoChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none"
                    required
                  >
                    <option value="" disabled>Seleccione forma...</option>
                    {formasTrabajo?.map((f) => (
                      <option key={f.id_forma_trabajo} value={f.id_forma_trabajo}>{f.nombre}</option>
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white appearance-none"
                    defaultValue=""
                  >
                    <option value="" disabled>Añadir máquina...</option>
                    {maquinas?.map((m) => (
                      <option key={m.id_maquina} value={m.id_maquina} disabled={formData.maquinas.some(sel => sel.id_maquina === m.id_maquina)}>
                        {m.maquina}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-wrap gap-2 p-3 border border-dashed border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50/50 dark:bg-slate-800/30 min-h-[50px]">
                  {formData.maquinas.map((maq) => (
                    <span key={maq.id_maquina} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {maq.maquina}
                      <button type="button" onClick={() => removeMaquina(maq.id_maquina)} className="hover:text-red-500"><X className="w-3.5 h-3.5" /></button>
                    </span>
                  ))}
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Detalles sobre el lote..."
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center justify-between p-4 border rounded-xl dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-indigo-500" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Estatus del Lote</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleToggleChange('estatus')}
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${formData.estatus ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
                  >
                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${formData.estatus ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              </div>
            </div>
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-bounce">
                <Save className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Registro guardado con éxito!</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 bg-white dark:bg-slate-900">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">Cancelar</button>
              <button type="submit" disabled={isLoading} className="flex justify-center items-center gap-2 px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                {isLoading ? 'Procesando...' : <><Save className="w-4 h-4" /> Guardar Lote</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}