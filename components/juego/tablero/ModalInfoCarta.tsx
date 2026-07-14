"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { getCardMeta, traducirTipo } from "@/lib/catalog/cardsCatalog";
import type { CartaJugable } from "@/types/tablero";
import { ETIQUETAS_SECTOR } from "@/types/tablero";
import { PARCHMENT } from "./TableroDeCartas";

interface Props {
  carta: CartaJugable;
  onCerrar: () => void;
}

/** Nombre legible de una carta a partir de su id */
function nombreCarta(id: string): string {
  // Convierte snake_case a Title Case como fallback
  return id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

export function ModalInfoCarta({ carta, onCerrar }: Props) {
  const meta = getCardMeta(carta.id);

  const tipo    = meta ? traducirTipo(meta.type) : carta.tipo;
  const sector  = ETIQUETAS_SECTOR[carta.sector] ?? carta.sector;
  const reglas  = meta?.rulesText ?? '';
  const costo   = meta?.cost ?? { money: 0, people: 0, land: 0 };
  const requiere = meta?.requires ?? [];

  return (
    <>
      {/* Overlay */}
      <div
        role="presentation"
        className="fixed inset-0 z-40"
        style={{ backgroundColor: 'rgba(30,20,10,0.60)', backdropFilter: 'blur(2px)' }}
        onClick={onCerrar}
      />

      {/* Modal */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Información de ${carta.nombre}`}
        className="fixed z-50 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(94vw, 540px)',
          backgroundColor: PARCHMENT.panel,
          border: `3px solid ${PARCHMENT.border}`,
          color: PARCHMENT.text,
          fontFamily: "'Georgia', serif",
        }}
      >
        {/* Cabecera */}
        <div
          className="px-5 py-3 text-center relative"
          style={{ borderBottom: `2px solid ${PARCHMENT.borderLight}`, backgroundColor: PARCHMENT.panelDark }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1"
             style={{ color: PARCHMENT.textMuted }}>
            Información de la carta
          </p>
          <button
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar"
            className="absolute right-3 top-3 rounded-lg p-1.5 hover:bg-black/10"
          >
            <X size={18} aria-hidden />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-5 grid gap-4" style={{ gridTemplateColumns: '120px 1fr' }}>

          {/* Imagen de la carta */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="rounded-xl overflow-hidden"
              style={{ border: `2px solid ${PARCHMENT.border}`, boxShadow: '0 4px 12px rgba(61,43,31,0.2)' }}
            >
              <Image
                src={carta.imagen}
                alt={carta.nombre}
                width={110}
                height={156}
                style={{ width: 110, height: 156, objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-3">

            {/* Descripción */}
            {reglas && (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1"
                   style={{ color: PARCHMENT.textMuted }}>
                  Descripción
                </p>
                <p className="text-sm leading-relaxed" style={{ color: PARCHMENT.text }}>
                  {reglas}
                </p>
              </div>
            )}

            {/* Tipo */}
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1"
                 style={{ color: PARCHMENT.textMuted }}>
                Tipo
              </p>
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold"
                style={{ backgroundColor: PARCHMENT.panelDark, border: `1.5px solid ${PARCHMENT.borderLight}` }}
              >
                <span>⚡</span>
                <span className="uppercase tracking-wide">{tipo}</span>
                <span style={{ color: PARCHMENT.textMuted }}>·</span>
                <span className="uppercase tracking-wide">{sector}</span>
              </div>
            </div>

            {/* Requisitos */}
            {requiere.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] mb-1.5"
                   style={{ color: PARCHMENT.textMuted }}>
                  Requiere previamente
                </p>
                <div className="flex flex-wrap gap-2">
                  {requiere.map(req => (
                    <span
                      key={req}
                      className="text-xs px-2 py-1 rounded-lg font-bold uppercase tracking-wide"
                      style={{ backgroundColor: PARCHMENT.panelDark, border: `1.5px solid ${PARCHMENT.border}` }}
                    >
                      {req.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Coste */}
        <div
          className="px-5 py-4"
          style={{ borderTop: `2px solid ${PARCHMENT.borderLight}`, backgroundColor: PARCHMENT.panelDark }}
        >
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-center mb-3"
             style={{ color: PARCHMENT.textMuted }}>
            Coste
          </p>
          <div className="flex justify-around">
            {[
              { emoji: '💰', label: 'DINERO',   val: costo.money  },
              { emoji: '👥', label: 'PERSONAS', val: costo.people },
              { emoji: '🌱', label: 'TIERRA',   val: costo.land   },
            ].map(({ emoji, label, val }) => (
              <div key={label} className="flex flex-col items-center gap-1">
                <span className="text-2xl">{emoji}</span>
                <span className="text-sm font-bold">x{val}</span>
                <span className="text-xs uppercase tracking-wide" style={{ color: PARCHMENT.textMuted }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
