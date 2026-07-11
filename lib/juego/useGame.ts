"use client";

/**
 * useGame — crea una partida al entrar a la vista del juego.
 *
 * Flujo:
 *  1. useGuestSessionToken (en TableroDeCartas) obtiene/renueva el token.
 *  2. Este hook espera el token (localStorage o evento custom) y luego
 *     hace POST /api/games.
 *
 * Corrección respecto a la versión anterior:
 *  - En React Strict Mode el efecto se monta → desmonta → remonta.
 *    El AbortController del primer mount cancelaba la request y el guard
 *    `ejecutado.current` impedía relanzarla en el segundo mount.
 *  - Solución: no abortar si ya tenemos el gameId (ya terminó bien);
 *    solo abortar si todavía estamos esperando.
 */

import { useState, useEffect, useRef } from "react";
import { getStoredAccessToken } from "./session";
import { crearPartida } from "./api";
import type { GameResponse } from "@/types/juego";

export interface EstadoPartida {
  gameId: string | null;
  partida: GameResponse | null;
  cargando: boolean;
  error: string | null;
}

export function useGame(): EstadoPartida {
  const [estado, setEstado] = useState<EstadoPartida>({
    gameId: null,
    partida: null,
    cargando: true,
    error: null,
  });

  // Ref para saber si ya tenemos partida y no relanzar
  const tienePartida = useRef(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Si ya logramos una partida en un mount anterior no hacemos nada
    if (tienePartida.current) return;

    const controlador = new AbortController();
    abortRef.current = controlador;

    const iniciar = async (token: string) => {
      // Doble check: entre el momento en que se llama y cuando corre,
      // puede que un mount anterior ya terminó
      if (tienePartida.current || controlador.signal.aborted) return;
      try {
        const partida = await crearPartida(token, controlador.signal);
        if (controlador.signal.aborted) return;
        tienePartida.current = true;
        setEstado({ gameId: partida.id, partida, cargando: false, error: null });
      } catch (e) {
        if (controlador.signal.aborted) return;
        setEstado({
          gameId: null,
          partida: null,
          cargando: false,
          error: e instanceof Error ? e.message : "Error al crear la partida.",
        });
      }
    };

    // Caso 1: token ya en localStorage
    const tokenExistente = getStoredAccessToken();
    if (tokenExistente) {
      void iniciar(tokenExistente);
    } else {
      // Caso 2: esperamos el evento que dispara session.ts al guardar el token
      const onTokenListo = (e: Event) => {
        const token = (e as CustomEvent<string>).detail;
        if (!token) return;
        window.removeEventListener("amazonia:token", onTokenListo);
        void iniciar(token);
      };
      window.addEventListener("amazonia:token", onTokenListo);

      // cleanup del listener si el componente se desmonta antes de recibirlo
      return () => {
        window.removeEventListener("amazonia:token", onTokenListo);
        // Solo abortamos si todavía no tenemos partida
        if (!tienePartida.current) controlador.abort();
      };
    }

    return () => {
      if (!tienePartida.current) controlador.abort();
    };
  }, []); // sin dependencias: se ejecuta una sola vez por montaje real

  return estado;
}
