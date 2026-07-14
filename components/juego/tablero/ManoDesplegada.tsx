"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import {
  useState,
  useEffect,
  useRef,
  type DragEvent,
} from "react";
import { createPortal } from "react-dom";
import { CirclePlay, Info, Trash2 } from "lucide-react";
import { ANIM } from "@/lib/tablero/animaciones";
import type { CartaJugable } from "@/types/tablero";
import type { ActionResult } from "@/types/juego";
import { PARCHMENT } from "./TableroDeCartas";
import { ModalInfoCarta } from "./ModalInfoCarta";

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

  useEffect(() => { setMontado(true); }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (!montado) return null;

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

interface MenuCarta {
  carta: CartaJugable;
  x: number;
  y: number;
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
  const [menuCarta, setMenuCarta] = useState<MenuCarta | null>(null);
  const [cartaInfo, setCartaInfo] = useState<CartaJugable | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Cerrar menú con ESC o click FUERA del menú (no dentro)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMenuCarta(null);
        setCartaInfo(null);
      }
    };
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuCarta(null);
      }
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, []);

  return (
    <>
      <div className="flex gap-3 items-end justify-center">
        {(visible ? cartas : []).map((carta, i) => {
          const accion    = accionesDisponibles[carta.id];
          const permitida = accion === undefined || accion.allowed === true;
          const descartable = puedeDescartar && accionesDescarte[carta.id]?.allowed === true;
          const tooltipMsg = !permitida ? traducirMensaje(accion?.code, accion?.message) : null;
          const clickable  = interactiva && permitida;
          const interactuable = clickable || (interactiva && descartable);

          return (
            <AnimatePresence key={carta.id} mode="wait">
              <div
                className="relative flex-shrink-0"
                style={{ width: ANCHO_SLOT }}
                onMouseEnter={() => tooltipMsg && setActiveTooltip(carta.id)}
                onMouseLeave={() => setActiveTooltip(null)}
              >
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
                  aria-haspopup="menu"
                  onClick={(e) => {
                    if (!interactiva) return;
                    e.stopPropagation();
                    setMenuCarta({ carta, x: e.clientX, y: e.clientY });
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
                  whileHover={{ scale: 1.08, y: clickable ? -8 : 0 }}
                  whileTap={clickable ? { scale: 0.97 } : undefined}
                  className="rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600"
                  style={{
                    width: ANCHO_SLOT,
                    height: ALTO_SLOT,
                    cursor: "pointer",
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

      {/* ── Menú contextual ─────────────────────────────────────── */}
      {menuCarta && (() => {
        const { carta, x, y } = menuCarta;
        const accion    = accionesDisponibles[carta.id];
        const permitida = accion === undefined || accion.allowed === true;
        const descartable = puedeDescartar && accionesDescarte[carta.id]?.allowed === true;

        return (
          <div
            ref={menuRef}
            role="menu"
            aria-label={`Acciones de ${carta.nombre}`}
            className="fixed z-50 w-48 rounded-lg p-1 shadow-xl"
            style={{
              left: Math.min(x, (typeof window !== "undefined" ? window.innerWidth : 800) - 208),
              top: Math.min(y + 8, (typeof window !== "undefined" ? window.innerHeight : 600) - 112),
              backgroundColor: PARCHMENT.panel,
              border: `2px solid ${PARCHMENT.border}`,
              color: PARCHMENT.text,
            }}
          >
            {/* Jugar / Descartar */}
            <button
              type="button"
              role="menuitem"
              disabled={!permitida && !descartable}
              onClick={(e) => {
                e.stopPropagation();
                setMenuCarta(null);
                if (descartable) {
                  onDescartar?.(carta.id);
                } else if (permitida) {
                  onSeleccionar(carta.id);
                }
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold enabled:hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-45"
            >
              {descartable
                ? <Trash2 size={17} strokeWidth={2.5} aria-hidden />
                : <CirclePlay size={17} strokeWidth={2.5} aria-hidden />
              }
              {descartable ? "Descartar" : "Jugar carta"}
            </button>

            {/* Más información */}
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation();
                setCartaInfo(carta);
                setMenuCarta(null);
              }}
              className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold hover:bg-black/5"
            >
              <Info size={17} strokeWidth={2.5} aria-hidden />
              Más información
            </button>
          </div>
        );
      })()}

      {/* ── Modal de información ─────────────────────────────────── */}
      {cartaInfo && (
        <ModalInfoCarta
          carta={cartaInfo}
          onCerrar={() => setCartaInfo(null)}
        />
      )}
    </>
  );
}
