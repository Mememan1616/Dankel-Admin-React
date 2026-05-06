import { useState, useEffect, useMemo } from 'react';
import type { Usuario } from '../../../interfaces/usuarios'; // Ajusta la ruta
import { ApiService } from '../../../services/ApiService';
import {
    Edit,
    Trash2,
    Search,
    Filter,
    User, // Ícono para Usuario
    Plus,
    ShieldCheck,
} from 'lucide-react';
import FormularioUsuario from './formularioUsuario'; // Asegúrate de crear este componente

export default function UsuariosCrud() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    
    // --- ESTADOS PARA EL MODAL ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedUsuario, setSelectedUsuario] = useState<Usuario | null>(null);
    const [title, setTitle] = useState('');

    // --- ESTADOS PARA FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    const [filtroEstatus, setFiltroEstatus] = useState('todos');
    const [filtroRol, setFiltroRol] = useState('todos');

    useEffect(() => {
        getAllUsuarios();
    }, []);

    const getAllUsuarios = async () => {
        try {
            const usuariosData: Usuario[] = await ApiService.getAllUsers();
            setUsuarios(usuariosData);
        } catch (error) {
            console.error("Error al cargar usuarios:", error);
        }
    };

    // --- FUNCIÓN PARA ABRIR EL FORMULARIO ---
    const MostrarFormulario = (action: string, usuario?: Usuario) => {
        setTitle(action + " usuario");
        setIsModalOpen(true);
        setAction(action);
        
        if (usuario) { 
            setSelectedUsuario(usuario); 
        } else {
            setSelectedUsuario(null);
        }
    };

    // --- LÓGICA DE FILTRADO ---
    const usuariosFiltrados = useMemo(() => {
        return usuarios.filter((user) => {
            // 1. Búsqueda por texto (Nombre completo o Email)
            const busqueda = searchTerm.toLowerCase();
            const nombreCompleto = `${user.nombre} ${user.apellidoP} ${user.apellidoM}`.toLowerCase();
            const coincideTexto = 
                nombreCompleto.includes(busqueda) || 
                user.email.toLowerCase().includes(busqueda) ||
                user.clave_trabajador?.toString().includes(busqueda);

            // 2. Filtro por Estatus
            const coincideEstatus = 
                filtroEstatus === 'todos' ? true :
                filtroEstatus === 'activos' ? user.estatus === true :
                user.estatus === false;

            // 3. Filtro por Rol
            const coincideRol = 
                filtroRol === 'todos' ? true : 
                user.rol === filtroRol;

            return coincideTexto && coincideEstatus && coincideRol;
        });
    }, [usuarios, searchTerm, filtroEstatus, filtroRol]);

    // Función para dar color a los roles
    const getRoleBadgeColor = (rol: string) => {
        switch (rol) {
            case 'Administrador': return 'bg-purple-100 text-purple-800 dark:bg-purple-500/20 dark:text-purple-300';
            case 'Supervisor': return 'bg-blue-100 text-blue-800 dark:bg-blue-500/20 dark:text-blue-300';
            default: return 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300';
        }
    };

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6" >
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Usuarios
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Gestiona los accesos, roles y personal del sistema.
                    </p>
                </div>

                <button 
                    onClick={() => MostrarFormulario('Crear')}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-blue-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900"
                >
                    <Plus className="w-4 h-4" /> Nuevo Usuario
                </button>
            </div>

            <div className="space-y-4">
                {/* --- Barra de Búsqueda y Filtros --- */}
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email o clave..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors"
                        />
                    </div>
                    <button 
                        onClick={() => setMostrarFiltros(!mostrarFiltros)}
                        className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                            mostrarFiltros 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400 dark:border-indigo-800' 
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}
                    >
                        <Filter className="w-4 h-4" /> {mostrarFiltros ? 'Ocultar Filtros' : 'Filtros'}
                    </button>
                </div>

                {/* --- Panel desplegable de Filtros Adicionales --- */}
                {mostrarFiltros && (
                    <div className="flex flex-col sm:flex-row gap-4 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 animate-in fade-in slide-in-from-top-2">
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Estatus</label>
                            <select 
                                value={filtroEstatus} 
                                onChange={(e) => setFiltroEstatus(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todos">Todos los estados</option>
                                <option value="activos">Activos</option>
                                <option value="inactivos">Inactivos</option>
                            </select>
                        </div>
                        <div className="w-full sm:w-auto">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">Rol</label>
                            <select 
                                value={filtroRol} 
                                onChange={(e) => setFiltroRol(e.target.value)}
                                className="w-full sm:w-48 px-3 py-2 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none text-slate-700 dark:text-slate-200"
                            >
                                <option value="todos">Todos los roles</option>
                                <option value="Operador">Operador</option>
                                <option value="Administrador">Administrador</option>
                                <option value="Supervisor">Supervisor</option>
                            </select>
                        </div>
                    </div>
                )}

                {/* --- Tabla --- */}
                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse whitespace-nowrap min-w-full">
                            <thead>
                                <tr className="border-b border-slate-200 dark:border-slate-800">
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Usuario</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Clave</th>
                                    <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Rol</th>
                                    <th className="px-6 py-4 font-medium text-center text-slate-700 dark:text-slate-200">Estatus</th>
                                    <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                                {usuariosFiltrados.length > 0 ? (
                                    usuariosFiltrados.map((user) => (
                                        <tr key={user.id_user} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 shrink-0">
                                                        <User className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                                                            {user.nombre} {user.apellidoP} {user.apellidoM}
                                                        </p>
                                                        <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-slate-600 dark:text-slate-400 font-mono">
                                                    {user.clave_trabajador || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(user.rol)}`}>
                                                    {user.rol === 'Administrador' && <ShieldCheck className="w-3 h-3" />}
                                                    {user.rol}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.estatus
                                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-300'
                                                    : 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
                                                    }`}>
                                                    {user.estatus ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button 
                                                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" 
                                                        onClick={() => MostrarFormulario('Editar', user)}
                                                    >
                                                        <Edit className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" 
                                                        onClick={() => MostrarFormulario('Eliminar', user)}
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                                            No se encontraron usuarios que coincidan con la búsqueda.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <FormularioUsuario
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedUsuario(null);
                    setAction('');
                }}
                title={title}
                action={action}
                usuario={selectedUsuario || undefined}
                //onSuccess={getAllUsuarios} // Para refrescar la tabla tras cambios
            />
        </>
    );
}