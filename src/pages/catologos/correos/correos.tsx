import { useState, useEffect, useMemo } from 'react';
import type { correo } from '../../../interfaces/correos';
import { ApiService } from '../../../services/ApiService';

import {
    Trash2,
    Search,
    Plus,
    Mail,
    Pencil,
    Clock,
} from 'lucide-react';
import FormularioCorreo from './formularioCorreo';
import FormularioDuracion from './formularioDuracion';

export default function CorreosCrud() {
    const [correos, setCorreos] = useState<correo[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [action, setAction] = useState('');
    const [selectedCorreo, setSelectedCorreo] = useState<correo | null>(null);
    const [title, setTitle] = useState('');

    const [isDuracionModalOpen, setIsDuracionModalOpen] = useState(false);

    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        getAllCorreos();
    }, []);

    const getAllCorreos = async () => {
        const data: correo[] = await ApiService.getCorreos();
        setCorreos(data);
    };

    const MostrarFormulario = (action: string, correoItem?: correo) => {
        setAction(action);
        setTitle(action + " correo");
        setIsModalOpen(true);
        setSelectedCorreo(correoItem ? correoItem : null);
    };

    const correosFiltrados = useMemo(() => {
        const busqueda = searchTerm.toLowerCase();
        return correos.filter((item) => 
            item.correo.toLowerCase().includes(busqueda)
        );
    }, [correos, searchTerm]);

    return (
        <>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white capitalize">
                        Catálogo de Correos
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Administra y visualiza los correos registrados.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    <button
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-900 w-full sm:w-auto"
                        onClick={() => setIsDuracionModalOpen(true)}
                    >
                        <Clock className="w-4 h-4" /> Duración
                    </button>
                    <button
                        className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-lime-500 hover:from-cyan-600 hover:to-lime-600 text-white rounded-lg shadow-md font-medium text-sm transition-all flex items-center justify-center gap-2 focus:ring-2 focus:ring-offset-2 focus:ring-cyan-500 dark:focus:ring-offset-slate-900 w-full sm:w-auto"
                        onClick={() => MostrarFormulario('Crear')}
                    >
                        <Plus className="w-4 h-4" /> Nuevo Registro
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white dark:bg-slate-950 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300">
                    <div className="relative max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por correo..."
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500 dark:focus:ring-cyan-400 transition-colors"
                        />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-950 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors duration-300 overflow-x-auto">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                        <thead>
                            <tr>
                                <th className="px-6 py-4 font-medium text-slate-700 dark:text-slate-200">Correo</th>
                                <th className="px-6 py-4 font-medium text-right text-slate-700 dark:text-slate-200">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                            {correosFiltrados.map((item) => (
                                <tr key={item.id_correo} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/10 text-cyan-500">
                                                <Mail className="w-5 h-5" />
                                            </div>
                                            <p className="text-sm font-medium text-slate-900 dark:text-white">{item.correo}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button className="p-1.5 text-slate-400 hover:text-cyan-600 transition-colors" title="Editar"
                                                onClick={() => MostrarFormulario('Editar', item)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </button>
                                            <button className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors" title="Eliminar"
                                                onClick={() => MostrarFormulario('Eliminar', item)}
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            <FormularioCorreo
                isOpen={isModalOpen}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedCorreo(null);
                    setTitle('');
                }}
                title={title}
                action={action}
                refreshData={getAllCorreos}
                correoItem={selectedCorreo ? selectedCorreo : undefined}
            />

            <FormularioDuracion
                isOpen={isDuracionModalOpen}
                onClose={() => setIsDuracionModalOpen(false)}
            />
        </>
    );
}
