import React, { useState, useEffect } from 'react';
import type { ApiResponse } from '../../../interfaces/response';
//import type { Paro } from '../../../interfaces/paros';
import {
  Sun,
  Moon,
  Save,
  AlignLeft,
  List,
  Settings,
  Factory,
  Activity,
  Hash,
  X // <-- Importamos el ícono de la X para cerrar
} from 'lucide-react';
import type { Maquina } from '../../../interfaces/maquinas';
import type { LineaProduccion } from '../../../interfaces/lineas_produccion';
import { ApiService } from '../../../services/ApiService';

// Interfaz para las props del Modal
interface FormularioParoProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  maquina?: Maquina;
  refreshData: () => void;
}

export default function FormularioMaquina({ isOpen, onClose, title, maquina, action, refreshData }: FormularioParoProps) {
  // Estado para el modo oscuro
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lineasDisponibles, setLineasDisponibles] = useState<LineaProduccion[]>([]);


  // Estado del formulario
  const [formData, setFormData] = useState<Maquina>({
    id_maquina: '',
    id_linea: '',
    descripcion: '',
    estatus: true,
    linea: '',
    maquina: '',
    produccionxHora: 0
  });
  const defaultFormData: Maquina = {
    id_maquina: '',
    id_linea: '',
    descripcion: '',
    estatus: true,
    linea: '',
    maquina: '',
    produccionxHora: 0

  };
  const handleLineaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    const lineaSeleccionada = lineasDisponibles.find((l) => l.id_linea_trabajo === selectedId);

    setFormData((prev) => ({
      ...prev,
      id_linea: selectedId,
      linea: lineaSeleccionada ? lineaSeleccionada.linea : '',
    }));
  };
  const getLineas = async () => {
    try {
      const lineasData: LineaProduccion[] = await ApiService.getAllineasProduccion();
      setLineasDisponibles(lineasData);
    } catch (error) {
      console.error('Error al obtener las lineas:', error);
    }
  };
  useEffect(() => {
    getLineas();
  }, []);

  // Estado para mostrar mensaje de éxito al guardar
  useEffect(() => {
    if (isOpen) {
      if (maquina) {
        // Si recibimos un paro, es modo "Edición"
        setFormData(maquina);
      } else {
        // Si no hay paro, es modo "Creación", limpiamos el formulario
        setFormData(defaultFormData);
      }

      setShowSuccess(false); // Reiniciamos el estado de éxito al abrir
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, maquina]);

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
  const handleToggleChange = (field: keyof Maquina) => {
    setFormData((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Manejador del envío del formulario
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertMaquina(formData),
      'Editar': () => ApiService.updateMaquina(formData),
      'Eliminar': () => ApiService.deleteMaquina(formData.id_maquina), // Asumiendo que existe
    };
    try {

      const executeAction = actionMap[action];

      if (!executeAction) {
        throw new Error(`Acción no permitida: ${action}`);
      }

      const response = await executeAction();
      if (response.success) {
        console.log(response.result);
        setShowSuccess(true);
      }
      setTimeout(() => {
        setShowSuccess(false);
        refreshData();
        onClose();
      }, 2000);
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
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300"
        onClick={onClose}
      >
        <div
          className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 transition-colors duration-300 max-h-[95vh] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera del Formulario */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white shadow-sm">
                <Settings className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Complete los detalles de la máquina.</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsDarkMode(!isDarkMode)}
                className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Cuerpo del Formulario */}
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID de la Máquina</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="id"
                    value={formData.id_maquina}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Lo generara el sistema..."
                    disabled
                  />
                </div>
              </div>

              {/* Nombre de la Máquina */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de la Máquina</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Factory className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="maquina"
                    value={formData.maquina}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Ej. Inyectora Plástico 01"
                    required
                  />
                </div>
              </div>

              {/* Select de Línea de Producción */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Línea de Producción</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <List className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <select
                    name="id_linea"
                    value={formData.id_linea}
                    onChange={handleLineaSelect}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors appearance-none"
                  >
                    <option value="" disabled>Seleccione una línea</option>
                    {lineasDisponibles.map((linea) => (
                      <option key={linea.id_linea_trabajo} value={linea.id_linea_trabajo}>
                        {linea.linea}
                      </option>
                    ))}
                  </select>
                  {/* Flecha personalizada para el select */}
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                      <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Produccion por Hora</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Factory className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="number"
                    name="produccionxHora"
                    value={formData.produccionxHora}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Ej. 1000"
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
                    placeholder="Características, modelo y detalles de la máquina..."
                  />
                </div>
              </div>

              {/* Toggle de Estatus (AQUÍ DEBES ASEGURARTE DE QUE EL COMPONENTE CustomToggle EXISTA) */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <CustomToggle
                  enabled={formData.estatus}
                  onChange={() => handleToggleChange('estatus')}
                  label={formData.estatus ? "Estatus: Activo (En Operación)" : "Estatus: Inactivo (Fuera de Servicio)"}
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
                  ¡Máquina guardada correctamente!
                </p>
              </div>
            )}

            {/* Botones de acción */}
            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
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
                className={`flex justify-center items-center gap-2 px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 ${isLoading
                    ? 'bg-indigo-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
              >
                <Save className="w-4 h-4" />
                {isLoading ? 'Guardando...' : 'Guardar Máquina'}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};