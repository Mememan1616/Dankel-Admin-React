import React, { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Lock, LogIn } from 'lucide-react';
import { ApiService } from '../services/ApiService';
//import type { ApiResponse } from '../interfaces/response';
import type { Usuario } from '../interfaces/usuarios';

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
  // Tipamos el estado inicial para que sepa que es de tipo User o null
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

// 4. (OPCIONAL PERO RECOMENDADO) CUSTOM HOOK PARA EL CONTEXTO
// Esto evita que tengas que revisar si el contexto es null en cada pantalla
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};

// 5. PANTALLA DE LOGIN EN TYPESCRIPT
export default function LoginScreen() {
  // Usamos nuestro nuevo custom hook tipado
  const { login } = useAuth(); 
  const navigate = useNavigate(); 
  
  // Tipamos los estados explícitamente
  const [username, setUsername] = useState<string>('');
  // const [password, setPassword] = useState<string>(''); // Lo dejé comentado por si lo usas después
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  // Tipamos el evento del formulario (FormEvent)
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Hacemos la llamada esperando el LoginResponse
      const Usuario:Usuario = await ApiService.login(username);
      
      // Asumiendo que tu LoginResponse trae el usuario dentro de 'user'
      if (Usuario) {
        login(Usuario); // Guardamos el usuario en el Contexto y LocalStorage
        navigate('/'); // Redirigimos al Layout principal
      }else{
        setError('Credenciales incorrectas');
      }

    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      // Extraemos el mensaje de error que arroja nuestro ApiService
      setError(err.message || 'Error de conexión con el servidor');
    } finally {
      // Pase lo que pase (éxito o error), quitamos el estado de carga
      setIsLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 dark:bg-slate-900 transition-colors duration-300">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-4 rounded-full text-white mb-4 shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100">Iniciar Sesión</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2 text-center">Ingresa tus credenciales para acceder al sistema</p>
        </div>

        {error && (
          <div className="bg-rose-100 text-rose-700 p-4 rounded-xl mb-6 flex items-center text-sm font-semibold">
            <AlertTriangle className="w-5 h-5 mr-2" />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
              Clave de Trabajador
            </label>
            <input 
              type="text" 
              required
              className="w-full px-4 py-4 text-lg bg-slate-50 dark:bg-slate-700 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0 outline-none transition-colors dark:text-white"
              placeholder="EJ: 123456789"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button 
            type="submit" 
            disabled={isLoading}
            className={`w-full text-white font-bold py-4 rounded-xl flex items-center justify-center text-lg transition-colors shadow-md active:scale-95 
              ${isLoading ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {isLoading ? 'Verificando...' : (
              <>
                <LogIn className="w-6 h-6 mr-2" />
                Ingresar
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}