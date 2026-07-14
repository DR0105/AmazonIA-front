"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  useState,
  useEffect,
  type DragEvent,
  type KeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { createPortal } from "react-dom";
import { CirclePlay, Info, X } from "lucide-react";
import { ANIM } from "@/lib/tablero/animaciones";
import { ETIQUETAS_SECTOR, type CartaJugable } from "@/types/tablero";
import type { ActionResult } from "@/types/juego";
import { PARCHMENT } from "./TableroDeCartas";

// ─── Traducciones ────────────────────────────────────────────────────────────
const TRADUCCIONES: Record<string, string> = {
  INSUFFICIENT_RESOURCES: "Recursos insuficientes",
  REQUIREMENTS_NOT_MET: "Requisitos no cumplidos",
  insufficient_resources: "Recursos insuficientes",
  requirements_not_met: "Requisitos no cumplidos",
};

function traducirMensaje(code?: string, message?: string): string {
  if (!message) return "No se puede jugar";
  if (code && TRADUCCIONES[code]) {
    const detalle = message.split(":")[1]?.trim();
    if (detalle) {
      const fmt = detalle
        .split(", ")
        .map((s) => s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase()))
        .join(", ");
      return `${TRADUCCIONES[code]}: ${fmt}`;
    }
    return TRADUCCIONES[code];
  }
  const clave = message.split(":")[0].trim().toLowerCase().replace(/\s+/g, "_");
  return TRADUCCIONES[clave] ?? message;
}

// ─── Tooltip sigue al cursor ─────────────────────────────────────────────────
interface CursorTooltipProps {
  texto: string;
}

function CursorTooltip({ texto }: CursorTooltipProps) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [montado, setMontado] = useState(false);

  // Solo montar en cliente (createPortal lo necesita)
  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!montado) return null;

  // Offset: 14px a la derecha y 8px arriba del cursor
  const left = pos.x + 14;
  const top  = pos.y - 8;

  return createPortal(
    <div
      role="tooltip"
      className="pointer-events-none"
      style={{
        position: "fixed",
        left,
        top,
        transform: "translateY(-100%)",
        zIndex: 9999,
        backgroundColor: "#111",
        color: "#fff",
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.02em",
        fontFamily: "'Inter', system-ui, sans-serif",
        padding: "6px 10px",
        borderRadius: 6,
        boxShadow: "0 4px 16px rgba(0,0,0,0.45)",
        whiteSpace: "nowrap",
        userSelect: "none",
      }}
    >
      {texto}
    </div>,
    document.body,
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────
export interface ManoDesplegadaProps {
  cartas: CartaJugable[];
  visible: boolean;
  interactiva: boolean;
  accionesDisponibles?: Record<string, ActionResult>;
  accionesDescarte?: Record<string, ActionResult>;
  puedeDescartar?: boolean;
  onSeleccionar: (id: string) => void;
  onDescartar?: (id: string) => void;
}

const ANCHO_SLOT = 104;
const ALTO_SLOT  = 148;
// ─── Componente principal ────────────────────────────────────────────────────
export function ManoDesplegada({
  cartas,
  visible,
  interactiva,
  accionesDisponibles = {},
  accionesDescarte = {},
  puedeDescartar = false,
  onSeleccionar,
  onDescartar,
}: ManoDesplegadaProps) {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);


  return (
    <div className="flex gap-3 items-end justify-center">
      {(visible ? cartas : []).map((carta, i) => {

        const accion   = accionesDisponibles[carta.id];
        const permitida = accion === undefined || accion.allowed === true;
        const descartable = puedeDescartar && accionesDescarte[carta.id]?.allowed === true;
        const tooltipMsg = !permitida ? traducirMensaje(accion?.code, accion?.message) : null;
        const clickable  = interactiva && permitida;
        // En discard_required no se puede jugar la carta, pero el botón debe
        // seguir habilitado para que el navegador permita arrastrarla.
        const interactuable = clickable || (interactiva && descartable);

        return (
          <AnimatePresence key={carta.id} mode="wait">
            <div
              className="relative flex-shrink-0"
              style={{ width: ANCHO_SLOT }}
              onMouseEnter={() => tooltipMsg && setActiveTooltip(carta.id)}
              onMouseLeave={() => setActiveTooltip(null)}
            >
              {/* Tooltip que sigue al cursor — montado en body vía portal */}
              {activeTooltip === carta.id && tooltipMsg && (
                <CursorTooltip texto={tooltipMsg} />
              )}

              <motion.button
                type="button"
                layoutId={carta.id}
                data-testid={`carta-${carta.id}`}
                data-sector={carta.sector}
                data-permitida={String(permitida)}
                draggable={interactiva && descartable}
                aria-disabled={!interactuable}
                aria-label={`${carta.nombre}${tooltipMsg ? ` — ${tooltipMsg}` : ""}`}
                aria-haspopup={descartable ? undefined : "menu"}
                onClick={() => {
                  if (descartable) {
                    onDescartar?.(carta.id);
                  } else if (clickable) {
                    onSeleccionar(carta.id);
                  }
                }}
                onKeyDown={(evento) => {
                  if (descartable) return;
                }}
                onDragStartCapture={(event: DragEvent<HTMLButtonElement>) => {
                  if (!descartable) return;
                  event.dataTransfer.effectAllowed = "move";
                  event.dataTransfer.setData("text/plain", carta.id);
                }}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: ANIM.DESPLIEGUE_MS / 1000, delay: i * 0.06 }}
                // Hover: todas las cartas crecen un poco; las permitidas además suben
                whileHover={{ scale: 1.08, y: clickable ? -8 : 0 }}
                whileTap={clickable ? { scale: 0.97 } : undefined}
                className="rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600"
                style={{
                  width: ANCHO_SLOT,
                  height: ALTO_SLOT,
                  cursor: descartable ? "grab" : "pointer",
                  opacity: permitida ? 1 : 0.38,
                  filter: permitida ? "none" : "grayscale(60%)",
                  border: `2px solid ${permitida ? PARCHMENT.border : "#9A8870"}`,
                  boxShadow: clickable ? "0 4px 14px rgba(61,43,31,0.25)" : "none",
                  padding: 0,
                  transition: "opacity 0.2s, filter 0.2s",
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
            </div>
          </AnimatePresence>
        );
      })}
    </div>
  );
}
