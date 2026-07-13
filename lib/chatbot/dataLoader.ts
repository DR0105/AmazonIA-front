/**
 * dataLoader.ts
 * Carga y cachea los datos del chatbot una sola vez al arrancar el servidor.
 * Las coordenadas del CSV se descartan — el bot no las necesita.
 */

import { readFile } from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'public', 'data');

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface RegistroHistorico {
  anio:         number;
  mes:          number;
  semana_mes:   number;
  departamento: string;
  municipio:    string;
  paisaje:      string;
  conteo_puntos: number;
}

export interface RegistroAgregado {
  departamento: string;
  municipio:    string;
  anio:         number;
  mes:          number;
  total_focos:  number;
}

export interface Prediccion {
  anio:                  number;
  mes:                   number;
  departamento:          string;
  total_predicho:        number;
  incertidumbre_estimada: number;
  riesgo_predicho:       'bajo' | 'medio' | 'alto';
}

export interface PrediccionesData {
  metadata: {
    metricas_globales?: { accuracy_riesgo?: number; mae?: number; r2?: number };
    umbrales_riesgo?: Record<string, { bajo: string; medio: string; alto: string }>;
  };
  predicciones_proximos_6_meses: Prediccion[];
  puntos_alto_riesgo: Array<{
    departamento: string;
    mes: number;
    anio_prediccion: number;
    total_puntos_historicos: number;
  }>;
}

// ─── Singleton en memoria ─────────────────────────────────────────────────────

let _historico: RegistroAgregado[] | null = null;
let _predicciones: PrediccionesData | null = null;

/** Fuerza recarga de datos (útil en desarrollo) */
export function resetCache() {
  _historico    = null;
  _predicciones = null;
}

export async function getHistorico(): Promise<RegistroAgregado[]> {
  if (_historico) {
    console.log(`[dataLoader] usando caché: ${_historico.length} registros`);
    return _historico;
  }

  const csvPath = path.join(DATA_DIR, 'puntos_calor_por_semana_mes_con_coordenadas.csv');
  console.log('[dataLoader] leyendo CSV desde:', csvPath);

  // Fallback graceful si el CSV no existe (ej. Vercel sin datos locales)
  const { access } = await import('fs/promises');
  try { await access(csvPath); } catch {
    console.warn('[dataLoader] CSV no encontrado — datos históricos no disponibles en este entorno');
    _historico = [];
    return _historico;
  }

  const raw = await readFile(csvPath, 'utf-8');
  const lines = raw.trim().split('\n');
  const headers = lines[0].split(',');

  // Índices de columnas que nos interesan (sin coordenadas_json ni precip_mm)
  const idx = {
    anio:         headers.indexOf('anio'),
    mes:          headers.indexOf('mes'),
    semana_mes:   headers.indexOf('semana_mes'),
    departamento: headers.indexOf('departamento'),
    municipio:    headers.indexOf('municipio'),
    paisaje:      headers.indexOf('paisaje'),
    conteo:       headers.indexOf('conteo_puntos'),
  };

  // Acumular por (departamento, municipio, anio, mes) — nivel de granularidad útil
  const mapaAgregado = new Map<string, RegistroAgregado>();

  for (let i = 1; i < lines.length; i++) {
    // El CSV tiene coordenadas_json con comas internas entre corchetes — usar split seguro
    const line = lines[i];
    if (!line.trim()) continue;

    // Parseo simple: separar por coma respetando comillas
    const cols = parseCsvLine(line);
    if (cols.length < 7) continue;

    const dpto = cols[idx.departamento]?.trim().toUpperCase();
    const muni = cols[idx.municipio]?.trim().toUpperCase();
    const anio = parseInt(cols[idx.anio]);
    const mes  = parseInt(cols[idx.mes]);
    const cont = parseInt(cols[idx.conteo]) || 0;

    if (!dpto || !muni || isNaN(anio) || isNaN(mes)) continue;

    const key = `${dpto}|${muni}|${anio}|${mes}`;
    const existing = mapaAgregado.get(key);
    if (existing) {
      existing.total_focos += cont;
    } else {
      mapaAgregado.set(key, { departamento: dpto, municipio: muni, anio, mes, total_focos: cont });
    }
  }

  _historico = Array.from(mapaAgregado.values());
  console.log(`[chatbot] CSV cargado: ${_historico.length} registros (depto+muni+año+mes)`);
  return _historico;
}

export async function getPredicciones(): Promise<PrediccionesData> {
  if (_predicciones) return _predicciones;

  const jsonPath = path.join(DATA_DIR, 'predicciones.json');
  const raw = await readFile(jsonPath, 'utf-8');
  _predicciones = JSON.parse(raw) as PrediccionesData;
  console.log(`[chatbot] Predicciones cargadas: ${_predicciones.predicciones_proximos_6_meses.length} registros`);
  return _predicciones;
}

// ─── Helper: parseo de línea CSV respetando comillas ─────────────────────────
function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}
