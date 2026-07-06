/**
 * Estado visual del tablero (sin lógica de juego).
 *
 * Solo modela el flujo de presentación: barajar el mazo, repartir la mano,
 * elegir una carta (que se coloca en su sector) y enviar las demás al descarte.
 * No hay barra, ni efectos, ni puntaje.
 *
 * Fases: idle → desplegada → resolviendo → idle.
 */

import type { CartaJugable, SectorId } from "@/types/tablero";

export type FaseVisual = "idle" | "desplegada" | "resolviendo";

export interface EstadoVisual {
  mazo: CartaJugable[];
  mano: CartaJugable[];
  descarte: CartaJugable[];
  sectores: Partial<Record<SectorId, CartaJugable[]>>;
  fase: FaseVisual;
}

export type AccionVisual =
  | { tipo: "INICIALIZAR"; cartas: CartaJugable[] }
  | { tipo: "REPARTIR" }
  | { tipo: "SELECCIONAR"; cartaId: string }
  | { tipo: "FINALIZAR" };

/** Tamaño objetivo de la mano al repartir. */
export const CARTAS_POR_MANO = 5;

export const estadoVisualInicial: EstadoVisual = {
  mazo: [],
  mano: [],
  descarte: [],
  sectores: {},
  fase: "idle",
};

/** Baraja una copia del arreglo (Fisher-Yates). Puro: no muta la entrada. */
export function barajar<T>(entrada: readonly T[]): T[] {
  const copia = [...entrada];
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copia[i], copia[j]] = [copia[j], copia[i]];
  }
  return copia;
}

export function tableroVisualReducer(
  estado: EstadoVisual,
  accion: AccionVisual
): EstadoVisual {
  switch (accion.tipo) {
    case "INICIALIZAR":
      return {
        mazo: barajar(accion.cartas),
        mano: [],
        descarte: [],
        sectores: {},
        fase: "idle",
      };

    case "REPARTIR": {
      if (estado.fase !== "idle" || estado.mazo.length === 0) return estado;
      const n = Math.min(CARTAS_POR_MANO, estado.mazo.length);
      return {
        ...estado,
        mano: estado.mazo.slice(0, n),
        mazo: estado.mazo.slice(n),
        fase: "desplegada",
      };
    }

    case "SELECCIONAR": {
      if (estado.fase !== "desplegada") return estado;
      const elegida = estado.mano.find((c) => c.id === accion.cartaId);
      if (!elegida) return estado;
      const restantes = estado.mano.filter((c) => c.id !== accion.cartaId);
      return {
        ...estado,
        mano: [],
        // la elegida ocupa su sector; las demás van al descarte (última arriba)
        sectores: {
          ...estado.sectores,
          [elegida.sector]: [
            ...(estado.sectores[elegida.sector] ?? []),
            elegida,
          ],
        },
        descarte: [...estado.descarte, ...restantes],
        fase: "resolviendo",
      };
    }

    case "FINALIZAR":
      if (estado.fase !== "resolviendo") return estado;
      return { ...estado, fase: "idle" };

    default:
      return estado;
  }
}
