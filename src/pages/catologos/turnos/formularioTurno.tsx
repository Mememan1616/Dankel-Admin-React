import React, { useState, useEffect } from 'react';
import type { Turno } from '../../../interfaces/turnos'; // Ajusta la ruta a tu interfaz
import type { ApiResponse } from '../../../interfaces/response';
import {
  Sun,
  Moon,
  Save,
  Hash,
  Activity,
  CalendarClock,
  Clock,
  X
} from 'lucide-react';
import { ApiService } from '../../../services/ApiService';

// Interfaz para las props del Modal
interface FormularioTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  turno?: Turno;
  refreshData: () => void;
}

export default function FormularioTurno({ isOpen, onClose, title, turno, action , refreshData}: FormularioTurnoProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData: Turno = {
    id_turno: '',
    turno: '',
    hora_inicio: '',
    hora_termino: '',
    estatus: true,
  };

  const [formData, setFormData] = useState<Turno>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (turno) {

        setFormData(turno);
      } else {
        setFormData(defaultFormData);
      }
      setShowSuccess(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, turno]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (field: keyof Turno) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertTurno(formData),
      'Editar': () => ApiService.updateTurno(formData),
      'Eliminar': () => ApiService.deleteTurno(formData.id_turno), // Asumiendo que existe
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
          className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 transition-colors duration-300 max-h-[95vh] overflow-y-auto flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabecera del Formulario */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white shadow-sm">
                <CalendarClock className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configure los horarios del turno.</p>
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

              {/* ID */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID del Turno</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="id_turno"
                    disabled
                    value={formData.id_turno}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Lo generara el sistema..."

                  />
                </div>
              </div>

              {/* Nombre del Turno */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Turno</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarClock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  <input
                    type="text"
                    name="turno"
                    value={formData.turno}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    placeholder="Ej. Matutino, Vespertino..."
                    required
                  />
                </div>
              </div>

              {/* Hora Inicio */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora de Inicio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  {/* Se usa type="time" para facilitar la captura de horas */}
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Hora Término */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora de Término</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                  </div>
                  {/* Se usa type="time" para facilitar la captura de horas */}
                  <input
                    type="time"
                    name="hora_termino"
                    value={formData.hora_termino}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                    required
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
                  ¡Turno guardado correctamente!
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