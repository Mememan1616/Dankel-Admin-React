import type { TipoAlimentacion } from './maquinas';

export interface ProduccionProductoMaquina {
  id_producto: string;
  id_maquina: string;
  tipo: TipoAlimentacion;
  velocidad: number;
  producto: string;
  id_produccion_productoxmaquina: string;
  estatus: boolean;
}