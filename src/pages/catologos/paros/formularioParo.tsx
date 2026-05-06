import React, { useState, useEffect } from 'react';
import type { ApiResponse } from '../../../interfaces/response';
import {
    Sun,
    Moon,
    Save,
    AlignLeft,
    Settings,
    Activity,
    Hash,
    X,
    Tablet,
    Octagon,
    Play,
    Droplet,
    Box,
    UserMinus,
    Loader2,
    Sparkles,
    Mic,
    AlertCircle,
    PackageCheck,
    CalendarClock,
    CheckCircle2,
    XCircle,
    CirclePlus,
    ArrowLeftFromLine,
    Type
} from 'lucide-react';
import type { Paro } from '../../../interfaces/paros';
import type { Maquina } from '../../../interfaces/maquinas';
import { ApiService } from '../../../services/ApiService';

// Catálogo de iconos para el Select
const ICON_CATALOG = {
    Tablet, Octagon, Play, Settings, Droplet, Box, UserMinus,
    Loader2, Sparkles, Mic, Activity, AlertCircle, PackageCheck,
    CalendarClock, CheckCircle2, XCircle, CirclePlus, ArrowLeftFromLine
};

interface FormularioParoProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    paro?: Paro; // Cambiado de maquina a paro
    action: string;
    refreshData: () => void;
}

