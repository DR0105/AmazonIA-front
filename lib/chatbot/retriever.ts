/**
 * retriever.ts
 * Extrae entidades de la pregunta y recupera registros relevantes.
 * No usa TF-IDF completo: las preguntas sobre focos de calor siempre
 * mencionan lugar y/o fecha, así que keyword matching es suficiente.
 */

import { getHistorico, getPredicciones, RegistroAgregado, Prediccion } from './dataLoader';

const MESES_ES: Record<string, number> = {
  enero:1, febrero:2, marzo:3, abril:4, mayo:5, junio:6,
  julio:7, agosto:8, septiembre:9, octubre:10, noviembre:11, diciembre:12,
  jan:1, feb:2, mar:3, apr:4, may:5, jun:6,
  jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
};

const DEPTOS_CONOCIDOS = [
  'AMAZONAS','CAQUETÁ','CAQUETA','CAUCA','GUAINÍA','GUAINIA',
  'GUAVIARE','META','NARIÑO','NARINO','PUTUMAYO','VAUPÉS','VAUPES','VICHADA',
];

// ─── Tipos de resultado ───────────────────────────────────────────────────────

export interface ContextoHistorico {
  tipo:           'historico';
  registros:      RegistroAgregado[];
  totalFocos:     number;
  query:          QueryParseada;
}

export interface ContextoPrediccion {
  tipo:           'prediccion';
  registros:      Prediccion[];
  query:          QueryParseada;
}

export interface ContextoVacio {
  tipo:           'sin_datos';
  query:          QueryParseada;
}

export type Contexto = ContextoHistorico | ContextoPrediccion | ContextoVacio;

export interface QueryParseada {
  texto:          string;
  departamento?:  string;
  municipio?:     string;
  anio?:          number;
  mes?:           number;
  esPreguntaPrediccion: boolean;
  esPreguntaTop:  boolean;
  esPreguntaMenos: boolean;
}

// ─── Parseo de la pregunta ────────────────────────────────────────────────────

export function parsearQuery(pregunta: string): QueryParseada {
  const texto = pregunta.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  const original = pregunta.toUpperCase();

  // ¿Es sobre predicciones/futuro?
  const esPreguntaPrediccion = /predic|prox|siguient|futuro|6 mes|seis mes|estimad|riesgo|alerta/.test(texto);

  // ¿Es "top" (más) o "bottom" (menos)?
  const esPreguntaTop    = /mas focos|mayor activ|top|ranking|mas incendio|mayor numero/.test(texto);
  const esPreguntaMenos  = /menos focos|menor activ|menos incendio|menor numero|minimo|poca activ|bajo activ/.test(texto);

  // Año — solo capturar si NO hay "desde", "partir", "para acá" que indique rango
  const esRangoDesde = /desde|partir|para aca|para acá|hasta hoy|hasta ahora|historico|historica/.test(texto);
  const anioMatch = pregunta.match(/\b(201[7-9]|202[0-6])\b/);
  const anio = (anioMatch && !esRangoDesde) ? parseInt(anioMatch[1]) : undefined;

  // Mes
  let mes: number | undefined;
  for (const [nombre, num] of Object.entries(MESES_ES)) {
    if (texto.includes(nombre)) { mes = num; break; }
  }

  // Departamento — búsqueda robusta: normalizar todo y buscar con word boundary
  let departamento: string | undefined;
  const deptoMap: [string, string][] = [
    ['AMAZONAS',  'amazonas'],
    ['CAQUETÁ',   'caqueta'],
    ['CAUCA',     'cauca'],
    ['GUAINÍA',   'guainia'],
    ['GUAVIARE',  'guaviare'],
    ['META',      'meta'],
    ['NARIÑO',    'narino'],
    ['PUTUMAYO',  'putumayo'],
    ['VAUPÉS',    'vaupes'],
    ['VICHADA',   'vichada'],
  ];
  // texto ya está normalizado (sin tildes) y en minúsculas
  for (const [canon, v] of deptoMap) {
    const idx = texto.indexOf(v);
    if (idx === -1) continue;
    const before = idx > 0 ? texto[idx - 1] : ' ';
    const after  = idx + v.length < texto.length ? texto[idx + v.length] : ' ';
    if (/\W/.test(before) && /\W/.test(after)) {
      departamento = canon;
      break;
    }
  }

  // Municipio — solo capturar cuando hay un nombre propio claro, no frases genéricas
  let municipio: string | undefined;
  // Pattern: "en [Ciudad]" o "de [Ciudad]" donde Ciudad son 1-2 palabras capitalizadas
  // Solo en la pregunta original (sin normalizar) para detectar mayúsculas
  const municipioPatterns = [
    /en\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)\s*(?:en\s+20|\?|$)/,
    /municipio\s+(?:de\s+)?([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)/i,
    /de\s+([A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]{4,}(?:\s+[A-ZÁÉÍÓÚÑÜ][a-záéíóúñü]+)?)\s*(?:\?|$)/,
  ];
  const deptoNombres = new Set(['Amazonas','Caquetá','Cauca','Guainía','Guaviare','Meta','Nariño','Putumayo','Vaupés','Vichada',
    'amazonas','caqueta','cauca','guainia','guaviare','meta','narino','putumayo','vaupes','vichada']);
  const verbos = new Set(['Muéstrame','Dime','Dame','Cuántos','Cuántas','Qué','Cuál','Cómo','Hay','Hubo','Ver','Ver']);
  
  for (const pat of municipioPatterns) {
    const m = pregunta.match(pat);
    if (m) {
      const candidato = m[1].trim();
      const palabras = candidato.split(/\s+/);
      // Verificar que no sea un departamento ni un verbo ni una frase genérica
      const esDepto = palabras.some(p => deptoNombres.has(p));
      const esVerbo = verbos.has(palabras[0]);
      const esFrase = palabras.length > 4;
      if (!esDepto && !esVerbo && !esFrase && candidato.length > 4) {
        municipio = candidato.toUpperCase();
        break;
      }
    }
  }

  return { texto: pregunta, departamento, municipio, anio, mes, esPreguntaPrediccion, esPreguntaTop, esPreguntaMenos };
}

