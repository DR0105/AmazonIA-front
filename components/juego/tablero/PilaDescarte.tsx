"use client";

/**
 * PilaDescarte — pila de cartas descartadas a la derecha, estilo tablero de mesa.
 *
 * ── PERSONALIZACIÓN ──────────────────────────────────────────────────────────
 * Para agregar la imagen del reverso del descarte:
 *   1. Importa: import reversoDescent from "@/assets/descarte-reverso.png"
 *   2. En el bloque de "slot vacío", reemplaza el ✦ con:
 *      <Image src={reversoDescent} alt="Descarte" fill style={{ objectFit: "cover" }} />
 * ─────────────────────────────────────────────────────────────────────────────
 */

import Image from "next/image";
import { motion } from "framer-motion";
import { ANIM } from "@/lib/tablero/animaciones";
import type { CartaJugable } from "@/types/tablero";
import { PARCHMENT } from "./TableroDeCartas";

export interface PilaDescarteProps {
  cartas: CartaJugable[];
}

const ANCHO = 104;
const ALTO = 148;
const OFFSET = 4;
const MAX_OFFSET = 8;

export function PilaDescarte({ cartas }: PilaDescarteProps) {
  const vacia = cartas.length === 0;
  const indiceTope = cartas.length - 1;

  return (
    <div
      data-testid="pila-descarte"
      className="flex flex-col items-center gap-2 flex-shrink-0"
      style={{ width: ANCHO + 20 }}
    >
      {/* Pila o slot vacío */}
      <div
        className="relative"
        style={{
          width: ANCHO,
          height: ALTO + Math.min(indiceTope, MAX_OFFSET) * OFFSET,
        }}
      >
        {vacia ? (
          /* Slot vacío — espacio para imagen del reverso del descarte */
          <div
            data-testid="pila-descarte-vacia"
            className="absolute inset-0 rounded-xl flex flex-col items-center justify-center"
            style={{
              backgroundColor: "#5A5A5A",
              border: "2px solid #3A3A3A",
              boxShadow: "inset 0 1px 3px rgba(255,255,255,0.08), 0 4px 12px rgba(0,0,0,0.3)",
            }}
          >
            {/*
              ── ESPACIO PARA IMAGEN DEL REVERSO DEL DESCARTE ────────────────
              Reemplaza este bloque con tu imagen cuando la tengas:

              import reversoDescarte from "@/assets/reverso-descarte.png"
              <Image src={reversoDescarte} alt="Descarte" fill
                style={{ objectFit: "cover", borderRadius: 10 }} />

              Por ahora placeholder decorativo:
              ──────────────────────────────────────────────────────────────────
            */}
            <span className="text-3xl opacity-20" aria-hidden style={{ color: "white" }}>
              ✦
            </span>
          </div>
        ) : (
          cartas.map((carta, i) => {
            const desdeTope = indiceTope - i;
            const top = Math.min(desdeTope, MAX_OFFSET) * OFFSET;
            const esTope = i === indiceTope;
            return (
              <motion.div
                key={carta.id}
                layoutId={carta.id}
                data-testid={`pila-descarte-carta-${carta.id}`}
                className="absolute rounded-xl overflow-hidden"
                style={{
                  top,
                  left: 0,
                  width: ANCHO,
                  height: ALTO,
                  zIndex: i + 1,
                  border: "2px solid #3A3A3A",
                  boxShadow: esTope ? "0 4px 16px rgba(0,0,0,0.35)" : "none",
                }}
                transition={{ duration: ANIM.DESCARTE_MS / 1000 }}
              >
                <Image
                  src={carta.imagen}
                  alt={carta.nombre}
                  width={ANCHO}
                  height={ALTO}
                  style={{ width: ANCHO, height: ALTO, objectFit: "cover", display: "block" }}
                />
              </motion.div>
            );
          })
        )}
      </div>

      <p
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: PARCHMENT.textMuted, fontFamily: "'Georgia', serif" }}
      >
        Descarte
      </p>

      {!vacia && (
        <span
          className="text-xs font-bold tabular-nums px-2 py-0.5 rounded"
          style={{
            backgroundColor: PARCHMENT.border,
            color: PARCHMENT.panel,
            fontFamily: "'Georgia', serif",
          }}
        >
          {cartas.length}
        </span>
      )}
    </div>
  );
}