export default function FormularioParo({ isOpen, onClose, title, paro, action, refreshData }: FormularioParoProps) {
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [maquinasDisponibles, setMaquinasDisponibles] = useState<Maquina[]>([]);

    const defaultFormData: Paro = {
        id_paro: '',
        clave: '',
        descripcion: '',
        estatus: true,
        icon: 'Activity',
        id_maquina: '',
        maquina: '',
        nombre: '',
        programado: false
    };

    const [formData, setFormData] = useState<Paro>(defaultFormData);

    // Cargar máquinas al montar el componente
    const getMaquinas = async () => {
        try {
            const data: Maquina[] = await ApiService.getAllMaquinas();
            setMaquinasDisponibles(data);
        } catch (error) {
            console.error('Error al obtener las máquinas:', error);
        }
    };

    useEffect(() => {
        getMaquinas();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setFormData(paro || defaultFormData);
            setShowSuccess(false);
        }
    }, [isOpen, paro]);

    if (!isOpen) return null;

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleMaquinaSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedId = e.target.value;
        const maq = maquinasDisponibles.find((m) => m.id_maquina === selectedId);
        setFormData((prev) => ({
            ...prev,
            id_maquina: selectedId,
            maquina: maq ? maq.maquina : '',
        }));
    };

    const handleToggleChange = (field: keyof Paro) => {
        setFormData((prev) => ({
            ...prev,
            [field]: !prev[field],
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const actionMap: Record<string, () => Promise<ApiResponse<{ clave: string }>>> = {
            'Crear': () => ApiService.insertParo(formData),
            'Editar': () => ApiService.updateParo(formData),
            'Eliminar': () => ApiService.deleteParo(formData.id_paro), // Asumiendo que existe
        };
        try {

            const executeAction = actionMap[action];

            if (!executeAction) {
                throw new Error(`Acción no permitida: ${action}`);
            }

            const response = await executeAction();
            if (response.success) {
                setShowSuccess(true);
                setTimeout(() => {
                    setShowSuccess(false);
                    refreshData();
                    onClose();
                }, 2000);
            }
        } catch (error) {
            console.error('Error en la petición:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const CustomToggle = ({ enabled, onChange, label, icon: Icon, colorClass = "text-indigo-500" }: any) => (
        <div className="flex items-center justify-between p-4 border rounded-xl dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-100 dark:border-slate-700">
                    <Icon className={`w-5 h-5 ${colorClass}`} />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</span>
            </div>
            <button
                type="button"
                onClick={onChange}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ring-2 ring-transparent focus:ring-indigo-500 ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-slate-600'}`}
            >
                <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
        </div>
    );

    // Icono dinámico para el select
    const SelectedIcon = (ICON_CATALOG as any)[formData.icon] || Activity;

    return (
        <div className={`${isDarkMode ? 'dark' : ''} font-sans`}>
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
                <div className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200 dark:border-slate-800 max-h-[95vh] flex flex-col" onClick={(e) => e.stopPropagation()}>

                    {/* Header */}
                    <div className="px-6 py-5 border-b border-gray-200 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-between items-center sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="bg-orange-500 p-2 rounded-lg text-white shadow-sm">
                                <AlertCircle className="w-6 h-6" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{title}</h2>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Configure los detalles del motivo de paro.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-slate-800 transition-colors">
                                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                            </button>
                            <button type="button" onClick={onClose} className="p-2 rounded-full text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 sm:p-8 overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                            {/* Clave del Paro */}

                            <div className="col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">ID Paro</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="id_paro"
                                        value={formData.id_paro}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Lo generara el sistema..."
                                        disabled
                                    />
                                </div>
                            </div>
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Clave / Código</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Hash className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="clave"
                                        value={formData.clave}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ej. P-001"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Nombre del Paro */}
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Nombre del Paro</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Type className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="text"
                                        name="nombre"
                                        value={formData.nombre}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
                                        placeholder="Ej. Falta de Material"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Select Máquina */}
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Máquina Asociada</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Settings className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        name="id_maquina"
                                        value={formData.id_maquina}
                                        onChange={handleMaquinaSelect}
                                        required
                                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    >
                                        <option value="" disabled>Seleccione una máquina</option>
                                        {maquinasDisponibles.map((m) => (
                                            <option key={m.id_maquina} value={m.id_maquina}>{m.maquina}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Select Icono */}
                            <div className="col-span-1">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icono Visual</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SelectedIcon className="h-5 w-5 text-indigo-500" />
                                    </div>
                                    <select
                                        name="icon"
                                        value={formData.icon}
                                        onChange={handleInputChange}
                                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 appearance-none"
                                    >
                                        {Object.keys(ICON_CATALOG).map((iconName) => (
                                            <option key={iconName} value={iconName}>{iconName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Descripción */}
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Descripción Detallada</label>
                                <div className="relative">
                                    <div className="absolute top-3 left-3 pointer-events-none">
                                        <AlignLeft className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <textarea
                                        name="descripcion"
                                        value={formData.descripcion}
                                        onChange={handleInputChange}
                                        rows={2}
                                        className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                                        placeholder="Describa el motivo o causas de este paro..."
                                    />
                                </div>
                            </div>

                            {/* Toggles */}
                            <div className="col-span-1">
                                <CustomToggle
                                    enabled={formData.programado}
                                    onChange={() => handleToggleChange('programado')}
                                    label={formData.programado ? "Paro Programado" : "Paro No Programado"}
                                    icon={CalendarClock}
                                    colorClass="text-amber-500"
                                />
                            </div>
                            <div className="col-span-1">
                                <CustomToggle
                                    enabled={formData.estatus}
                                    onChange={() => handleToggleChange('estatus')}
                                    label={formData.estatus ? "Estatus: Activo" : "Estatus: Inactivo"}
                                    icon={CheckCircle2}
                                    colorClass="text-green-500"
                                />
                            </div>
                        </div>

                        {/* Success Message */}
                        {showSuccess && (
                            <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-xl flex items-center gap-3 animate-bounce">
                                <Save className="w-5 h-5 text-green-600" />
                                <p className="text-sm font-medium text-green-800 dark:text-green-300">¡Registro guardado con éxito!</p>
                            </div>
                        )}

                        {/* Footer Buttons */}
                        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-slate-800 flex flex-col-reverse sm:flex-row justify-end gap-3 sticky bottom-0 bg-white dark:bg-slate-900 z-10">
                            <button type="button" onClick={onClose} className="px-6 py-2.5 border border-gray-300 dark:border-slate-700 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 transition-colors">
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className={`flex justify-center items-center gap-2 px-6 py-2.5 rounded-xl shadow-sm text-sm font-medium text-white transition-colors ${isLoading ? 'bg-indigo-400' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                            >
                                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                {isLoading ? 'Guardando...' : 'Guardar Paro'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}