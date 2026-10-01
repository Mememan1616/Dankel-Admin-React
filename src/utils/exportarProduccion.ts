import type { Column } from 'write-excel-file/browser';
import type { Produccion } from '../interfaces/produccion';
import type { Maquina } from '../interfaces/maquinas';
import type { Semana } from '../interfaces/semanas';
import { cabecera, celdaNumero, celdaTexto, descargarXlsx } from './exportarXlsx';

export const exportarProduccion = async (
    filas: Produccion[],
    semanas: Semana[],
    maquinas: Maquina[]
): Promise<void> => {
    const descripcionSemana = new Map(
        semanas.map(s => [String(s.id_semana), s.descripcion || String(s.id_semana)])
    );
    const nombreMaquina = new Map(maquinas.map(m => [String(m.id_maquina), m.maquina]));

    const resolverSemana = (id: unknown) => descripcionSemana.get(String(id)) ?? id;
    const resolverMaquina = (id: unknown, alterno: unknown) => nombreMaquina.get(String(id)) ?? alterno;

    const columns: Column<Produccion>[] = [
        {
            header: cabecera('Semana'),
            width: 22,
            cell: p => celdaTexto(resolverSemana(p.id_semana))
        },
        {
            header: cabecera('Lote'),
            width: 16,
            cell: p => celdaTexto(p.lote)
        },
        {
            header: cabecera('Máquina'),
            width: 18,
            cell: p => celdaTexto(resolverMaquina(p.id_maquina, p.maquina))
        },
        {
            header: cabecera('Operador'),
            width: 18,
            cell: p => celdaTexto(p.operador || p.id_operador)
        },
        {
            header: cabecera('Producto'),
            width: 18,
            cell: p => celdaTexto(p.producto || p.id_producto)
        },
        {
            header: cabecera('Turno'),
            width: 12,
            cell: p => celdaTexto(p.turno)
        },
        {
            header: cabecera('Fecha Producción'),
            width: 16,
            cell: p => celdaTexto(p.fecha_produccion)
        },
        {
            header: cabecera('Fecha Término'),
            width: 16,
            cell: p => celdaTexto(p.fecha_termino)
        },
        {
            header: cabecera('Hora Inicio'),
            width: 12,
            cell: p => celdaTexto(p.hora_inicio)
        },
        {
            header: cabecera('Hora Término'),
            width: 12,
            cell: p => celdaTexto(p.hora_termino)
        },
        {
            header: cabecera('Piezas Buenas'),
            width: 14,
            cell: p => celdaNumero(p.piezas_buenas)
        },
        {
            header: cabecera('Piezas Malas'),
            width: 13,
            cell: p => celdaNumero(p.piezas_malas)
        },
        {
            header: cabecera('Piezas Producidas'),
            width: 17,
            cell: p => celdaNumero(p.piezas_producidas)
        },
        {
            header: cabecera('Prod. x Hora'),
            width: 14,
            cell: p => celdaNumero(p.produccionxHora)
        },
        {
            header: cabecera('Tipo Cierre'),
            width: 14,
            cell: p => celdaTexto(p.tipo_cierre)
        },
        {
            header: cabecera('Estatus'),
            width: 10,
            cell: p => celdaTexto(p.estatus ? 'Activo' : 'Cerrado')
        }
    ];

    await descargarXlsx(filas, 'Produccion', columns, 'Produccion');
};
