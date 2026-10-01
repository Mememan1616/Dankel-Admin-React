import writeXlsxFile, { getSheetData } from 'write-excel-file/browser';
import type { Cell, Column } from 'write-excel-file/browser';

const ESTILO_CABECERA = { fontWeight: 'bold', backgroundColor: '#E2E8F0' } as const;

export const cabecera = (titulo: string): Cell => ({ value: titulo, ...ESTILO_CABECERA });

export const fechaArchivo = (): string => new Date().toISOString().split('T')[0];

export const numero = (valor: unknown): number | null => {
    if (valor === null || valor === undefined || valor === '') return null;
    const n = typeof valor === 'number' ? valor : Number(String(valor).trim());
    return Number.isFinite(n) ? n : null;
};

export const celdaNumero = (valor: unknown): Cell => {
    const n = numero(valor);
    if (n === null) return null;
    return { value: n, type: Number };
};

export const celdaTexto = (valor: unknown): Cell => {
    const texto = valor === null || valor === undefined ? '' : String(valor).trim();
    return texto === '' ? null : texto;
};

export const descargarXlsx = async <T>(
    filas: T[],
    sheet: string,
    columns: Column<T>[],
    nombreBase: string
): Promise<void> => {
    if (filas.length === 0) return;
    const primera = filas[0] as unknown;
    if (primera === null || typeof primera !== 'object' || Array.isArray(primera)) {
        console.warn(`[descargarXlsx] Primera fila inesperada en "${sheet}":`, typeof primera, primera);
    }
    const sheetData = getSheetData(filas, columns);
    await writeXlsxFile(sheetData, { sheet }).toFile(`${nombreBase}_${fechaArchivo()}.xlsx`);
};
