import React, { useState, useEffect } from 'react';
import {
    Mail,
    Save,
    Hash,
    X,
    Loader2,
    CheckCircle2,
    XCircle,
    Trash2,
} from 'lucide-react';
import type { correo } from '../../../interfaces/correos';
import type { ApiResponse } from '../../../interfaces/response';
import { ApiService } from '../../../services/ApiService';

interface FormularioCorreoProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    correoItem?: correo;
    action: string;
    refreshData: () => void;
}

export default function FormularioCorreo({ isOpen, onClose, title, correoItem, action, refreshData }: FormularioCorreoProps) {
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const defaultFormData: correo = {
        id_correo: '',
        correo: '',
    };

    const [formData, setFormData] = useState<correo>(defaultFormData);

    useEffect(() => {
        if (isOpen) {
            setFormData(correoItem || defaultFormData);
            setShowSuccess(false);
            setError(null);
        }
    }, [isOpen, correoItem]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
            'Crear': () => ApiService.insertCorreos(formData),
            'Editar': () => ApiService.updateCorreos(formData),
            'Eliminar': () => ApiService.deleteCorreos(formData.id_correo),
        };
        try {
            const executeAction = actionMap[action];

            if (!executeAction) {
                throw new Error(`Acción no permitida: ${action}`);
            }

            const response = await executeAction();
            if (response) {
                setError(null);
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    onClose();
                    refreshData();
                }, 2000);
            }
        } catch (error: any) {
            console.error('Error en la petición:', error);
            setError(error?.message || 'No se pudo completar la operación.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500 p-2 rounded-lg text-white shadow-sm">
                            <Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configure los detalles del correo.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {action === 'Eliminar' ? (
                    <div className="p-6 sm:p-8">
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                            ¿Está seguro de que desea eliminar el correo <span className="font-semibold">{formData.correo}</span>?
                        </p>
                        {showSuccess && (
                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Correo eliminado con éxito!</p>
                            </div>
                        )}
                        {error && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isLoading}
                                className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white transition-colors ${isLoading ? 'bg-red-400' : 'bg-red-600 hover:bg-red-700'}`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                                {isLoading ? 'Eliminando...' : 'Eliminar'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Correo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="id_correo"
                                        value={formData.id_correo}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Lo generara el sistema..."
                                        disabled
                                    />
                                </div>
                            </div>

                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dirección de Correo</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        name="correo"
                                        value={formData.correo}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                        placeholder="Ej. correo@ejemplo.com"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {showSuccess && (
                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                                <Save className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Registro guardado con éxito!</p>
                            </div>
                        )}

                        {error && (
                            <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                                <XCircle className="w-5 h-5 text-red-600" />
                                <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                            </div>
                        )}

                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white transition-colors ${isLoading ? 'bg-cyan-400' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isLoading ? 'Guardando...' : 'Guardar Correo'}
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
