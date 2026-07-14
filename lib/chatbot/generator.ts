/**
 * generator.ts
 * Construye el prompt RAG y llama a Gemini Flash para generar la respuesta.
 * El bot SOLO puede afirmar lo que está en el contexto recuperado.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Contexto, ContextoHistorico, ContextoPrediccion } from './retriever';
import type { Prediccion } from './dataLoader';

const MESES_ES: Record<number, string> = {
  1:'Enero',2:'Febrero',3:'Marzo',4:'Abril',5:'Mayo',6:'Junio',
  7:'Julio',8:'Agosto',9:'Septiembre',10:'Octubre',11:'Noviembre',12:'Diciembre',
};

export interface RespuestaChat {
  respuesta:  string;
  evidencia:  EvidenciaItem[];
  fuente:     string;
  tieneDatos: boolean;
}

export interface EvidenciaItem {
  descripcion: string;
  valor:       string | number;
  fuente:      string;
}

// ─── Cliente Gemini (singleton) ───────────────────────────────────────────────

let _gemini: GoogleGenerativeAI | null = null;

function getGemini(): GoogleGenerativeAI {
  if (!_gemini) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error('GEMINI_API_KEY no configurada en .env.local');
    _gemini = new GoogleGenerativeAI(key);
  }
  return _gemini;
}

// ─── Generación de respuesta ──────────────────────────────────────────────────

export async function generarRespuesta(
  pregunta: string,
  contexto: Contexto,
): Promise<RespuestaChat> {

  if (contexto.tipo === 'sin_datos') {
    return {
      respuesta:  `No encontré información sobre eso en los datos disponibles. Los datos cubren los 10 departamentos de la Amazonía y Orinoquía colombiana (Caquetá, Meta, Guaviare, Vichada, Putumayo, Amazonas, Vaupés, Guainía, Nariño y Cauca) desde enero de 2017 hasta la actualidad. ¿Puedes ser más específico sobre el departamento, municipio o período que te interesa?`,
      evidencia:  [],
      fuente:     'Sistema AmazonIA',
      tieneDatos: false,
    };
  }

  // Construir bloque de contexto para el prompt
  const { bloqueContexto, evidencia, fuente } = construirContexto(contexto);

  const prompt = `Eres AmazonIA, un asistente especializado en monitoreo de incendios forestales y deforestación en la Amazonía y Orinoquía colombiana.

REGLA FUNDAMENTAL: Solo puedes afirmar información que esté explícitamente en los DATOS PROPORCIONADOS. Si algo no está en los datos, di que no tienes esa información. No inventes cifras, tendencias ni conclusiones.

DATOS PROPORCIONADOS:
${bloqueContexto}

FUENTE DE LOS DATOS: ${fuente}

PREGUNTA DEL USUARIO: ${pregunta}

Responde en español, de forma concisa (máximo 4 oraciones). Cita los números exactos de los datos. Si los datos muestran algo preocupante, mencionalo brevemente. Termina siempre indicando la fuente.`;

  try {
    const model = getGemini().getGenerativeModel({ model: 'gemini-1.5-flash-latest' });
    const result = await model.generateContent(prompt);
    const texto = result.response.text().trim();

    return { respuesta: texto, evidencia, fuente, tieneDatos: true };
  } catch (err: unknown) {
    // Fallback determinístico si Gemini falla
    const errMsg = err instanceof Error ? err.message : String(err);
    console.error('[chatbot] Error Gemini:', errMsg);
    return generarRespuestaFallback(contexto, evidencia, fuente);
  }
}

// ─── Construcción del bloque de contexto ─────────────────────────────────────

function construirContexto(contexto: Contexto): {
  bloqueContexto: string;
  evidencia: EvidenciaItem[];
  fuente: string;
} {
  const evidencia: EvidenciaItem[] = [];

  if (contexto.tipo === 'historico') {
    const { registros, totalFocos, query } = contexto;
    const lineas: string[] = [];

    if (registros.length > 0 && registros[0].anio === 0) {
      // Es un ranking — el label depende de si es "menos" o "más"
      const esMenos = query.esPreguntaMenos;
      const rankLabel = esMenos
        ? 'MUNICIPIOS CON MENOS FOCOS DE CALOR (orden de menor a mayor actividad):'
        : 'TOP MUNICIPIOS CON MÁS FOCOS DE CALOR (orden de mayor a menor actividad):';
      lineas.push(rankLabel);
      registros.forEach((r, i) => {
        lineas.push(`${i + 1}. ${r.municipio} (${r.departamento}): ${r.total_focos.toLocaleString('es-CO')} focos`);
        evidencia.push({ descripcion: `${r.municipio} (${r.departamento})`, valor: r.total_focos, fuente: 'CSV histórico SIATAC' });
      });
    } else {
      const filtroDesc = [
        query.departamento,
        query.municipio,
        query.anio?.toString(),
        query.mes ? MESES_ES[query.mes] : undefined,
      ].filter(Boolean).join(', ');

      lineas.push(`DATOS HISTÓRICOS${filtroDesc ? ` (${filtroDesc})` : ''}:`);
      lineas.push(`Total focos en el período: ${totalFocos.toLocaleString('es-CO')}`);
      lineas.push(`Registros encontrados: ${registros.length} combinaciones depto/municipio/mes`);
      lineas.push('');
      lineas.push('Detalle por municipio y mes:');
      registros.forEach(r => {
        const mesNombre = r.mes > 0 ? MESES_ES[r.mes] : '';
        const periodo = r.anio > 0 ? (mesNombre ? `${mesNombre} ${r.anio}` : `Año ${r.anio}`) : 'Total acumulado';
        lineas.push(`- ${r.municipio} (${r.departamento}), ${periodo}: ${r.total_focos.toLocaleString('es-CO')} focos`);
        evidencia.push({
          descripcion: `${r.municipio} (${r.departamento}) ${periodo}`,
          valor: r.total_focos,
          fuente: 'CSV histórico SIATAC',
        });
      });
    }

    return {
      bloqueContexto: lineas.join('\n'),
      evidencia,
      fuente: 'CSV puntos de calor SIATAC (datos.gov.co) · 2017–2026',
    };
  }

  // Predicciones
  const predCtx = contexto as ContextoPrediccion;
  const lineas: string[] = ['PREDICCIONES DE RIESGO PRÓXIMOS 6 MESES:'];

  predCtx.registros.forEach((p: Prediccion) => {
    const mesNombre = MESES_ES[p.mes] ?? `Mes ${p.mes}`;
    lineas.push(
      `- ${p.departamento}, ${mesNombre} ${p.anio}: ` +
      `${p.total_predicho} focos estimados (±${p.incertidumbre_estimada}), ` +
      `nivel de riesgo: ${p.riesgo_predicho.toUpperCase()}`
    );
    evidencia.push({
      descripcion: `${p.departamento} ${mesNombre} ${p.anio}`,
      valor: `${p.total_predicho} focos · Riesgo ${p.riesgo_predicho}`,
      fuente: 'predicciones.json · Modelo RandomForest AmazonIA',
    });
  });

  return {
    bloqueContexto: lineas.join('\n'),
    evidencia,
    fuente: 'Modelo predictivo AmazonIA (RandomForest, datos SIATAC 2017–2026)',
  };
}

// ─── Fallback sin LLM ─────────────────────────────────────────────────────────

function generarRespuestaFallback(
  contexto: Contexto,
  evidencia: EvidenciaItem[],
  fuente: string,
): RespuestaChat {
  if (contexto.tipo === 'historico') {
    const { registros, totalFocos, query } = contexto as ContextoHistorico;
    const esRanking = registros.length > 0 && registros[0].anio === 0;
    const labelActividad = query.esPreguntaMenos ? 'menor' : 'mayor';
    const texto = registros.length > 0
      ? (esRanking
          ? `El municipio con **${labelActividad} actividad** es **${registros[0].municipio}** con ${registros[0].total_focos} focos. Fuente: ${fuente}.`
          : `Encontré ${registros.length} registros con un total de **${totalFocos.toLocaleString('es-CO')} focos de calor**. ` +
            `El municipio con más actividad fue **${registros[0].municipio}** con ${registros[0].total_focos} focos. Fuente: ${fuente}.`)
      : 'No encontré registros para ese filtro.';
    return { respuesta: texto, evidencia, fuente, tieneDatos: true };
  }
  const pred = contexto as ContextoPrediccion;
  return {
    respuesta: `Encontré ${pred.registros.length} predicciones. Fuente: ${fuente}.`,
    evidencia,
    fuente,
    tieneDatos: true,
  };
}
