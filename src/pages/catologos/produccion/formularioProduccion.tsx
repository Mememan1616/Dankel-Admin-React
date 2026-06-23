import React, { useState, useEffect } from 'react';
import type { Produccion } from '../../../interfaces/produccion';
import type { Maquina } from '../../../interfaces/maquinas'; // 👇 IMPORT FALTANTE AGREGADO
import { ApiService } from '../../../services/ApiService';
import { Save, Clock, Factory, X, CheckCircle2, Box } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  action: string;
  produccion: Produccion | null;
  refreshData: () => any; // 👇 CORRECCIÓN: Permite funciones asíncronas
  maquinas: Maquina[];
}

export default function FormularioProduccion({ isOpen, onClose, action, produccion, refreshData, maquinas }: Props) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [formData, setFormData] = useState<Produccion>({
    id_produccion: '',
    id_maquina: '',
    id_turno: '',
    id_semana: '',
    lote: '',
    hora_inicio: '',
    hora_termino: '',
    piezas_producidas: '',
    piezas_buenas: ''
  });

  useEffect(() => {
    if (isOpen && produccion) {
        setFormData(produccion);
        setShowSuccess(false);
    }
  }, [isOpen, produccion]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (action === 'Editar') {
          await ApiService.updateProduccion(formData);
      } else if (action === 'Eliminar') {
          await ApiService.deleteProduccion(formData.id_produccion || (formData as any).id); 
      }
      
      setShowSuccess(true);
      refreshData(); 
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1500);
      
    } catch (error) {
      console.error('Error:', error);
      alert('Error al procesar la solicitud');
    } finally {
      setIsLoading(false);
    }
  };

  const isEliminar = action === 'Eliminar';

  return (
    <div className="font-sans">
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
        <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>

          <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg text-white shadow-sm ${isEliminar ? 'bg-red-500' : 'bg-indigo-500'}`}>
                {isEliminar ? <X className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {isEliminar ? 'Eliminar Registro' : 'Ajustar Producción'}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    {isEliminar ? '¿Estás seguro de querer eliminar este registro?' : 'Modifica los tiempos o piezas de este registro.'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Máquina Asignada</label>
                <div className="relative">
                  <Factory className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    name="id_maquina"
                    value={formData.id_maquina}
                    onChange={handleInputChange}
                    disabled={isEliminar}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white"
                  >
                    {maquinas.map(m => <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>)}
                  </select>
                </div>
              </div>

              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Lote Trabajado</label>
                <div className="relative">
                  <Box className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="lote"
                    value={formData.lote}
                    onChange={handleInputChange}
                    disabled={isEliminar}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">Hora Inicio Real</label>
                <input
                  type="time"
                  name="hora_inicio"
                  step="1"
                  value={formData.hora_inicio}
                  onChange={handleInputChange}
                  disabled={isEliminar}
                  required
                  className="block w-full px-4 py-2.5 border border-indigo-200 dark:border-indigo-800/50 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-bold text-indigo-600 dark:text-indigo-400 mb-1.5">Hora Término Real</label>
                <input
                  type="time"
                  name="hora_termino"
                  step="1"
                  value={formData.hora_termino}
                  onChange={handleInputChange}
                  disabled={isEliminar}
                  required
                  className="block w-full px-4 py-2.5 border border-indigo-200 dark:border-indigo-800/50 rounded-xl bg-indigo-50/30 dark:bg-indigo-900/10 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Piezas Buenas</label>
                <input
                  type="number"
                  name="piezas_buenas"
                  value={formData.piezas_buenas}
                  onChange={handleInputChange}
                  disabled={isEliminar}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Piezas Totales (Incluye merma)</label>
                <input
                  type="number"
                  name="piezas_producidas"
                  value={formData.piezas_producidas}
                  onChange={handleInputChange}
                  disabled={isEliminar}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

            </div>

            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl flex items-center gap-3 animate-in fade-in">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Registro actualizado con éxito!</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white ${
                    isEliminar ? 'bg-red-600 hover:bg-red-700' : 'bg-indigo-600 hover:bg-indigo-700'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isEliminar ? <X className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {isLoading ? 'Procesando...' : (isEliminar ? 'Confirmar Eliminación' : 'Guardar Ajustes')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}