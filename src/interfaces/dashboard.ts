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

export interface RegistroParoLog {
    id_registro_paro: string;
    fecha_produccion: string;
    hora_inicio: string;
    hora_termino: string;
    id_maquina: string;
    maquina: string;
    id_semana: string;
    id_turno: string;
    paro: string; 
}