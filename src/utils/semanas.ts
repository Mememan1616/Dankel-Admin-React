import { parseFecha } from './fechas';
import type { Semana } from '../interfaces/semanas';

const comparar = (a: Semana, b: Semana): number => {
    const fa = parseFecha(a.fecha_inicio);
    const fb = parseFecha(b.fecha_inicio);

    if (!Number.isNaN(fa) && !Number.isNaN(fb)) {
        return fb - fa;
    }

    return String(b.id_semana).localeCompare(String(a.id_semana));
};

export const getSemanasOrdenadas = (semanas: Semana[]): Semana[] => {
    return [...(semanas || [])].sort(comparar);
};

export const getSemanaMasReciente = (semanas: Semana[]): string => {
    const ordenadas = getSemanasOrdenadas(semanas);
    return ordenadas.length > 0 ? ordenadas[0].id_semana : '';
};

export const getUltimasSemanas = (semanas: Semana[], cantidad: number): string[] => {
    return getSemanasOrdenadas(semanas)
        .slice(0, cantidad)
        .map(s => s.id_semana);
};
