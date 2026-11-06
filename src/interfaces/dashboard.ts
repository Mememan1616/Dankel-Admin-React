import type { Produccion, RegistroParo } from './produccion';

export interface ProduccionLog {
    id_produccion: string;
    fecha_produccion: string;
    hora_inicio: string;
    hora_termino: string;
    id_maquina: string;
    maquina: string;
    id_lote: string;
    lote: string;
    id_semana: string;
    id_turno: string;
    piezas_buenas: number;
    piezas_malas: number;
    piezas_producidas: number;
}

export type { RegistroParoLog } from './registro_paros';

// --- Dashboard shared types ---

export interface OpcionSelect {
    id: string;
    label: string;
}

export interface MultiSelectProps {
    title: string;
    options: OpcionSelect[];
    selectedValues: string[];
    onChange: (values: string[]) => void;
}

export interface ParetoItem {
    nombre: string;
    minutos: number;
    acumulado: number;
}

export interface Metricas {
    oee: number;
    disponibilidad: number;
    rendimiento: number;
    calidad: number;
    piezasBuenas: number;
    piezasTotal: number;
    piezasMalas: number;
    produccionTeorica: number;
    t_produciendo_min: number;
    t_paros_setup_min: number;
    t_paros_comida_min: number;
    t_paros_despeje_min: number;
    t_paros_noprog_min: number;
    t_ausencia_min: number;
    tiempoIdeal: number;
    paretoData: ParetoItem[];
}

export type EstadoMaquina = 'produciendo' | 'setup' | 'paro' | 'inactiva';

export interface FilaGeneral extends Metricas {
    maquina: string;
    estado: EstadoMaquina;
    nombreParo: string | null;
}

export interface AvanceSemanal {
    meta: number;
    realizados: number;
    pendientes: number;
    porcentaje: number;
    semana: string;
}

export interface DatoLoteGrafica {
    etiqueta: string;
    completados: number;
    pendientes: number;
    totales: number;
    programados: number;
}

export interface AcumuladoLote {
    lote: string;
    buenas: number;
    total: number;
    horasDisponibles: number;
    horasParos: number;
    id_maquina?: string;
    velocidad_producto: number;
}

export interface FilaRendimientoLote extends AcumuladoLote {
    malas: number;
    horasEfectivas: number;
    prodTeorica: number;
    rendimiento: number;
}

// Los registros que devuelve el backend (logs) pueden incluir campos heredados
export interface RegistroProduccion extends Produccion {
    velocidad?: number;
    id?: string;
    fecha?: string;
}

export interface RegistroParoDashboard extends RegistroParo {
    fecha?: string;
    detalles?: string;
}

export interface FiltrableRegistro {
    id_semana?: string;
    id_turno?: string;
    lote?: string;
    id_lote?: string;
    fecha_produccion?: string;
    fecha?: string;
    id_maquina?: string;
    maquina?: string;
}

export interface MaquinaLoteInfo {
    id_maquina?: string;
    maquina?: string;
    estatus?: boolean | string;
}
