import React, { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, LogIn, Mail, KeyRound } from 'lucide-react';
import { ApiService } from '../services/ApiService';
import type { Usuario } from '../interfaces/usuarios';

// ... (Tus interfaces AuthContextType, AuthProviderProps y componentes AuthProvider, useAuth se quedan EXACTAMENTE IGUAL) ...

// 1. DEFINIMOS LA INTERFAZ PARA EL CONTEXTO
interface AuthContextType {
  user: Usuario | null;
  login: (userData: Usuario) => void;
  logout: () => void;
}

// 2. CREAMOS EL CONTEXTO CON SU TIPO (iniciando en null)
export const AuthContext = createContext<AuthContextType | null>(null);

// 3. TIPAMOS LAS PROPS DEL PROVEEDOR
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<Usuario | null>(() => {
    try {
      const userGuardado = localStorage.getItem('user');
      return userGuardado ? JSON.parse(userGuardado) : null;
    } catch (error) {
      console.error("Error leyendo usuario de localStorage", error);
      return null;
    }
  });

  const login = (userData: Usuario) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// ------------------------------------------------------------------
// 5. PANTALLA DE LOGIN EN TYPESCRIPT (ACTUALIZADA)
// ------------------------------------------------------------------
export default function LoginScreen() {
  const { login } = useAuth(); 
  const navigate = useNavigate(); 
  
  // Estado para controlar qué tipo de login se está mostrando
  const [loginMethod, setLoginMethod] = useState<'operador' | 'admin'>('operador');
  
  const [inputValue, setInputValue] = useState<string>(''); // Sirve para clave o correo
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      let usuarioData: Usuario;

      // Dependiendo de la pestaña activa, llamamos a un endpoint u otro
      if (loginMethod === 'operador') {
        usuarioData = await ApiService.login(inputValue);
      } else {
        usuarioData = await ApiService.loginByEmail(inputValue);
      }
      
      if (usuarioData) {
        login(usuarioData); 
        navigate('/'); 
      } else {
        setError('Credenciales incorrectas');
      }

    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      setIsLoading(false); 
    }
  };

  // Función para cambiar de pestaña y limpiar el input/errores
  const switchMethod = (method: 'operador' | 'admin') => {
    setLoginMethod(method);
    setInputValue('');
    setError('');
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        
        {/* TABS DE SELECCIÓN */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => switchMethod('operador')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2
              ${loginMethod === 'operador' 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <KeyRound className="w-4 h-4" /> Operador
          </button>
          <button
            onClick={() => switchMethod('admin')}
            className={`flex-1 py-4 text-sm font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2
              ${loginMethod === 'admin' 
                ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}`}
          >
            <Mail className="w-4 h-4" /> Administrativo
          </button>
        </div>

        <div className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-blue-600 p-4 rounded-full text-white mb-4 shadow-lg">
              <Lock className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 text-center">
              {loginMethod === 'operador' ? 'Acceso a Producción' : 'Acceso Administrativo'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-2 text-center text-sm">
              {loginMethod === 'operador' 
                ? 'Ingresa tu clave numérica para operar la máquina' 
                : 'Ingresa tu correo corporativo para gestionar el sistema'}
            </p>
          </div>

          {error && (
            <div className="bg-rose-100 text-rose-700 p-4 rounded-xl mb-6 flex items-center text-sm font-semibold">
              <AlertTriangle className="w-5 h-5 mr-2 shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                {loginMethod === 'operador' ? 'Clave de Trabajador' : 'Correo Electrónico'}
              </label>
              <input 
                type={loginMethod === 'operador' ? 'text' : 'email'} 
                required
                className="w-full px-4 py-4 text-lg bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 outline-none transition-colors dark:text-white"
                placeholder={loginMethod === 'operador' ? 'EJ: 123456789' : 'ejemplo@dankel.com.mx'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            <button 
              type="submit" 
              disabled={isLoading}
              className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center text-lg transition-all shadow-md active:scale-95 
                ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'}`}
            >
              {isLoading ? 'Verificando...' : (
                <>
                  <LogIn className="w-6 h-6 mr-2" />
                  {loginMethod === 'operador' ? 'Ingresar a Máquina' : 'Entrar al Dashboard'}
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}