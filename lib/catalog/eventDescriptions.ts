/**
 * El backend no envía descripciones para los eventos del catálogo.
 * Este diccionario complementa la respuesta sin modificar sus datos de dominio.
 */
const DESCRIPCIONES_EVENTOS: Record<string, string> = {
  heat_wave:
    "El aumento sostenido de la temperatura amenaza la salud, los cultivos y los ecosistemas amazónicos.",
  pollinator_decline:
    "La disminución de polinizadores reduce la reproducción de plantas y pone en riesgo la producción de alimentos.",
  food_conflict:
    "La escasez y el encarecimiento de alimentos intensifican los conflictos sociales y territoriales.",
  amazon_collapse_warning:
    "La Amazonía se acerca a un punto de no retorno que puede alterar de forma irreversible su equilibrio ecológico.",
  fauna_extinction:
    "La pérdida de especies debilita el ecosistema y representa un colapso ambiental irreversible.",
  famine:
    "La falta de alimentos suficientes afecta directamente el bienestar y aumenta la presión social.",
  forest_fires:
    "Los incendios destruyen cobertura vegetal, liberan carbono y aceleran la deforestación.",
  illegal_logging:
    "La extracción ilegal de madera degrada el territorio y favorece la deforestación.",
  corruption:
    "La corrupción limita la capacidad de respuesta y desvía los recursos necesarios para proteger el territorio.",
  land_tenure_conflict:
    "La disputa por la tenencia de la tierra dificulta una gestión territorial justa y sostenible.",
  armed_conflict:
    "La violencia armada afecta a las comunidades y reduce la capacidad colectiva de proteger la Amazonía.",
  health_crisis:
    "Una crisis sanitaria exige recursos y puede incrementar la presión sobre las comunidades.",
};

export function getDescripcionEvento(id: string): string {
  return (
    DESCRIPCIONES_EVENTOS[id] ??
    "Evento del escenario que requiere atención para evitar sus consecuencias."
  );
}
