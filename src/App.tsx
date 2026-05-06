import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/sidebar';
import ParosCrud from './pages/catologos/paros/paros';
import TurnosCrud from './pages/catologos/turnos/turnos';
import MaquinasCrud from './pages/catologos/maquinas/maquinas';
import LineasCrud from './pages/catologos/lineas_produccion/lineas_produccion';
import LotesCrud from './pages/catologos/lotes/lotes';
import ProductosCrud from './pages/catologos/productos/productos';
import UsuariosCrud from './pages/catologos/usuarios/usuarios';
import SemanasCrud from './pages/catologos/semanas/semanas';
import LoginScreen, { useAuth } from './auth/auth';
import FormasTrabajoCrud from './pages/catologos/formas_trabajos/formaTrabajoCrud';
import { AuthProvider } from './auth/auth';
//import FormularioParo from './pages/paros/formularioParo';
import './App.css';
// IMPORTACIONES FUTURAS (Comentadas por ahora)
//import LoginScreen from './pages/login';
// import { useAuth } from './context/AuthContext'; 




const ProtectedRoute = () => {
  // ---------------------------------------------------------
  // TODO: LÓGICA DE LOGIN FUTURA
  // Cuando uses el login, solo descomenta estas dos líneas:
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  else {
    // ---------------------------------------------------------

    return (
      // Agregamos flex y h-screen para asegurar que el Sidebar se fije a la izquierda

      <div>
        <Sidebar />
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-8">
          <div className="max-w-6xl mx-auto w-full">
          </div>
        </main>
      </div>

    );
  }
}

function App() {

  // Lógica para detectar el modo oscuro/claro del navegador
  useEffect(() => {
    const checkTheme = () => {
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };

    checkTheme();
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    return () => mediaQuery.removeEventListener('change', checkTheme);
  }, []);

  return (
    <AuthProvider>
    <HashRouter>
      <Routes>
        {/* RUTA PÚBLICA (Para el futuro) */}
        <Route path="/login" element={<LoginScreen />} />

        {/* RUTAS PRIVADAS (Con Sidebar y formato) */}
        {/* Al poner ProtectedRoute como 'element' padre, envuelve todas las rutas hijas */}
        <Route element={<ProtectedRoute />}>
          {/* Ruta principal por defecto */}
          <Route path="/" element={<div className="text-2xl font-bold">Bienvenido al Dashboard</div>} />
          {/* Tu CRUD de paros. Se mostrará dentro del Outlet de ProtectedRoute */}
          <Route path="/parosCrud" element={<ParosCrud />} />
          <Route path="/turnosCrud" element={<TurnosCrud />} />
          <Route path="/maquinasCrud" element={<MaquinasCrud />} />
          <Route path="/lineas_produccion" element={<LineasCrud />} />
          <Route path="/lotesCrud" element={<LotesCrud />} />
          <Route path="/formaTrabajoCrud" element={<FormasTrabajoCrud />} />
          <Route path="/productosCrud" element={<ProductosCrud />} />
          <Route path="/usuariosCrud" element={<UsuariosCrud />} />
          <Route path="/semanasCrud" element={<SemanasCrud />} />
        </Route>
      </Routes>
    </HashRouter>
    </AuthProvider>
  );
}

export default App;