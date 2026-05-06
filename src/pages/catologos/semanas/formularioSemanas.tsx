import React, { useState, useEffect } from 'react';
import type { Semana } from '../../../interfaces/semanas'; // Ajusta la ruta a tu interfaz
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import {
  Sun,
  Moon,
  Save,
  Hash,
  AlignLeft,
  Activity,
  Calendar,
  X,
  CalendarDays
} from 'lucide-react';

interface FormularioSemanaProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  semana?: Semana;
  refreshData: () => void;
}

export default function FormularioSemana({ isOpen, onClose, title, semana, action, refreshData }: FormularioSemanaProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData: Semana = {
    id_semana: '',
    descripcion: '',
    fecha_inicio: '',
    fecha_termino: '',
    estatus: true,
    
  };

  const [formData, setFormData] = useState<Semana>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (semana) {
        setFormData(semana);
      } else {
        setFormData(defaultFormData);
      }
      setShowSuccess(false);
    }
  }, [isOpen, semana]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (field: keyof Semana) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertSemana(formData),
      'Editar': () => ApiService.updateSemana(formData),
     // 'Eliminar': () => ApiService.deleteSemana(formData.id_semana), 
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
        className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
      >
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className={`${isDarkMode ? 'dark' : ''} font-sans`}>
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 max-h-[95vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
          
          {/* Cabecera */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-indigo-500 p-2 rounded-lg text-white shadow-sm">
                <Calendar className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Configuración del periodo semanal.</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors">
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ID de la Semana (NO EDITABLE) */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Semana (Automático)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="id_semana"
                    value={formData.id_semana}
                    readOnly
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
                    placeholder="Generado por el sistema..."
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción de la Semana</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <AlignLeft className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                    placeholder="Ej. Semana 01 - Enero 2024"
                    required
                  />
                </div>
              </div>

              {/* Fecha Inicio */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de Inicio</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="fecha_inicio"
                    value={formData.fecha_inicio}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Fecha Término */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fecha de Término</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CalendarDays className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    name="fecha_termino"
                    value={formData.fecha_termino}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                    required
                  />
                </div>
              </div>

              {/* Estatus */}
              <div className="col-span-2">
                <CustomToggle
                  label="Semana Vigente / Activa"
                  enabled={formData.estatus}
                  onChange={() => handleToggleChange('estatus')}
                  icon={Activity}
                />
              </div>

            </div>

            {/* Éxito y Botones */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in">
                <Save className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Acción realizada con éxito!</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all ${
                  isLoading ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/20'
                }`}
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {action === 'Eliminar' ? 'Eliminar Semana' : `Guardar ${action}`}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}