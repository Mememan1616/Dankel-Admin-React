import React, { useState, useEffect } from 'react';
import type { Usuario } from '../../../interfaces/usuarios';
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import {
  Sun,
  Moon,
  Save,
  Hash,
  User,
  Mail,
  Shield,
  Activity,
  X,
  BadgeCheck
} from 'lucide-react';

interface FormularioUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  usuario?: Usuario;
}

export default function FormularioUsuario({ isOpen, onClose, title, usuario, action }: FormularioUsuarioProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData: Usuario = {
    id_user: '',
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    email: '',
    rol: 'Operador', // Valor por defecto
    estatus: true,
    clave_trabajador: '',
  };

  const [formData, setFormData] = useState<Usuario>(defaultFormData);

  useEffect(() => {
    console.log("action:" + action);
    if (isOpen) {
      if (usuario) {
        setFormData(usuario);
      } else {
        setFormData(defaultFormData);
      }
      setShowSuccess(false);
    }
  }, [isOpen, usuario]);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleToggleChange = (field: keyof Usuario) => {
    setFormData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'boolean' ? !prev[field] : prev[field],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertUser(formData),
      'Editar': () => ApiService.updateUser(formData),
      'Eliminar': () => ApiService.deleteUser(formData.id_user), // Asumiendo que existe
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
                <User className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Información de cuenta y perfil del usuario.</p>
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

              {/* ID de Usuario */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Usuario (Lectura)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Hash className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="id_user"
                    value={formData.id_user}
                    readOnly
                    disabled
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-200 dark:border-slate-700 rounded-xl bg-gray-100 dark:bg-slate-800/80 text-gray-500 dark:text-gray-400 sm:text-sm cursor-not-allowed"
                    placeholder="Lo generara el sistema..."
                  />
                </div>
              </div>

              {/* Clave de Trabajador */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Clave de Trabajador</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <BadgeCheck className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="clave_trabajador"
                    value={formData.clave_trabajador}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm transition-colors"
                    placeholder="Ej. TR-4500"
                  />
                </div>
              </div>

              {/* Nombre */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre(s)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                    placeholder="Nombre"
                  />
                </div>
              </div>

              {/* Apellidos */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apellido Paterno</label>
                <input
                  type="text"
                  name="apellidoP"
                  value={formData.apellidoP}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Paterno"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apellido Materno</label>
                <input
                  type="text"
                  name="apellidoM"
                  value={formData.apellidoM}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Materno"
                />
              </div>

              {/* Email */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Correo Electrónico</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm"
                    placeholder="usuario@empresa.com"
                  />
                </div>
              </div>

              {/* Rol Selector */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Rol de Usuario</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Shield className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 sm:text-sm appearance-none transition-colors"
                  >
                    <option value="Operador">Operador</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Supervisor">Supervisor</option>
                  </select>
                </div>
              </div>

              {/* Estatus */}
              <div className="col-span-2">
                <CustomToggle
                  label="Usuario Activo"
                  enabled={formData.estatus}
                  onChange={() => handleToggleChange('estatus')}
                  icon={Activity}
                />
              </div>

            </div>

            {/* Éxito y Botones */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 rounded-xl flex items-center gap-3">
                <Save className="w-5 h-5 text-green-600" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Usuario actualizado con éxito!</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
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