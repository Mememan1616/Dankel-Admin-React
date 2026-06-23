import React, { useState, useEffect } from 'react';
import type { Turno } from '../../../interfaces/turnos';
import type { ApiResponse } from '../../../interfaces/response';
import { Save, Activity, CalendarClock, Clock, X } from 'lucide-react';
import { ApiService } from '../../../services/ApiService';

interface FormularioTurnoProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  turno?: Turno;
  refreshData: () => void;
  existingTurnos: Turno[]; // Para validación de duplicados
}

export default function FormularioTurno({ isOpen, onClose, title, turno, action, refreshData, existingTurnos }: FormularioTurnoProps) {
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
      [field]: !prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    // Validación: No duplicar nombre del turno
    const nombreIngresado = formData.turno.trim().toLowerCase();
    const turnoExiste = existingTurnos.find(t => t.turno.trim().toLowerCase() === nombreIngresado);

    if (action === 'Crear' && turnoExiste) {
        alert('Este nombre de turno ya existe.');
        return;
    }
    if (action === 'Editar' && turnoExiste && turnoExiste.id_turno !== formData.id_turno) {
        alert('Este nombre ya está siendo usado por otro turno.');
        return;
    }

    setIsLoading(true);
    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertTurno(formData),
      'Editar': () => ApiService.updateTurno(formData),
      'Eliminar': () => ApiService.deleteTurno(formData.id_turno), 
    };

    try {
      const executeAction = actionMap[action];
      if (!executeAction) throw new Error(`Acción no permitida`);

      const response = await executeAction();
      if (response.success) {
        setShowSuccess(true);
        setTimeout(() => {
          setShowSuccess(false);
          refreshData();
          onClose();
        }, 1500);
      }
    } catch (error) {
      console.error('Error en la petición:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const CustomToggle = ({ enabled, onChange, label, icon: Icon }: any) => (
    <div className="flex items-center justify-between p-4 border rounded-xl dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
          <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <button type="button" onClick={onChange} className={`relative inline-flex h-7 w-12 rounded-full transition-colors ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="font-sans">
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300" onClick={onClose}>
        <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 max-h-[95vh] overflow-y-auto flex flex-col" onClick={(e) => e.stopPropagation()}>
          
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
            <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* ID Oculto */}

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Turno</label>
                <div className="relative">
                  <CalendarClock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="turno"
                    value={formData.turno}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    placeholder="Ej. Matutino, Vespertino..."
                    required
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora de Inicio</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    name="hora_inicio"
                    value={formData.hora_inicio}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Hora de Término</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="time"
                    name="hora_termino"
                    value={formData.hora_termino}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>
              </div>

              <div className="col-span-1 md:col-span-2 mt-2">
                <CustomToggle
                  enabled={formData.estatus}
                  onChange={() => handleToggleChange('estatus')}
                  label={formData.estatus ? "Estatus: Activo" : "Estatus: Inactivo"}
                  icon={Activity}
                />
              </div>

            </div>

            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl flex items-center gap-3">
                <Save className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800">¡Turno guardado correctamente!</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700">
                Cancelar
              </button>
              <button type="submit" disabled={isLoading} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600'}`}>
                <Save className="w-4 h-4" /> Guardar Turno
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}