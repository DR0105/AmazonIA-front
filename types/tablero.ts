/**
 * Modelos del Tablero de Cartas (versión visual conectada al catálogo del back).
 *
 * El tablero ya NO tiene lógica de juego (sin barra, sin efectos, sin puntaje).
 * Solo reparte cartas del catálogo real y las muestra como imágenes emparejadas
 * por `id` con los archivos de `assets/cards`.
 */

import type { StaticImageData } from "next/image";

/** Los cinco sectores del catálogo (tal como los expone el endpoint). */
export type SectorId =
  | "industry"
  | "population"
  | "territory"
  | "ecosystems"
  | "global";

/** Orden fijo de los sectores en el tablero. */
export const ORDEN_SECTORES: readonly SectorId[] = [
  "industry",
  "population",
  "territory",
  "ecosystems",
  "global",
] as const;

/** Etiquetas legibles de cada sector. */
export const ETIQUETAS_SECTOR: Record<SectorId, string> = {
  industry: "Industria",
  population: "Población",
  territory: "Territorio",
  ecosystems: "Ecosistemas",
  global: "Gobernanza Global",
};

/** Carta tal como llega del endpoint `/api/v1/catalog` (solo los campos usados). */
export interface CartaCatalogo {
  id: string;
  name: string;
  type: string;
  sector: SectorId;
}

/** Respuesta del catálogo. */
export interface RespuestaCatalogo {
  cards: CartaCatalogo[];
}

/**
 * Carta jugable = carta del catálogo que TIENE una imagen en `assets/cards`.
 * Es la unidad que se muestra en el tablero.
 */
export interface CartaJugable {
  id: string;
  nombre: string;
  sector: SectorId;
  tipo: string;
  imagen: StaticImageData;
}
