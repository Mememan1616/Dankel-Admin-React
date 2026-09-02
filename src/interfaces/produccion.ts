export interface Produccion {
    id_produccion: string;

    // Campos de identificación y control (Nuevos)
    id_semana: string;
    id_lote: string;
    id_maquina: string;
    id_operador: string;
    id_producto: string;
    id_turno: string;
    estatus: boolean;

    // Datos descriptivos
    lote: string;
    maquina: string;
    operador: string;
    producto: string;
    turno: string;
    tipo_cierre: string;

    // Fechas y Horarios (Nuevos)
    fecha_produccion: string; // Formato "DD/MM/YYYY"
    fecha_termino: string;    // Formato "DD/MM/YYYY"
    hora_inicio: string;      // Formato "HH:MM:SS"
    hora_termino: string;     // Formato "HH:MM:SS"

    // Métricas de producción
    piezas_buenas: number;
    piezas_malas: number;
    piezas_producidas: number;
    produccionxHora: number;
}

export interface RegistroParo {
    id_registro_paro: string;
    // Identificadores (IDs)
    id_paro: string;
    id_produccion: string;
    id_semana: string;
    id_lote: string;
    id_maquina: string;
    id_operador: string;
    id_producto: string;
    id_turno: string;

    // Detalles del Paro
    paro: string;              // Ejemplo: "Cambio de Carbonica"
    descripcion_paro: string;  // Ejemplo: "Se necesita nuevo material..."
    estatus: boolean;

    // Información de Contexto
    lote: string;
    maquina: string;
    operador: string;
    producto: string;
    turno: string;

    // Tiempos
    fecha_produccion: string;  // Formato "DD/MM/YYYY"
    hora_inicio: string;       // Formato "HH:MM:SS"
    hora_termino: string;      // Formato "HH:MM:SS"
}