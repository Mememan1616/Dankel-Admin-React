import React, { useState, useEffect } from 'react';
import type { LineaProduccion } from '../../../interfaces/lineas_produccion'; // Ajusta la ruta a tu interfaz
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import {
  Sun,
  Moon,
  Save,
  Hash,
  AlignLeft,
  Activity,
  Factory, // Ícono para la Línea de Producción
  X
} from 'lucide-react';

// Interfaz para las props del Modal
interface FormularioLineaProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  linea?: LineaProduccion;
  refreshData: () => void;
}

export default function FormularioLinea({ isOpen, onClose, title, linea, action, refreshData }: FormularioLineaProps) {
  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData: LineaProduccion = {
    id_linea_trabajo: '',
    linea: '',
    descripcion: '',
    estatus: true,
  };

  // Estado del formulario
  const [formData, setFormData] = useState<LineaProduccion>(defaultFormData);

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      if (linea) {
        // Si recibimos una línea, es modo "Edición"
        setFormData(linea);
      } else {
        // Si no hay línea, es modo "Creación", limpiamos el formulario
        setFormData(defaultFormData);
      }
      setShowSuccess(false); // Reiniciamos el estado de éxito al abrir
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, linea]);

  // Si no está abierto, no renderizamos nada
  if (!isOpen) return null;

  // Manejador genérico para inputs de texto
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Manejador para los toggles (booleanos)
  const handleToggleChange = (field: keyof LineaProduccion) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : prev[field],
    }));
  };

  // Manejador del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
               'Crear': () => ApiService.insertLineaProduccion(formData),
               'Editar': () => ApiService.updateLineaProduccion(formData),
               'Eliminar': () => ApiService.deleteLineaProduccion(formData.id_linea_trabajo)
             };
             try {
         
               const executeAction = actionMap[action];
         
               if (!executeAction) {
                 throw new Error(`Acción no permitida: ${action}`);
               }
         
               const response = await executeAction();
        if (response.success) {
          setShowSuccess(true);
          setTimeout(() => {
            setShowSuccess(false);
            refreshData();
            onClose();
          }, 2000);
        }
      } catch (error) {
        console.error('Error en la petición:', error);
      } finally {
        setIsLoading(false);
      }
    };
  // Componente de Toggle reutilizable
  const CustomToggle = ({
    enabled,
    onChange,
    label,
    icon: Icon
  }: {
    enabled: boolean;
    onChange: () => void;
    label: string;
    icon: any
  }) => (
    <div className="flex items-center justify-between p-4 border rounded-xl dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
          <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <button
        type="button"
        onClick={onChange}
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'
          }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
        />
      </button>
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} font-sans`}>
      {/* Overlay oscuro de fondo */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300"
        onClick={onClose} // Cerrar al hacer clic afuera
      >

        {/* Contenedor del Modal */}
        <div
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 transition-colors duration-300 max-h-[95vh] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()} // Evitar que el clic adentro cierre el modal
        >

          {/* Cabecera del Formulario */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white shadow-sm">
                <Factory className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complete los detalles de la línea de producción.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
                aria-label="Alternar modo oscuro"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* Botón para cerrar el modal (X) */}
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                aria-label="Cerrar modal"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ID */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID de la Línea</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="id"
                    value={formData.id_linea_trabajo}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Lo generara el sistema..."
                    disabled
                  />
                </div>
              </div>

              {/* Nombre de la Línea */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de la Línea</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Factory className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="linea"
                    value={formData.linea}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Ej. Línea de Ensamblaje A"
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <div className="relative">
                  <div className="absolute top-3 left-3 pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors resize-none"
                    placeholder="Detalles sobre las operaciones de esta línea..."
                  />
                </div>
              </div>

              {/* Toggle Estatus */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <CustomToggle
                  enabled={formData.estatus}
                  onChange={() => handleToggleChange('estatus')}
                  label={formData.estatus ? "Estatus: Activo" : "Estatus: Inactivo"}
                  icon={Activity}
                />
              </div>

            </div>

            {/* Mensaje de éxito */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
                <div className="bg-green-100 dark:bg-green-800/50 p-1.5 rounded-full">
                  <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-sm font-medium text-green-800 dark:text-green-300">
                  ¡Datos de la línea guardados correctamente!
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Guardando...' : 'Guardar Usuario'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}