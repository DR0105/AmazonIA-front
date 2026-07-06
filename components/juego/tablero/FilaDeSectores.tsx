"use client";

/**
 * FilaDeSectores — cinco sectores en el orden canónico, estilo tablero de mesa.
 */

import {
  ETIQUETAS_SECTOR,
  ORDEN_SECTORES,
  type CartaJugable,
  type SectorId,
} from "@/types/tablero";
import { Sector } from "./Sector";

// Color de cabecera por sector (igual que en la imagen de referencia)
export const SECTOR_COLORS: Record<SectorId, { bg: string; border: string }> = {
  industry:   { bg: "#7B2020", border: "#5A1515" }, // rojo oscuro
  population: { bg: "#8B6914", border: "#6A5010" }, // marrón dorado
  territory:  { bg: "#5A5040", border: "#3D3428" }, // gris pardo
  ecosystems: { bg: "#1E6B3A", border: "#14501F" }, // verde
  global:     { bg: "#1A3A6B", border: "#122850" }, // azul marino
};

export interface FilaDeSectoresProps {
  sectores: Partial<Record<SectorId, CartaJugable[]>>;
}

export function FilaDeSectores({ sectores }: FilaDeSectoresProps) {
  return (
    <div
      data-testid="fila-de-sectores"
      className="grid gap-2"
      style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
    >
      {ORDEN_SECTORES.map((tipo) => (
        <Sector
          key={tipo}
          tipo={tipo}
          etiqueta={ETIQUETAS_SECTOR[tipo]}
          cartas={sectores[tipo] ?? []}
        />
      ))}
    </div>
  );
}
