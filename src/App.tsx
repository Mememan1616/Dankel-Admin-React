import { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Sidebar from './components/sidebar';
import ParosCrud from './pages/catologos/paros/paros';
import TurnosCrud from './pages/catologos/turnos/turnos';
import MaquinasCrud from './pages/catologos/maquinas/maquinas';
import LineasCrud from './pages/catologos/lineas_produccion/lineas_produccion';
import LotesCrud from './pages/catologos/lotes/lotes';
import ProductosCrud from './pages/catologos/productos/productos';
import UsuariosCrud from './pages/catologos/usuarios/usuarios';
import SemanasCrud from './pages/catologos/semanas/semanas';
import LoginScreen, { useAuth, AuthProvider } from './auth/auth';
import FormasTrabajoCrud from './pages/catologos/formas_trabajos/formaTrabajoCrud';
import DashboardPage from './pages/dashboard/DashboardPage';
// 👇 AGREGAMOS LA IMPORTACIÓN QUE FALTABA 👇
import ProduccionCrud from './pages/catologos/produccion/produccion'; 
import './App.css';

const ProtectedRoute = ({ allowedRoles }: { allowedRoles: string[] }) => {
  const { user } = useAuth();
  
  if (!user) return <Navigate to="/login" replace />;

  const userRole = String(user.rol || '').trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  const rolesPermitidos = allowedRoles.map(r => r.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, ""));

  if (!rolesPermitidos.includes(userRole)) {
    return <Navigate to="/" replace />; 
  }

  return <Outlet />;
};

const RequireAuthLayout = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Sidebar />;
};

function App() {
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
          <Route path="/login" element={<LoginScreen />} />

          <Route element={<RequireAuthLayout />}>
            
            {/* PERMITIDO PARA ADMIN Y FABRICACIÓN */}
            <Route element={<ProtectedRoute allowedRoles={['administrador', 'fabricacion']} />}>
              <Route path="/" element={<DashboardPage />} />
              {/* 👇 AGREGAMOS LA RUTA QUE SE HABÍA BORRADO 👇 */}
              <Route path="/produccion" element={<ProduccionCrud />} /> 
              <Route path="/semanasCrud" element={<SemanasCrud />} />
              <Route path="/lotesCrud" element={<LotesCrud />} />
              <Route path="/turnosCrud" element={<TurnosCrud />} />
            </Route>

            {/* EXCLUSIVO PARA ADMINISTRADOR */}
            <Route element={<ProtectedRoute allowedRoles={['administrador']} />}>
              <Route path="/parosCrud" element={<ParosCrud />} />
              <Route path="/maquinasCrud" element={<MaquinasCrud />} />
              <Route path="/lineas_produccion" element={<LineasCrud />} />
              <Route path="/productosCrud" element={<ProductosCrud />} />
              <Route path="/usuariosCrud" element={<UsuariosCrud />} />
              <Route path="/formaTrabajoCrud" element={<FormasTrabajoCrud />} />
            </Route>

          </Route>
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
}

export default App;