"use client";

/**
 * ManoDesplegada — 5 slots "Cartas de esta ronda" en la franja inferior.
 *
 * Cuando la mano no está visible, muestra 5 slots fantasma con el estilo
 * pergamino (idénticos a los de la imagen de referencia). Al recibir cartas,
 * éstas aparecen con animación y son seleccionables.
 */

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ANIM } from "@/lib/tablero/animaciones";
import type { CartaJugable } from "@/types/tablero";
import { PARCHMENT } from "./TableroDeCartas";

export interface ManoDesplegadaProps {
  cartas: CartaJugable[];
  visible: boolean;
  interactiva: boolean;
  onSeleccionar: (id: string) => void;
}

// Dimensiones de cada slot/carta de la mano (más pequeñas que los sectores)
const ANCHO_SLOT = 104;
const ALTO_SLOT = 148;
const N_SLOTS = 5;

/** Slot vacío (placeholder) con estilo pergamino */
function SlotVacio({ index }: { index: number }) {
  return (
    <div
      key={`slot-${index}`}
      aria-hidden
      className="rounded-xl flex items-center justify-center flex-shrink-0"
      style={{
        width: ANCHO_SLOT,
        height: ALTO_SLOT,
        backgroundColor: PARCHMENT.slotBg,
        border: `2px solid ${PARCHMENT.slotBorder}`,
        boxShadow: "inset 0 1px 4px rgba(61,43,31,0.12)",
      }}
    >
      {/* Marca decorativa de carta vacía — igual que en la imagen de referencia */}
      <span
        className="text-3xl opacity-20"
        aria-hidden
        style={{ color: PARCHMENT.border }}
      >
        🌿
      </span>
    </div>
  );
}

export function ManoDesplegada({
  cartas,
  visible,
  interactiva,
  onSeleccionar,
}: ManoDesplegadaProps) {
  return (
    <div className="flex gap-3 items-end justify-center">
      {/* Siempre mostramos N_SLOTS posiciones */}
      {Array.from({ length: N_SLOTS }).map((_, i) => {
        const carta = visible ? cartas[i] : undefined;

        if (!carta) {
          return <SlotVacio key={i} index={i} />;
        }

        return (
          <AnimatePresence key={carta.id} mode="wait">
            <motion.button
              type="button"
              layoutId={carta.id}
              data-testid={`carta-${carta.id}`}
              data-sector={carta.sector}
              disabled={!interactiva}
              aria-disabled={!interactiva}
              onClick={() => { if (interactiva) onSeleccionar(carta.id); }}
              aria-label={`Seleccionar: ${carta.nombre}`}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: ANIM.DESPLIEGUE_MS / 1000, delay: i * 0.06 }}
              whileHover={interactiva ? { y: -10, scale: 1.03 } : undefined}
              whileTap={interactiva ? { scale: 0.97 } : undefined}
              className="rounded-xl overflow-hidden flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600"
              style={{
                width: ANCHO_SLOT,
                height: ALTO_SLOT,
                cursor: interactiva ? "pointer" : "default",
                opacity: interactiva ? 1 : 0.65,
                border: `2px solid ${PARCHMENT.border}`,
                boxShadow: interactiva
                  ? "0 4px 14px rgba(61,43,31,0.25)"
                  : "none",
                padding: 0,
              }}
            >
              <Image
                src={carta.imagen}
                alt={carta.nombre}
                width={ANCHO_SLOT}
                height={ALTO_SLOT}
                style={{
                  width: ANCHO_SLOT,
                  height: ALTO_SLOT,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            </motion.button>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
