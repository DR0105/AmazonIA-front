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
  cost?: { money: number; people: number; land: number };
  requires?: string[];
  rulesText?: string;
}

/** Recursos que un evento requiere o pierde. */
export interface RecursosEventoCatalogo {
  money: number;
  people: number;
  land: number;
}

/** Efecto configurable de un evento del catálogo. */
export interface EfectoEventoCatalogo {
  trigger: string;
  type: string;
  amount?: number;
  reason?: string;
}

/** Evento tal como llega del endpoint `/api/v1/catalog`. */
export interface EventoCatalogo {
  id: string;
  name: string;
  category: string;
  initialRounds: number;
  solution: RecursosEventoCatalogo;
  solveEffects: EfectoEventoCatalogo[];
  expirationLoss: RecursosEventoCatalogo;
  expirationEffects: EfectoEventoCatalogo[];
  cannotPayEffects: EfectoEventoCatalogo[];
  recurring: boolean;
  terminal: boolean;
  baseProbability: number;
  minDeforestation: number;
  minPeople: number;
  cooldownRounds: number;
  requiresSector?: SectorId;
}

/** Evento enriquecido con texto para la interfaz. */
export interface EventoConDescripcion extends EventoCatalogo {
  description: string;
}

/** Respuesta del catálogo. */
export interface RespuestaCatalogo {
  cards: CartaCatalogo[];
  events: EventoCatalogo[];
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
  costo?: { money: number; people: number; land: number };
  requisitos?: string[];
  descripcion?: string;
}
