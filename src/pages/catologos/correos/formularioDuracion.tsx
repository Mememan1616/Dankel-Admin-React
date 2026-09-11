import { useState, useEffect } from 'react';
import {
    Clock,
    Save,
    X,
    Loader2,
    CheckCircle2,
    XCircle,
} from 'lucide-react';
import { ApiService } from '../../../services/ApiService';

interface FormularioDuracionProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function FormularioDuracion({ isOpen, onClose }: FormularioDuracionProps) {
    const [horas, setHoras] = useState<number>(0);
    const [minutos, setMinutos] = useState<number>(0);
    const [showSuccess, setShowSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isFetching, setIsFetching] = useState(false);

    useEffect(() => {
        if (isOpen) {
            cargarDuracion();
            setShowSuccess(false);
            setError(null);
        }
    }, [isOpen]);

    const cargarDuracion = async () => {
        setIsFetching(true);
        try {
            const data = await ApiService.getCorreoDuracion();
            console.log(data);
            
            if (data) {
                const totalSegundos = data.duracion_segundos;
                setHoras(Math.floor(totalSegundos / 3600));
                setMinutos(Math.floor((totalSegundos % 3600) / 60));
            }
        } catch (err: any) {
            setError(err?.message || 'Error al cargar la duración.');
        } finally {
            setIsFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        try {
            const totalSegundos = (horas * 3600) + (minutos * 60);
            await ApiService.updateCorreoDuracion({ duracion_segundos: totalSegundos });
            setShowSuccess(true);
            setTimeout(() => {
                setShowSuccess(false);
                onClose();
            }, 2000);
        } catch (err: any) {
            setError(err?.message || 'No se pudo guardar la duración.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
            <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800" onClick={(e) => e.stopPropagation()}>
                <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-cyan-500 p-2 rounded-lg text-white shadow-sm">
                            <Clock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Duración de Correo</h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Configura el tiempo de envío.</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Horas</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={0}
                                    value={horas}
                                    onChange={(e) => setHoras(Number(e.target.value))}
                                    className="block w-full pl-3 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Ej. 1"
                                    disabled={isFetching}
                                    required
                                />
                            </div>
                        </div>

                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Minutos</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min={0}
                                    max={59}
                                    value={minutos}
                                    onChange={(e) => setMinutos(Number(e.target.value))}
                                    className="block w-full pl-3 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-cyan-500"
                                    placeholder="Ej. 30"
                                    disabled={isFetching}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    {showSuccess && (
                        <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3">
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                            <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Duración guardada con éxito!</p>
                        </div>
                    )}

                    {error && (
                        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
                            <XCircle className="w-5 h-5 text-red-600" />
                            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
                        </div>
                    )}

                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading || isFetching}
                            className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white transition-colors ${isLoading ? 'bg-cyan-400' : 'bg-cyan-600 hover:bg-cyan-700'}`}
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            {isLoading ? 'Guardando...' : 'Guardar'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
