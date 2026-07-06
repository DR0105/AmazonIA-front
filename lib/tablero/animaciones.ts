/**
 * Tiempos de animación centralizados del Tablero_De_Cartas.
 * Estos valores se usan como `transition.duration` (en ms) de framer-motion.
 *
 * Feature: tablero-cartas-juego
 */
export const ANIM = {
  /** Despliegue de la Mano_Desplegada: <= 500 ms (Req 2.2). */
  DESPLIEGUE_MS: 500,
  /** Traslado de cartas restantes a la Pila_De_Descarte: <= 600 ms (Req 3.4). */
  DESCARTE_MS: 600,
  /** Transición de la Barra_De_Estado: <= 400 ms (Req 4.8). */
  BARRA_MS: 400,
} as const;
