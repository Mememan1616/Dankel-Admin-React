import type { TipoAlimentacion } from './maquinas';

export interface ProduccionProductoMaquina {
  id_producto: string;
  id_maquina: string;
  tipo: TipoAlimentacion;
  velocidad: number;
  producto: string;
  id_produccionMaqinaxProducto: string;
  estatus: boolean;
}