"use client";

import { useState, useEffect } from 'react';

export interface Prediccion {
  anio: number;
  mes: number;
  departamento: string;
  total_predicho: number;
  incertidumbre_estimada: number;
  riesgo_predicho: 'bajo' | 'medio' | 'alto';
}

export interface PuntoAltoRiesgo {
  departamento: string;
  mes: number;
  anio_prediccion: number;
  anios_considerados: string;
  coordenadas: [number, number][];
  total_puntos_historicos: number;
}

export interface MetricasRegresion {
  mae: number;
  rmse: number;
  r2: number;
  accuracy_riesgo: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
  meses_evaluados_total?: number;
  meses_evaluados_por_departamento?: number;
}

export interface MetricasClasificacion {
  accuracy: number;
  precision_macro: number;
  recall_macro: number;
  f1_macro: number;
}

export interface MetricasDepto {
  mae?: number;
  rmse?: number;
  r2?: number;
  accuracy_riesgo?: number;
  precision_macro?: number;
  recall_macro?: number;
  f1_macro?: number;
  meses_evaluados?: number;
  promedio_historico_mensual?: number;
  nota?: string;
}

export interface PrediccionesData {
  metadata: {
    modelo: string;
    umbrales_riesgo: Record<string, { bajo: string; medio: string; alto: string }>;
    metricas_globales: MetricasRegresion;
    /** @deprecated use metricas_globales */
    metricas_regresion?: MetricasRegresion;
    /** @deprecated use metricas_globales */
    metricas_clasificacion_riesgo?: MetricasClasificacion;
    metricas_por_departamento: Record<string, MetricasDepto>;
    importancia_variables_media: Record<string, number>;
    importancia_variables_por_departamento: Record<string, Record<string, number>>;
    parametros: { horizonte_meses: number; meses_prueba_por_departamento: number };
  };
  predicciones_proximos_6_meses: Prediccion[];
  puntos_alto_riesgo: PuntoAltoRiesgo[];
}

interface UsePrediccionesResult {
  data: PrediccionesData | null;
  loading: boolean;
  error: string | null;
}

export function usePredicciones(): UsePrediccionesResult {
  const [data, setData] = useState<PrediccionesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchData() {
      try {
        const res = await fetch('/api/predicciones');
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json: PrediccionesData = await res.json();
        if (!cancelled) {
          setData(json);
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Error desconocido');
          setLoading(false);
        }
      }
    }

    fetchData();
    return () => { cancelled = true; };
  }, []);

  return { data, loading, error };
}
