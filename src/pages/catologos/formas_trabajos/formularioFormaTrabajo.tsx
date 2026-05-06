import React, { useState, useEffect } from 'react';
import type { FormaTrabajo } from '../../../interfaces/forma_trabajo';
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import {
  Sun,
  Moon,
  Save,
  Hash,
  AlignLeft,
  Briefcase,
  X
} from 'lucide-react';

interface FormularioFormaTrabajoProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  forma?: FormaTrabajo;
  refreshData: () => void;
  existingFormas: FormaTrabajo[];
}

export default function FormularioFormaTrabajo({ isOpen, onClose, title, forma, action, refreshData, existingFormas }: FormularioFormaTrabajoProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData: FormaTrabajo = {
    id_forma_trabajo: '',
    nombre: '',
    descripcion: '',
    estatus: true, 
  };

  const [formData, setFormData] = useState<FormaTrabajo>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (forma) {
        setFormData(forma);
      } else {
        setFormData(defaultFormData);
      }
      setShowSuccess(false);
    }
  }, [isOpen, forma]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validación de Nombre de Forma de Trabajo Duplicada
    const nombreIngresado = formData.nombre.trim().toLowerCase();
    const formaExistente = existingFormas.find(f => f.nombre.trim().toLowerCase() === nombreIngresado);

    if (action === 'Crear' && formaExistente) {
        alert('Ya existe una forma de trabajo con este nombre. Por favor, ingresa un nombre distinto.');
        return;
    }

    if (action === 'Editar' && formaExistente && formaExistente.id_forma_trabajo !== formData.id_forma_trabajo) {
        alert('Ya existe otra forma de trabajo con este nombre. Por favor, ingresa un nombre distinto.');
        return;
    }

    setIsLoading(true);
    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertFormaTrabajo(formData),
      'Editar': () => ApiService.updateFormaTrabajo(formData),
      'Eliminar': () => ApiService.deleteFormaTrabajo(formData.id_forma_trabajo)
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
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 flex flex-col max-h-[95vh]" onClick={(e) => e.stopPropagation()}>

          {/* Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <div className="bg-amber-500 p-2 rounded-lg text-white shadow-sm"><Briefcase className="w-6 h-6" /></div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Detalles de la metodología o forma de trabajo.</p>
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
            <div className="grid grid-cols-1 gap-6">

              {/* ID Forma */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID</label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="id_forma_trabajo"
                    value={formData.id_forma_trabajo}
                    onChange={handleInputChange}
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-950 transition-colors"
                    placeholder="Lo generará el sistema..."
                  />
                </div>
              </div>

              {/* Nombre Forma */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre de la Forma de Trabajo</label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white"
                    placeholder="Ej. Producción Continua"
                    required
                  />
                </div>
              </div>

              {/* Descripción */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción</label>
                <div className="relative">
                  <AlignLeft className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="descripcion"
                    value={formData.descripcion}
                    onChange={handleInputChange}
                    rows={3}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white resize-none"
                    placeholder="Detalles y metodología aplicable..."
                  />
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
              <button type="submit" disabled={isLoading} className="flex justify-center items-center gap-2 px-6 py-2.5 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition-colors">
                {isLoading ? 'Procesando...' : <><Save className="w-4 h-4" /> Guardar</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}