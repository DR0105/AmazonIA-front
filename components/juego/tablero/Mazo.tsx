"use client";

/**
 * Mazo — pila de cartas a la izquierda del tablero, estilo tablero de mesa.
 *
 * Muestra capas apiladas con un efecto tridimensional pergamino/madera.
 * ── PERSONALIZACIÓN ──────────────────────────────────────────────────────────
 * Para agregar la imagen del reverso del mazo:
 *   1. Importa tu imagen: import reversoMazo from "@/assets/mazo-reverso.png"
 *   2. Reemplaza el bloque "/* icono mazo *\/" con:
 *      <Image src={reversoMazo} alt="Mazo" fill style={{ objectFit: "cover" }} />
 * ─────────────────────────────────────────────────────────────────────────────
 */
import Image from "next/image";
import type { MouseEvent } from "react";
import { PARCHMENT } from "./TableroDeCartas";
import reversoMazo from "@/assets/cards/reverso-mazo.png";

export interface MazoProps {
  cartasRestantes: number;
  habilitado: boolean;
  agotado: boolean;
  onClick: () => void;
}

const CAPAS = 4;
const ANCHO = 104;
const ALTO = 148;

export function Mazo({ cartasRestantes, habilitado, agotado, onClick }: MazoProps) {
  const interactivo = habilitado && !agotado;

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    if (interactivo) onClick();
  };

  return (
    <div
      data-testid="mazo"
      className="flex flex-col items-center gap-2 flex-shrink-0"
      style={{ width: ANCHO + 20 }}
    >
      <button
        type="button"
        data-testid="mazo-boton"
        onClick={handleClick}
        disabled={!interactivo}
        aria-label={
          agotado
            ? "Mazo agotado"
            : `Mazo: ${cartasRestantes} cartas. ${habilitado ? "Clic para repartir" : "Esperando animación"}`
        }
        className="relative focus:outline-none focus-visible:ring-2 focus-visible:ring-yellow-600"
        style={{
          width: ANCHO,
          height: ALTO,
          cursor: interactivo ? "pointer" : "not-allowed",
          opacity: interactivo ? 1 : 0.55,
          transition: "opacity 0.2s",
        }}
      >
        {/* Capas de la pila (decorativas, de atrás hacia adelante) */}
        {Array.from({ length: CAPAS }).map((_, i) => {
          const esSuperior = i === CAPAS - 1;
          const offset = (CAPAS - 1 - i) * 3;
          return (
            <div
              key={i}
              aria-hidden={!esSuperior}
              className="absolute rounded-xl"
              style={{
                inset: 0,
                transform: `translate(${-offset}px, ${offset}px)`,
                backgroundColor: esSuperior ? "#3B5EA6" : "#2D4A80",
                border: `2px solid ${esSuperior ? "#1A2F5A" : "#1A2F5A"}`,
                boxShadow: esSuperior
                  ? "inset 0 1px 3px rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.35)"
                  : "none",
                zIndex: i,
              }}
            >
              {esSuperior && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                  
                   
                    <Image src={reversoMazo} alt="Reverso mazo" fill
                      style={{ objectFit: "cover", borderRadius: 10 }} />
                  <span
                    className="text-2xl font-bold tabular-nums"
                    style={{ color: "white", fontFamily: "'Georgia', serif" }}
                  >
                    {cartasRestantes}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </button>

      <p
        className="text-xs font-bold uppercase tracking-[0.2em]"
        style={{ color: PARCHMENT.textMuted, fontFamily: "'Georgia', serif" }}
      >
        Mazo
      </p>

      {agotado && (
        <p
          data-testid="mazo-agotado"
          role="status"
          className="text-[10px] font-bold uppercase tracking-wider text-center rounded px-2 py-0.5"
          style={{ color: "#8B1A1A", backgroundColor: "#F5D0C8", border: "1px solid #C44" }}
        >
          Agotado
        </p>
      )}
    </div>
  );
}
