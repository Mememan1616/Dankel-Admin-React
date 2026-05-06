import React, { useState, useEffect } from 'react';
import { 
  Factory, 
  PauseCircle, 
  Clock, 
  Boxes, 
  Calendar, 
  Menu, 
  X, 
  Bell, 
  UserCircle,
  FolderTree,
  Sun,
  Moon,
  Settings,
  Users,
  Grid2x2Check,
  Briefcase
} from 'lucide-react';
import { ApiService } from '../services/ApiService';
import type { TestResponse } from '../interfaces/response';
import { useLocation, Link, Outlet} from 'react-router-dom';
import { useAuth } from '../auth/auth';

// --- Interfaces de TypeScript ---
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  color?: string; 
  route: string;
}

// --- Datos de Navegación ---
const mainNavItems: NavItem[] = [
  { id: 'produccion', label: 'Producción', icon: Factory, color: 'text-cyan-500', route: '/produccion' },
  { id: 'semanas', label: 'Semanas', icon: Calendar, color: 'text-indigo-500', route: '/semanasCrud' },
];

const catalogItems: NavItem[] = [
  { id: 'paros', label: 'Paros', icon: PauseCircle, color: 'text-red-500', route: '/parosCrud' }, 
  { id: 'turnos', label: 'Turnos', icon: Clock, color: 'text-lime-500', route: '/turnosCrud' },
  { id: 'lotes', label: 'Lotes', icon: Boxes, color: 'text-teal-500' , route: '/lotesCrud'},
  { id: 'maquinas', label: 'Maquinas', icon: Settings, color: 'text-lime-500', route: '/maquinasCrud' },
  { id: 'lineas_produccion', label: 'Lineas de Produccion', icon: FolderTree, color: 'text-cyan-500', route: '/lineas_produccion' },
  { id: 'productos', label: 'Productos', icon: Grid2x2Check, color: 'text-lime-500', route: '/productosCrud' },
  { id: 'Usuarios', label: 'Usuarios', icon: Users, color: 'text-lime-500', route: '/usuariosCrud' },
  { id: 'formas_trabajo', label: 'Formas de Trabajo', icon: Briefcase, color: 'text-amber-500', route: '/formaTrabajoCrud' },
];

export default function Sidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const location = useLocation();
  const {user} = useAuth();
  
  useEffect(() => {
   const testAppscript: Promise<TestResponse> = ApiService.testAppscript();
    console.log(testAppscript);
    console.log(user);
    probarConexion();
    testAppscript.then(response => {
      if (response.mensaje === '¡Conexión exitosa desde local!') {
        setIsDarkMode(true);
      } else {
        setIsDarkMode(false);
      }
    });
    
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

const probarConexion = async () => {
    try {
        const data: TestResponse = await ApiService.testAppscript();
        console.log("Mensaje:", data.mensaje);
        console.log("Servidor:", data.servidor);
        console.log("Timestamp:", data.timestamp);
    } catch (error) {
        console.error("Falló la prueba:", error);
    }
}

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const NavLink = ({ item }: { item: NavItem }) => {
    const isActive = location.pathname === item.route;
    const Icon = item.icon;

    return (
      <Link
        to={item.route}
        onClick={() => setIsSidebarOpen(false)} 
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
          isActive 
            ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-l-4 border-blue-500 shadow-sm' 
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-700 dark:hover:text-blue-400 border-l-4 border-transparent'
        }`}
      >
        <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500' : item.color || 'text-slate-400'}`} />
        <span className="font-medium text-sm">{item.label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 font-sans overflow-hidden transition-colors duration-300">
      
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity"
          onClick={toggleSidebar}
        />
      )}

      <aside 
        className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-gradient-to-br from-cyan-400 to-lime-400 rounded-lg shadow-sm">
              <Factory className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-600 to-lime-500 dark:from-cyan-400 dark:to-lime-400">
              Dankel
            </span>
          </div>
          <button onClick={toggleSidebar} className="lg:hidden text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-6 px-3 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
          <div>
            <p className="px-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-3">
              Principal
            </p>
            <div className="space-y-1">
              {mainNavItems.map(item => (
                <NavLink key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 px-4 mb-3">
              <FolderTree className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                Catálogos
              </p>
            </div>
            <div className="space-y-1">
              {catalogItems.map(item => (
                <NavLink key={item.id} item={item} />
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-cyan-50 dark:bg-slate-800 flex items-center justify-center">
              <span className="text-sm font-bold text-cyan-600 dark:text-cyan-400">v1</span>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">
              <p className="font-medium text-slate-700 dark:text-slate-300">Sistema de Gestión</p>
              <p>Versión 1.0</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 lg:px-8 z-10 shrink-0 shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar} 
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 lg:hidden focus:outline-none focus:ring-2 focus:ring-cyan-500"
            >
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-semibold text-slate-800 dark:text-white hidden sm:block capitalize">
              Panel de Administración
            </h1>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
            >
              {isDarkMode ? <Sun className="w-5 h-5 text-lime-400" /> : <Moon className="w-5 h-5" />}
            </button>

            <button className="p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-cyan-600 dark:hover:text-cyan-400 hover:bg-cyan-50 dark:hover:bg-slate-800 transition-colors relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white dark:border-slate-950"></span>
            </button>
            
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>

            <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="text-right hidden md:block">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200">{user?.nombre + " " + user?.apellidoP+" "+ user?.apellidoM}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Línea A</p>
              </div>
              <UserCircle className="w-8 h-8 text-cyan-500" />
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
            <div className="max-w-6xl mx-auto w-full">
                <Outlet /> 
            </div>
        </main>
      </div>
    </div>
  );
}