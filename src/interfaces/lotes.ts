export interface Lote {
    id_lote: string;
    lote: string;
    descripcion: string;
    estatus: boolean;
    id_forma_trabajo: string;
    forma_trabajo: string;
    id_producto: string;
    producto: string;
    
    // 👇 NUEVO: Campos para la semana
    id_semana?: string;
    
    maquinas: Maquina[];
}

export interface Maquina {
    id_maquina: string;
    id_linea: string;
    linea: string;
    maquina: string;
    descripcion: string;
    estatus: boolean;
}