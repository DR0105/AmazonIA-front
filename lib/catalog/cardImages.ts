/**
 * Mapa estático `id de carta → imagen`.
 *
 * El emparejamiento es directo: el nombre de archivo en `assets/cards` coincide
 * con el `id` de la carta en el catálogo (p. ej. `livestock` → `livestock.jpeg`).
 * Solo estas 18 cartas del catálogo tienen imagen; las demás se ignoran.
 *
 * Se usan imports estáticos (no `require` dinámico) para que Next optimice las
 * imágenes y entregue `StaticImageData` con dimensiones intrínsecas.
 */

import type { StaticImageData } from "next/image";

import circular_economy from "@/assets/cards/circular_economy.jpeg";
import community_agreement from "@/assets/cards/community_agreement.jpeg";
import community_guard from "@/assets/cards/community_guard.jpeg";
import community_health from "@/assets/cards/community_health.jpeg";
import energy_transition from "@/assets/cards/energy_transition.jpeg";
import environmental_education from "@/assets/cards/environmental_education.jpeg";
import extractive_expansion from "@/assets/cards/extractive_expansion.jpeg";
import intensive_livestock from "@/assets/cards/intensive_livestock.jpeg";
import livestock from "@/assets/cards/livestock.jpeg";
import local_community from "@/assets/cards/local_community.jpeg";
import local_economy from "@/assets/cards/local_economy.jpeg";
import pollinator_protection from "@/assets/cards/pollinator_protection.jpeg";
import restauracion_riberena from "@/assets/cards/restauracion_riberena.jpeg";
import rural_cadastre from "@/assets/cards/rural_cadastre.jpeg";
import satellite_monitoring from "@/assets/cards/satellite_monitoring.jpeg";
import solar_industry from "@/assets/cards/solar_industry.jpeg";
import sustainable_infrastructure from "@/assets/cards/sustainable_infrastructure.jpeg";
import territorial_control from "@/assets/cards/territorial_control.jpeg";

/** Diccionario `id → imagen`. La clave debe coincidir con el `id` del catálogo. */
export const CARD_IMAGES: Record<string, StaticImageData> = {
  circular_economy,
  community_agreement,
  community_guard,
  community_health,
  energy_transition,
  environmental_education,
  extractive_expansion,
  intensive_livestock,
  livestock,
  local_community,
  local_economy,
  pollinator_protection,
  restauracion_riberena,
  rural_cadastre,
  satellite_monitoring,
  solar_industry,
  sustainable_infrastructure,
  territorial_control,
};

/** Devuelve la imagen de una carta por su `id`, o `undefined` si no existe. */
export function getCardImage(id: string): StaticImageData | undefined {
  return CARD_IMAGES[id];
}
