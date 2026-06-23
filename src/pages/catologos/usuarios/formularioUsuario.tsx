import React, { useState, useEffect } from 'react';
import type { Usuario } from '../../../interfaces/usuarios';
import { ApiService } from '../../../services/ApiService';
import type { ApiResponse } from '../../../interfaces/response';
import {
  Save,
  User,
  Mail,
  Shield,
  Activity,
  X,
  BadgeCheck,
  Lock // 👇 Importamos el ícono del candado
} from 'lucide-react';

interface FormularioUsuarioProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  action: string;
  usuario?: Usuario;
  refreshData: () => void; 
}

export default function FormularioUsuario({ isOpen, onClose, title, usuario, action, refreshData }: FormularioUsuarioProps) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const defaultFormData: Usuario = {
    id_user: '',
    nombre: '',
    apellidoP: '',
    apellidoM: '',
    email: '',
    rol: '', 
    estatus: true,
    clave_trabajador: '',
    contrasena: '' // 👇 Agregamos el campo para la contraseña
  };

  const [formData, setFormData] = useState<Usuario>(defaultFormData);

  useEffect(() => {
    if (isOpen) {
      if (usuario) {
        // Al editar, NO mostramos la contraseña actual en el campo por seguridad.
        // La inicializamos vacía para que solo se actualice si el administrador escribe algo nuevo.
        setFormData({ ...usuario, contrasena: '' });
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
    if (isLoading) return;

    if (!formData.rol) {
        alert("Por favor, seleccione un rol de usuario.");
        return;
    }

    setIsLoading(true);

    // 👇 Lógica de protección de contraseña:
    // Si estamos editando y dejaron la contraseña en blanco, la borramos del objeto 
    // para que Firebase/Apps Script no la sobrescriba con un string vacío.
    const dataToSend = { ...formData };
    if (action === 'Editar' && !dataToSend.contrasena) {
        delete dataToSend.contrasena;
    }

    const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
      'Crear': () => ApiService.insertUser(dataToSend),
      'Editar': () => ApiService.updateUser(dataToSend),
      'Eliminar': () => ApiService.deleteUser(dataToSend.id_user), 
    };

    try {
      const executeAction = actionMap[action];
      if (!executeAction) throw new Error(`Acción no permitida`);

      const response = await executeAction();
      if (response.success) {
        setShowSuccess(true);
        refreshData(); 
        
        setTimeout(() => {
          setShowSuccess(false);
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
    <div className="flex items-center justify-between p-4 border rounded-xl dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 transition-colors">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
          <Icon className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
      </div>
      <button type="button" onClick={onChange} className={`relative inline-flex h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}>
        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );

  return (
    <div className="font-sans">
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300" onClick={onClose}>
        <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 max-h-[95vh] overflow-y-auto flex flex-col transition-colors duration-300" onClick={(e) => e.stopPropagation()}>

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
            <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Rol Selector */}
              <div className="col-span-1 md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">Rol de Usuario <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Shield className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none transition-colors"
                    required
                  >
                    <option value="" disabled>Seleccione un rol...</option>
                    <option value="Operador">Operador</option>
                    <option value="Administrador">Administrador</option>
                    <option value="Fabricacion">Fabricación</option>
                  </select>
                </div>
              </div>

              {/* Clave de Trabajador */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Clave de Trabajador {formData.rol === 'Operador' && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <BadgeCheck className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="clave_trabajador"
                    value={formData.clave_trabajador || ''}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="Ej. 123456"
                    required={formData.rol === 'Operador'} 
                  />
                </div>
              </div>

              {/* Email */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Correo Electrónico {(formData.rol === 'Administrador' || formData.rol === 'Fabricacion') && <span className="text-red-500">*</span>}
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="usuario@empresa.com"
                    required={formData.rol === 'Administrador' || formData.rol === 'Fabricacion'}
                  />
                </div>
              </div>

              {/* 👇 NUEVO CAMPO: CONTRASEÑA 👇 */}
              {formData.rol && formData.rol !== 'Operador' && (
                <div className="col-span-1 md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5 font-bold">
                    Contraseña de Acceso Web {action === 'Crear' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <input
                      type="text" // Visible para que el admin sepa qué le está asignando
                      name="contrasena"
                      value={formData.contrasena || ''}
                      onChange={handleInputChange}
                      className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                      placeholder={action === 'Editar' ? "Dejar en blanco para conservar la contraseña actual" : "Asigna una contraseña inicial"}
                      required={action === 'Crear'}
                    />
                  </div>
                  {action === 'Editar' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 ml-1">
                      Nota: Si no escribes nada, el usuario conservará la misma contraseña de acceso.
                    </p>
                  )}
                </div>
              )}

              {/* Nombre */}
              <div className="col-span-1 md:col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre(s) <span className="text-red-500">*</span></label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    name="nombre"
                    value={formData.nombre}
                    onChange={handleInputChange}
                    required
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                    placeholder="Nombre completo"
                  />
                </div>
              </div>

              {/* Apellidos */}
              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apellido Paterno <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="apellidoP"
                  value={formData.apellidoP}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Paterno"
                />
              </div>

              <div className="col-span-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Apellido Materno <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="apellidoM"
                  value={formData.apellidoM}
                  onChange={handleInputChange}
                  required
                  className="block w-full px-4 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 transition-colors"
                  placeholder="Materno"
                />
              </div>

              {/* Estatus */}
              <div className="col-span-1 md:col-span-2 mt-2">
                <CustomToggle
                  label={formData.estatus ? "Usuario Activo" : "Usuario Inactivo"}
                  enabled={formData.estatus}
                  onChange={() => handleToggleChange('estatus')}
                  icon={Activity}
                />
              </div>

            </div>

            {/* Éxito */}
            {showSuccess && (
              <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-in fade-in">
                <Save className="w-5 h-5 text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Usuario guardado con éxito!</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900">
              <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-colors ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
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