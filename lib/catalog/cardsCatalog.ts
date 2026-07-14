/**
 * Catálogo estático de cartas con metadatos adicionales para el modal informativo.
 * Los datos provienen de assets/cards.amazonas_mvp.json del engine.
 */

export interface CardMeta {
  id: string;
  rulesText: string;
  type: string;
  sector: string;
  cost: { money: number; people: number; land: number };
  requires: string[];
}

/** Traducciones de tipo de carta */
const TIPO_ES: Record<string, string> = {
  structure: 'Estructura',
  action:    'Acción',
  project:   'Proyecto',
  policy:    'Política',
};

export function traducirTipo(tipo: string): string {
  return TIPO_ES[tipo.toLowerCase()] ?? tipo;
}

const RAW: CardMeta[] = [
  { id: 'livestock',               rulesText: 'Carta inicial. Acelera Industria y aumenta su impacto ambiental.',                                           type: 'structure', sector: 'industry',   cost: { money: 0, people: 0, land: 0 }, requires: [] },
  { id: 'extractive_expansion',    rulesText: 'Gana dinero rápido a cambio de aumentar mucho la deforestación.',                                            type: 'action',    sector: 'industry',   cost: { money: 1, people: 0, land: 0 }, requires: ['livestock'] },
  { id: 'processing_plant',        rulesText: 'Industria produce más dinero, pero aumenta su impacto ambiental.',                                           type: 'structure', sector: 'industry',   cost: { money: 2, people: 0, land: 1 }, requires: ['territory_opening'] },
  { id: 'intensive_livestock',     rulesText: 'Acelera Industria y con ella sus beneficios e impactos.',                                                    type: 'structure', sector: 'industry',   cost: { money: 2, people: 0, land: 0 }, requires: ['livestock'] },
  { id: 'solar_industry',          rulesText: 'Acelera Industria y reduce su impacto ambiental.',                                                           type: 'structure', sector: 'industry',   cost: { money: 3, people: 0, land: 1 }, requires: ['sustainable_infrastructure'] },
  { id: 'energy_transition',       rulesText: 'Proyecto clave para la ruta de Transición sostenible.',                                                      type: 'project',   sector: 'industry',   cost: { money: 4, people: 2, land: 0 }, requires: ['solar_industry'] },
  { id: 'circular_economy',        rulesText: 'Cada producción industrial recupera parte del daño ambiental.',                                              type: 'structure', sector: 'industry',   cost: { money: 3, people: 1, land: 0 }, requires: ['intensive_livestock'] },
  { id: 'local_community',         rulesText: 'Acelera Población, que exige sostenimiento con mayor frecuencia.',                                           type: 'structure', sector: 'population', cost: { money: 1, people: 0, land: 0 }, requires: [] },
  { id: 'local_economy',           rulesText: 'Cuando Población produce, también genera dinero.',                                                           type: 'structure', sector: 'population', cost: { money: 2, people: 1, land: 0 }, requires: ['local_community'] },
  { id: 'community_health',        rulesText: 'Reduce presión social y deja un hito de Bienestar social.',                                                  type: 'action',    sector: 'population', cost: { money: 1, people: 0, land: 0 }, requires: ['sustainable_infrastructure'] },
  { id: 'environmental_education', rulesText: 'Reduce riesgos sociales y ambientales leves.',                                                               type: 'policy',    sector: 'population', cost: { money: 0, people: 2, land: 0 }, requires: ['local_community'] },
  { id: 'community_guard',         rulesText: 'Protege territorio y reduce tala ilegal y conflicto armado.',                                                type: 'structure', sector: 'population', cost: { money: 0, people: 2, land: 1 }, requires: ['territory_opening'] },
  { id: 'community_agreement',     rulesText: 'Proyecto clave para la ruta de Restauración del Amazonas.',                                                  type: 'project',   sector: 'population', cost: { money: 0, people: 2, land: 2 }, requires: ['territory_opening', 'local_community'] },
  { id: 'territory_opening',       rulesText: 'Activa Territorio, pero abre riesgo ambiental y territorial.',                                               type: 'action',    sector: 'territory',  cost: { money: 1, people: 0, land: 0 }, requires: [] },
  { id: 'rural_cadastre',          rulesText: 'Reduce tenencia ilegal y mejora el control del territorio.',                                                  type: 'policy',    sector: 'territory',  cost: { money: 2, people: 0, land: 0 }, requires: ['territory_opening'] },
  { id: 'satellite_monitoring',    rulesText: 'Acelera Territorio y reduce tala ilegal.',                                                                   type: 'structure', sector: 'territory',  cost: { money: 2, people: 1, land: 0 }, requires: ['territory_opening'] },
  { id: 'collective_titling',      rulesText: 'Proyecto territorial clave para Restauración del Amazonas.',                                                  type: 'project',   sector: 'territory',  cost: { money: 0, people: 2, land: 2 }, requires: ['rural_cadastre'] },
  { id: 'territorial_control',     rulesText: 'Bloquea futuros eventos de tenencia ilegal.',                                                                type: 'policy',    sector: 'territory',  cost: { money: 2, people: 1, land: 0 }, requires: ['territory_opening'] },
  { id: 'sustainable_infrastructure', rulesText: 'Territorio produce sin aumentar deforestación.',                                                         type: 'structure', sector: 'territory',  cost: { money: 4, people: 0, land: 2 }, requires: ['territory_opening'] },
  { id: 'activate_ecosystems',     rulesText: 'Activa el sector Ecosistemas.',                                                                              type: 'action',    sector: 'ecosystems', cost: { money: 1, people: 0, land: 1 }, requires: ['territory_opening'] },
  { id: 'restauracion_riberena',   rulesText: 'Ecosistemas reduce más deforestación al producir.',                                                          type: 'structure', sector: 'ecosystems', cost: { money: 0, people: 1, land: 1 }, requires: ['activate_ecosystems'] },
  { id: 'biodiversity_corridors',  rulesText: 'Protege biodiversidad y avanza Restauración.',                                                               type: 'project',   sector: 'ecosystems', cost: { money: 0, people: 2, land: 2 }, requires: ['restauracion_riberena'] },
  { id: 'community_reforestation', rulesText: 'Reduce deforestación inmediatamente.',                                                                       type: 'action',    sector: 'ecosystems', cost: { money: 1, people: 2, land: 0 }, requires: ['activate_ecosystems'] },
  { id: 'amazon_bioeconomy',       rulesText: 'Ecosistemas produce dinero limpio adicional.',                                                               type: 'structure', sector: 'ecosystems', cost: { money: 2, people: 0, land: 1 }, requires: ['activate_ecosystems'] },
  { id: 'pollinator_protection',   rulesText: 'Bloquea futuros eventos de declive de polinizadores.',                                                       type: 'policy',    sector: 'ecosystems', cost: { money: 0, people: 2, land: 1 }, requires: ['activate_ecosystems'] },
  { id: 'integral_reserve',        rulesText: 'Proyecto fuerte de restauración que bloquea eventos ambientales menores.',                                   type: 'project',   sector: 'ecosystems', cost: { money: 0, people: 2, land: 3 }, requires: ['biodiversity_corridors'] },
  { id: 'citizen_oversight',       rulesText: 'Bloquea futuros eventos de corrupción.',                                                                     type: 'policy',    sector: 'global',     cost: { money: 0, people: 2, land: 0 }, requires: [] },
  { id: 'peace_agreements',        rulesText: 'Bloquea futuros eventos de conflicto armado.',                                                               type: 'policy',    sector: 'global',     cost: { money: 2, people: 2, land: 0 }, requires: ['local_community'] },
  { id: 'amazon_governance',       rulesText: 'Reduce mal gobierno y aporta a Transición sostenible y Bienestar social.',                                   type: 'project',   sector: 'global',     cost: { money: 3, people: 2, land: 1 }, requires: ['citizen_oversight', 'territorial_control'] },
  { id: 'restoration_fund',        rulesText: 'Cada producción de Ecosistemas reduce deforestación adicional.',                                             type: 'policy',    sector: 'global',     cost: { money: 3, people: 0, land: 0 }, requires: ['activate_ecosystems'] },
];

const MAP = new Map<string, CardMeta>(RAW.map(c => [c.id, c]));

export function getCardMeta(id: string): CardMeta | null {
  return MAP.get(id) ?? null;
}

/** Nombre legible de una carta por id */
export function getNombreCarta(id: string): string {
  return MAP.get(id)?.id.replace(/_/g, ' ') ?? id;
}
