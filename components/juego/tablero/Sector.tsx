"use client";

/**
 * Sector — uno de los cinco espacios del tablero, estilo tablero de mesa.
 *
 * Cabecera coloreada por sector + cuerpo parchment + slot vacío punteado.
 * Cuando llega una carta, la imagen vuela desde la mano (layoutId compartido).
 */

import Image from "next/image";
import { motion } from "framer-motion";
import type { CartaJugable, SectorId } from "@/types/tablero";
import { PARCHMENT } from "./TableroDeCartas";
import { SECTOR_COLORS } from "./FilaDeSectores";

export interface SectorProps {
  tipo: SectorId;
  etiqueta: string;
  cartas: CartaJugable[];
}

export function Sector({ tipo, etiqueta, cartas }: SectorProps) {
  const { bg, border } = SECTOR_COLORS[tipo];
  const vacio = cartas.length === 0;

  return (
    <div
      data-testid={`sector-${tipo}`}
      data-sector={tipo}
      className="flex flex-col rounded-xl overflow-hidden"
      style={{
        border: `3px solid ${border}`,
        boxShadow: "0 2px 8px rgba(61,43,31,0.18)",
        minHeight: 200,
      }}
    >
      {/* ── Cabecera coloreada ── */}
      <div
        className="px-2 py-2 flex items-center gap-1.5"
        style={{ backgroundColor: bg }}
      >
        {/* Espacio para ícono — TODO: insertar ícono SVG del sector aquí */}
        <span
          className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center opacity-70"
          aria-hidden
          style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
        >
          {/* ícono */}
        </span>
        <p
          className="text-xs font-bold uppercase tracking-wider truncate leading-none"
          style={{ color: "white", fontFamily: "'Georgia', serif" }}
          title={etiqueta}
        >
          {etiqueta}
        </p>
      </div>

      {/* ── Cuerpo: carta o slot vacío ── */}
      <div
        className="flex-1 flex items-center justify-center p-2"
        style={{ backgroundColor: PARCHMENT.panel }}
      >
        {vacio ? (
          <div
            data-testid={`sector-vacio-${tipo}`}
            className="w-full h-full flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-center"
            style={{
              borderColor: PARCHMENT.slotBorder,
              backgroundColor: PARCHMENT.slotBg,
              minHeight: 140,
            }}
          >
            {/* Marcador decorativo — opcional: agrega imagen de fondo de carta aquí */}
            <span
              aria-hidden
              className="text-3xl opacity-20"
              style={{ color: PARCHMENT.border }}
            >
              ✦
            </span>
          </div>
        ) : (
          <div className="grid ..."
          style={{ display: "flex", flexWrap: "wrap", gap: 8}}>
    {cartas.map(carta => (
          <motion.div
            layoutId={carta.id}
            data-testid={`sector-carta-${tipo}`}
            className="rounded-lg overflow-hidden"
            style={{
              border: `2px solid ${border}`,
              boxShadow: `0 4px 16px ${border}55`,
            }}
          >
            <Image
              src={carta.imagen}
              alt={carta.nombre}
              width={60}
              height={78}
              style={{ width: 60, height: 78, objectFit: "cover", display: "block" }}
            />
          </motion.div>
              ))}
</div>
        )}
      </div>
    </div>
  );
}
