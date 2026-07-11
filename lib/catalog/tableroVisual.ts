/**
 * Estado visual del tablero.
 *
 * Modela el flujo de presentación:
 *   - La mano viene del backend (REPARTIR_MANO_BACK).
 *   - Al seleccionar una carta, las restantes van al descarte.
 *   - El mazo local ya no se usa (deckCount viene del back).
 *
 * Fases: idle → desplegada → resolviendo → idle.
 */

import type { CartaJugable, SectorId } from "@/types/tablero";

export type FaseVisual = "idle" | "desplegada" | "resolviendo";

export interface EstadoVisual {
  /** Cartas actualmente en la mano visual (las que se muestran en los slots). */
  mano: CartaJugable[];
  /** Cartas acumuladas en la pila de descarte (lado derecho). */
  descarte: CartaJugable[];
  /** Cartas colocadas por sector (activeCards del back, solo visual). */
  sectores: Partial<Record<SectorId, CartaJugable[]>>;
  fase: FaseVisual;
  /** Mazo local vacío — el conteo real viene de state.cards.deckCount del back. */
  mazo: CartaJugable[];
}

export type AccionVisual =
  | { tipo: "INICIALIZAR"; cartas: CartaJugable[] }
  /** Recibe la mano ya definida por el backend y la despliega visualmente. */
  | { tipo: "REPARTIR_MANO_BACK"; cartas: CartaJugable[] }
  | { tipo: "SELECCIONAR"; cartaId: string }
  | { tipo: "FINALIZAR" };

export const estadoVisualInicial: EstadoVisual = {
  mazo: [],
  mano: [],
  descarte: [],
  sectores: {},
  fase: "idle",
};

export function tableroVisualReducer(
  estado: EstadoVisual,
  accion: AccionVisual,
): EstadoVisual {
  switch (accion.tipo) {
    case "INICIALIZAR":
      return {
        ...estadoVisualInicial,
      };

    case "REPARTIR_MANO_BACK": {
      // Solo despliega si estamos en idle y la mano tiene cartas
      if (estado.fase !== "idle" || accion.cartas.length === 0) return estado;
      return {
        ...estado,
        mano: accion.cartas,
        fase: "desplegada",
      };
    }

    case "SELECCIONAR": {
      if (estado.fase !== "desplegada") return estado;
      const elegida = estado.mano.find((c) => c.id === accion.cartaId);
      if (!elegida) return estado;
      // Las cartas restantes se quedan en la mano; solo se quita la elegida
      const manoSinElegida = estado.mano.filter((c) => c.id !== accion.cartaId);
      return {
        ...estado,
        mano: manoSinElegida,
        sectores: {
          ...estado.sectores,
          [elegida.sector]: [
            ...(estado.sectores[elegida.sector] ?? []),
            elegida,
          ],
        },
        fase: "resolviendo",
      };
    }

    case "FINALIZAR":
      if (estado.fase !== "resolviendo") return estado;
      // Vuelve a idle; la mano se actualizará desde el back en el próximo render
      return { ...estado, mano: [], fase: "idle" };

    default:
      return estado;
  }
}
