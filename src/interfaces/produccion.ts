export interface Produccion {
    id_produccion: string;
    id_maquina: string;
    id_turno: string;
    id_semana: string;
    lote: string;
    hora_inicio: string;
    hora_termino: string;
    piezas_producidas: number | string;
    piezas_buenas: number | string;
    fecha?: string; 
}