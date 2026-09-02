export interface Lote {
    id_lote: string;
    lote: string;
    descripcion: string;
    estatus: boolean;
    id_linea_trabajo: string;
    linea: string;
    id_producto: string;
    producto: string;
    
    // 👇 NUEVO: Campos para la semana
    id_semana?: string;
    
    maquinas: Maquina_Lote[];
}

export interface Maquina_Lote {
    id_maquina: string;
    estatus: boolean;
}