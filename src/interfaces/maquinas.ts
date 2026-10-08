export type TipoAlimentacion = 'Automática' | 'Manual';

export interface CapacidadMaquina {
  id_producto: string;
  producto: string; 
  velocidad: number;
  tipo: TipoAlimentacion;
  estatus: boolean;
}

export interface Maquina {
  id_maquina: string;
  id_linea: string;
  linea: string;
  maquina: string;
  descripcion: string;
  estatus: boolean;
  produccionxHora?: number; 
  capacidades?: CapacidadMaquina[]; // Arreglo para manejar la vista en UI
}