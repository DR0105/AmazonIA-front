"use client";

/**
 * ModalCarta — muestra información detallada de una carta.
 * NO contiene lógica de juego: solo presenta datos y delega al padre.
 */

import Image from "next/image";
import { X, CirclePlay, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import type { CartaJugable } from "@/types/tablero";
import { PARCHMENT } from "./TableroDeCartas";

// Datos extra de las cartas que no vienen del backend pero sí del JSON del engine
import cartasJson from "@/../colombia-ecosystems-engine/assets/cards.amazonas_mvp.json";

interface CostoCarta { money: number; people: number; land: number; }
interface CartaExtra {
  id: string;
  cost: CostoCarta;
  rulesText: string;
  requires: string[];
  type: string;
  sector: string;
}

const CARTAS_EXTRA_MAP = new Map<string, CartaExtra>(
  (cartasJson as CartaExtra[]).map((c) => [c.id, c])
);

const ETIQUETAS_TIPO: Record<string, string> = {
  structure: "Estructura",
  action:    "Acción",
  policy:    "Política",
  project:   "Proyecto",
};

const ETIQUETAS_SECTOR: Record<string, string> = {
  industry:   "Industria",
  population: "Población",
  territory:  "Territorio",
  ecosystems: "Ecosistemas",
  global:     "Global",
};

export interface ModalCartaProps {
  carta: CartaJugable;
  /** Mapa de cartas jugables para mostrar la imagen del requisito */
  cartasPorId: Map<string, CartaJugable>;
  /** Si puede jugarse (modo normal) */
  puedeJugar: boolean;
  /** Si debe descartarse (fase discard_required) */
  puedeDescartar: boolean;
  onJugar: () => void;
  onDescartar: () => void;
  onCerrar: () => void;
}

export function ModalCarta({
  carta,
  cartasPorId,
  puedeJugar,
  puedeDescartar,
  onJugar,
  onDescartar,
  onCerrar,
}: ModalCartaProps) {
  const [montado, setMontado] = useState(false);
  useEffect(() => { setMontado(true); }, []);

  const extra = CARTAS_EXTRA_MAP.get(carta.id);
  const tipo   = ETIQUETAS_TIPO[extra?.type ?? carta.tipo] ?? carta.tipo;
  const sector = ETIQUETAS_SECTOR[extra?.sector ?? carta.sector] ?? carta.sector;

  if (!montado) return null;

  return createPortal(
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(30,20,10,0.6)", backdropFilter: "blur(2px)" }}
        onClick={onCerrar}
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Información de ${carta.nombre}`}
        className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(96vw, 620px)",
          backgroundColor: PARCHMENT.panel,
          border: `3px solid ${PARCHMENT.border}`,
          color: PARCHMENT.text,
          fontFamily: "'Georgia', serif",
        }}
      >
        {/* Cabecera */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{ borderBottom: `2px solid ${PARCHMENT.borderLight}`, backgroundColor: PARCHMENT.panelDark }}
        >
          <p
            className="text-xs font-bold uppercase tracking-[0.2em]"
            style={{ color: PARCHMENT.textMuted }}
          >
            ✦ Información de la carta ✦
          </p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="rounded-lg p-1.5 hover:bg-black/10"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 grid gap-5" style={{ gridTemplateColumns: "140px 1fr" }}>

          {/* Columna izq: imagen + coste */}
          <div className="flex flex-col items-center gap-4">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `2px solid ${PARCHMENT.border}`, boxShadow: "0 4px 12px rgba(61,43,31,0.25)" }}
            >
              <Image
                src={carta.imagen}
                alt={carta.nombre}
                width={130}
                height={185}
                style={{ width: 130, height: 185, objectFit: "cover", display: "block" }}
              />
            </div>

            {extra && (
              <div
                className="w-full rounded-xl p-3"
                style={{ backgroundColor: PARCHMENT.panelDark, border: `1.5px solid ${PARCHMENT.borderLight}` }}
              >
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-center mb-2"
                   style={{ color: PARCHMENT.textMuted }}>
                  Coste
                </p>
                <div className="flex justify-around">
                  {[
                    { emoji: "💰", label: "DINERO",   val: extra.cost.money  },
                    { emoji: "👥", label: "PERSONAS", val: extra.cost.people },
                    { emoji: "🌱", label: "TIERRA",   val: extra.cost.land   },
                  ].map(({ emoji, label, val }) => (
                    <div key={label} className="flex flex-col items-center gap-0.5">
                      <span className="text-xl">{emoji}</span>
                      <span className="text-sm font-bold">x{val}</span>
                      <span className="text-[10px] uppercase tracking-wide" style={{ color: PARCHMENT.textMuted }}>
                        {label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Columna der: descripción, tipo, requisitos */}
          <div className="flex flex-col gap-4">
            {/* Descripción */}
            {extra?.rulesText && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
                   style={{ color: PARCHMENT.textMuted }}>
                  ✦ Descripción ✦
                </p>
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: PARCHMENT.panelDark, border: `1.5px solid ${PARCHMENT.borderLight}` }}
                >
                  <p className="text-sm leading-relaxed">{extra.rulesText}</p>
                </div>
              </div>
            )}

            {/* Tipo */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
                 style={{ color: PARCHMENT.textMuted }}>
                ✦ Tipo ✦
              </p>
              <div
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2"
                style={{ backgroundColor: PARCHMENT.panelDark, border: `1.5px solid ${PARCHMENT.borderLight}` }}
              >
                <span className="text-base">⚡</span>
                <div>
                  <p className="text-sm font-bold uppercase">{tipo}</p>
                  <p className="text-xs uppercase tracking-wide" style={{ color: PARCHMENT.textMuted }}>{sector}</p>
                </div>
              </div>
            </div>

            {/* Requisitos */}
            {extra && extra.requires.length > 0 && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] mb-1"
                   style={{ color: PARCHMENT.textMuted }}>
                  ✦ Requisitos ✦
                </p>
                <p className="text-xs mb-2" style={{ color: PARCHMENT.textMuted }}>
                  Requiere previamente:
                </p>
                <div className="flex flex-wrap gap-2">
                  {extra.requires.map((reqId) => {
                    const reqCarta = cartasPorId.get(reqId);
                    if (!reqCarta) return (
                      <span key={reqId}
                        className="text-xs px-2 py-1 rounded"
                        style={{ backgroundColor: PARCHMENT.panelDark, border: `1px solid ${PARCHMENT.borderLight}` }}>
                        {reqId}
                      </span>
                    );
                    return (
                      <div
                        key={reqId}
                        className="rounded-lg overflow-hidden"
                        style={{ border: `2px solid ${PARCHMENT.border}`, boxShadow: "0 2px 8px rgba(61,43,31,0.2)" }}
                        title={reqCarta.nombre}
                      >
                        <Image
                          src={reqCarta.imagen}
                          alt={reqCarta.nombre}
                          width={60}
                          height={85}
                          style={{ width: 60, height: 85, objectFit: "cover", display: "block" }}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer — botón de acción (sin botón si solo es informativo) */}
        {(puedeJugar || puedeDescartar) && (
          <div
            className="px-5 py-4"
            style={{ borderTop: `2px solid ${PARCHMENT.borderLight}`, backgroundColor: PARCHMENT.panelDark }}
          >
            {puedeDescartar ? (
              <button
                type="button"
                onClick={() => { onDescartar(); onCerrar(); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
                style={{ backgroundColor: "#7A2020", color: "#F5EDD0", border: "2px solid #5A1515" }}
              >
                <Trash2 size={17} strokeWidth={2.5} aria-hidden />
                Descartar carta
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onJugar(); onCerrar(); }}
                className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"
                style={{ backgroundColor: "#1B4D2E", color: "#F5EDD0", border: "2px solid #0F3020" }}
              >
                <CirclePlay size={17} strokeWidth={2.5} aria-hidden />
                Jugar carta
              </button>
            )}
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
