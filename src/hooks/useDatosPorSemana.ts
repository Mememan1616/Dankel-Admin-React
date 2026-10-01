import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiService } from '../services/ApiService';
import type { Semana } from '../interfaces/semanas';

const UMBRAL_AVISO_SEMANAS = 12;

const toArray = (data: unknown, idKey: string): Record<string, unknown>[] => {
    if (Array.isArray(data)) return data as Record<string, unknown>[];
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).map(([clave, valor]) => {
        const registro: Record<string, unknown> = { ...(valor as object) };
        registro[idKey] = clave;
        return registro;
    });
};

interface Opciones {
    semanas: Semana[];
    seleccionadas: string[];
    pollingMs?: number;
    incluir?: { produccion?: boolean; paros?: boolean };
}

export function useDatosPorSemana({ semanas, seleccionadas, pollingMs = 0, incluir }: Opciones) {
    const [produccion, setProduccion] = useState<any[]>([]);
    const [paros, setParos] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);

    const enVuelo = useRef(0);
    const secuencia = useRef(0);

    const pedirProduccion = incluir?.produccion !== false;
    const pedirParos = incluir?.paros !== false;

    const validas = (seleccionadas || []).filter(id => id !== '' && id != null);
    const objetivo = validas.length > 0
        ? validas
        : (seleccionadas || []).length === 0
            ? (semanas || []).map(s => s.id_semana)
            : [];
    const key = JSON.stringify(Array.from(new Set(objetivo)).sort());

    const keyRef = useRef(key);

    const cargar = useCallback(async (semanaKey: string, isBackground = false) => {
        const semanaIds: string[] = JSON.parse(semanaKey);

        if (semanaIds.length === 0) {
            setProduccion([]);
            setParos([]);
            setLoading(false);
            return;
        }

        if (isBackground && enVuelo.current > 0) return;

        const miSecuencia = ++secuencia.current;
        enVuelo.current += 1;
        if (!isBackground) setLoading(true);

        const total = semanaIds.length * ((pedirProduccion ? 1 : 0) + (pedirParos ? 1 : 0));
        if (semanaIds.length > UMBRAL_AVISO_SEMANAS) {
            console.warn(`[useDatosPorSemana] ${semanaIds.length} semanas -> ${total} requests al backend`);
        }

        try {
            const [listaProduccion, listaParos] = await Promise.all([
                pedirProduccion
                    ? Promise.all(semanaIds.map(id => ApiService.getProduccionBySemana(id)))
                        .then(res => res.flatMap(d => toArray(d, 'id_produccion')))
                    : Promise.resolve([]),
                pedirParos
                    ? Promise.all(semanaIds.map(id => ApiService.getParosBySemana(id)))
                        .then(res => res.flatMap(d => toArray(d, 'id_registro_paro')))
                    : Promise.resolve([])
            ]);

            if (miSecuencia !== secuencia.current) return;

            if (pedirProduccion) setProduccion(listaProduccion);
            if (pedirParos) setParos(listaParos);
        } catch (error) {
            console.error('[useDatosPorSemana] Error cargando datos por semana:', error);
        } finally {
            enVuelo.current = Math.max(0, enVuelo.current - 1);
            if (miSecuencia === secuencia.current && !isBackground) setLoading(false);
        }
    }, [pedirProduccion, pedirParos]);

    useEffect(() => {
        keyRef.current = key;
    }, [key]);

    useEffect(() => {
        cargar(key);
    }, [key, cargar]);

    useEffect(() => {
        if (!pollingMs) return;
        const intervalo = setInterval(() => cargar(keyRef.current, true), pollingMs);
        return () => clearInterval(intervalo);
    }, [key, pollingMs, cargar]);

    const recargar = useCallback(() => cargar(keyRef.current, false), [cargar]);

    return { produccion, paros, loading, recargar };
}
