"use client";

/**
 * Hook que trae el catálogo del backend y lo convierte en cartas jugables.
 *
 * Una carta es "jugable" solo si su `id` tiene una imagen en `assets/cards`
 * (match por `id`). Las cartas sin imagen se descartan.
 */

import { useEffect, useState } from "react";

import {
  ORDEN_SECTORES,
  type CartaJugable,
  type SectorId,
} from "@/types/tablero";
import { fetchCatalogo } from "./api";
import { getCardImage } from "./cardImages";

export interface EstadoCatalogo {
  cartas: CartaJugable[];
  cargando: boolean;
  error: string | null;
}

const SECTORES_VALIDOS = new Set<SectorId>(ORDEN_SECTORES);

function mensajeDeError(e: unknown): string {
  if (e instanceof Error) return e.message;
  return "No se pudo cargar el catálogo de cartas.";
}

export function useCatalogo(): EstadoCatalogo {
  const [estado, setEstado] = useState<EstadoCatalogo>({
    cartas: [],
    cargando: true,
    error: null,
  });

  useEffect(() => {
    const controlador = new AbortController();

    fetchCatalogo(controlador.signal)
      .then((data) => {
        const cartas: CartaJugable[] = (data.cards ?? [])
          .map((c): CartaJugable | null => {
            const imagen = getCardImage(c.id);
            if (!imagen) return null; // sin imagen → se ignora
            if (!SECTORES_VALIDOS.has(c.sector)) return null; // sector desconocido
            return {
              id: c.id,
              nombre: c.name,
              sector: c.sector,
              tipo: c.type,
              imagen,
            };
          })
          .filter((c): c is CartaJugable => c !== null);

        setEstado({ cartas, cargando: false, error: null });
      })
      .catch((e) => {
        if (controlador.signal.aborted) return;
        setEstado({ cartas: [], cargando: false, error: mensajeDeError(e) });
      });

    return () => controlador.abort();
  }, []);

  return estado;
}
