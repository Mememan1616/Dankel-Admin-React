import type { Column } from 'write-excel-file/browser';
import type { RegistroParo } from '../interfaces/produccion';
import type { Maquina } from '../interfaces/maquinas';
import type { Semana } from '../interfaces/semanas';
import { cabecera, celdaTexto, descargarXlsx } from './exportarXlsx';

export const exportarParos = async (
    filas: RegistroParo[],
    semanas: Semana[],
    maquinas: Maquina[]
): Promise<void> => {
    const descripcionSemana = new Map(
        semanas.map(s => [String(s.id_semana), s.descripcion || String(s.id_semana)])
    );
    const nombreMaquina = new Map(maquinas.map(m => [String(m.id_maquina), m.maquina]));

    const columns: Column<RegistroParo>[] = [
        {
            header: cabecera('Fecha'),
            width: 14,
            cell: p => celdaTexto(p.fecha_produccion)
        },
        {
            header: cabecera('Semana'),
            width: 22,
            cell: p => celdaTexto(descripcionSemana.get(String(p.id_semana)) ?? p.id_semana)
        },
        {
            header: cabecera('Turno'),
            width: 12,
            cell: p => celdaTexto(p.turno)
        },
        {
            header: cabecera('Operador'),
            width: 18,
            cell: p => celdaTexto(p.operador)
        },
        {
            header: cabecera('Máquina'),
            width: 18,
            cell: p => celdaTexto(nombreMaquina.get(String(p.id_maquina)) ?? p.maquina)
        },
        {
            header: cabecera('Lote'),
            width: 16,
            cell: p => celdaTexto(p.lote)
        },
        {
            header: cabecera('Producto'),
            width: 18,
            cell: p => celdaTexto(p.producto)
        },
        {
            header: cabecera('Motivo de Paro'),
            width: 28,
            cell: p => celdaTexto(p.paro)
        },
        {
            header: cabecera('Descripción'),
            width: 40,
            cell: p => celdaTexto(p.descripcion_paro)
        },
        {
            header: cabecera('Hora Inicio'),
            width: 12,
            cell: p => celdaTexto(p.hora_inicio)
        },
        {
            header: cabecera('Hora Término'),
            width: 14,
            cell: p => celdaTexto(p.hora_termino || 'En curso')
        }
    ];

    await descargarXlsx(filas, 'Paros', columns, 'Registro_Paros');
};