// ─── Recuperación del contexto ────────────────────────────────────────────────

export async function recuperarContexto(pregunta: string): Promise<Contexto> {
  const query = parsearQuery(pregunta);

  if (query.esPreguntaPrediccion) {
    return recuperarPredicciones(query);
  }
  return recuperarHistorico(query);
}

async function recuperarHistorico(query: QueryParseada): Promise<ContextoHistorico | ContextoVacio> {
  const historico = await getHistorico();

  let filtrado = historico;

  if (query.departamento) {
    filtrado = filtrado.filter(r => r.departamento === query.departamento);
  }
  if (query.municipio) {
    const conMunicipio = filtrado.filter(r => r.municipio.includes(query.municipio!));
    if (conMunicipio.length > 0) filtrado = conMunicipio;
  }
  if (query.anio) {
    filtrado = filtrado.filter(r => r.anio === query.anio);
  }
  if (query.mes) {
    filtrado = filtrado.filter(r => r.mes === query.mes);
  }

  if (filtrado.length === 0) return { tipo: 'sin_datos', query };

  // SIEMPRE agregar por municipio para mostrar totales reales
  // (el CSV tiene filas por semana/mes; hay que sumar todo el período)
  const porMunicipio = new Map<string, { departamento: string; total: number }>();
  for (const r of filtrado) {
    const k = r.municipio;
    const ex = porMunicipio.get(k);
    if (ex) {
      ex.total += r.total_focos;
    } else {
      porMunicipio.set(k, { departamento: r.departamento, total: r.total_focos });
    }
  }

  // Ordenar según el tipo de pregunta
  const ordenados = Array.from(porMunicipio.entries())
    .sort((a, b) => query.esPreguntaMenos ? a[1].total - b[1].total : b[1].total - a[1].total);

  // Para preguntas de ranking mostrar top 5; para preguntas generales top 15
  const limite = (query.esPreguntaTop || query.esPreguntaMenos) ? 5 : 15;
  const muestra = ordenados.slice(0, limite);

  const registros: RegistroAgregado[] = muestra.map(([muni, v]) => ({
    municipio:    muni,
    departamento: v.departamento,
    anio:         query.anio ?? 0,
    mes:          query.mes ?? 0,
    total_focos:  v.total,
  }));

  const totalFocos = ordenados.reduce((s, [, v]) => s + v.total, 0);

  return { tipo: 'historico', registros, totalFocos, query };
}

async function recuperarPredicciones(query: QueryParseada): Promise<ContextoPrediccion | ContextoVacio> {
  const { predicciones_proximos_6_meses } = await getPredicciones();

  let filtrado = predicciones_proximos_6_meses;

  if (query.departamento) {
    filtrado = filtrado.filter(p => p.departamento === query.departamento);
  }
  if (query.mes) {
    filtrado = filtrado.filter(p => p.mes === query.mes);
  }
  if (query.anio) {
    filtrado = filtrado.filter(p => p.anio === query.anio);
  }

  if (filtrado.length === 0) {
    return { tipo: 'sin_datos', query };
  }

  return { tipo: 'prediccion', registros: filtrado, query };
}

// ─── Normalización de departamentos ──────────────────────────────────────────

function normalizarDepto(d: string): string {
  const MAP: Record<string, string> = {
    'CAQUETA': 'CAQUETÁ', 'GUAINIA': 'GUAINÍA',
    'NARINO': 'NARIÑO', 'VAUPES': 'VAUPÉS',
  };
  return MAP[d] ?? d;
}
