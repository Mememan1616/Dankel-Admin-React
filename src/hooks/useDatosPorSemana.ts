import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiService } from '../services/ApiService';
import type { Semana } from '../interfaces/semanas';
import type { RegistroProduccion, RegistroParoDashboard } from '../interfaces/dashboard';
import type { Lote, Meta_lotes_semana } from '../interfaces/lotes';

const UMBRAL_AVISO_SEMANAS = 12;

const toArray = <T,>(data: unknown, idKey: string): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (!data || typeof data !== 'object') return [];
    return Object.entries(data).map(([clave, valor]) => {
        const registro = { ...(valor as object), [idKey]: clave };
        return registro as unknown as T;
    });
};

interface Opciones {
    semanas: Semana[];
    seleccionadas: string[];
    pollingMs?: number;
    incluir?: { produccion?: boolean; paros?: boolean; lotes?: boolean; meta?: boolean };
}

export function useDatosPorSemana({ semanas, seleccionadas, pollingMs = 0, incluir }: Opciones) {
    const [produccion, setProduccion] = useState<RegistroProduccion[]>([]);
    const [paros, setParos] = useState<RegistroParoDashboard[]>([]);
    const [lotes, setLotes] = useState<Lote[]>([]);
    const [metaSemana, setMetaSemana] = useState<Meta_lotes_semana | null>(null);
    const [loading, setLoading] = useState(false);

    const enVuelo = useRef(0);
    const secuencia = useRef(0);

    const pedirProduccion = incluir?.produccion !== false;
    const pedirParos = incluir?.paros !== false;
    const pedirLotes = incluir?.lotes === true;
    const pedirMeta = incluir?.meta === true;

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
            setLotes([]);
            setMetaSemana(null);
            setLoading(false);
            return;
        }

        if (isBackground && enVuelo.current > 0) return;

        const miSecuencia = ++secuencia.current;
        enVuelo.current += 1;
        if (!isBackground) setLoading(true);

        const total = semanaIds.length * ((pedirProduccion ? 1 : 0) + (pedirParos ? 1 : 0) + (pedirLotes ? 1 : 0));
        if (semanaIds.length > UMBRAL_AVISO_SEMANAS) {
            console.warn(`[useDatosPorSemana] ${semanaIds.length} semanas -> ${total} requests al backend`);
        }

        try {
            const [listaProduccion, listaParos, listaLotes, meta] = await Promise.all([
                pedirProduccion
                    ? Promise.all(semanaIds.map(id => ApiService.getProduccionBySemana(id)))
                        .then(res => res.flatMap(d => toArray<RegistroProduccion>(d, 'id_produccion')))
                    : Promise.resolve([]),
                pedirParos
                    ? Promise.all(semanaIds.map(id => ApiService.getParosBySemana(id)))
                        .then(res => res.flatMap(d => toArray<RegistroParoDashboard>(d, 'id_registro_paro')))
                    : Promise.resolve([]),
                pedirLotes
                    ? Promise.all(semanaIds.map(id => ApiService.getLotesBySemana(id)))
                        .then(res => res.flat())
                    : Promise.resolve([]),
                pedirMeta && semanaIds.length === 1
                    ? ApiService.getLotesBySemanaContMetaProcesados(semanaIds[0])
                    : Promise.resolve(null)
            ]);

            if (miSecuencia !== secuencia.current) return;

            if (pedirProduccion) setProduccion(listaProduccion);
            if (pedirParos) setParos(listaParos);
            if (pedirLotes) setLotes(listaLotes);
            if (pedirMeta) setMetaSemana(meta);
        } catch (error) {
            console.error('[useDatosPorSemana] Error cargando datos por semana:', error);
        } finally {
            enVuelo.current = Math.max(0, enVuelo.current - 1);
            if (miSecuencia === secuencia.current && !isBackground) setLoading(false);
        }
    }, [pedirProduccion, pedirParos, pedirLotes, pedirMeta]);

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

    return { produccion, paros, lotes, metaSemana, loading, recargar };
}
