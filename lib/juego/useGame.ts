"use client";

/**
 * Hook que crea una partida al entrar a la vista del juego.
 *
 * En lugar de polling, escucha el evento nativo `storage` del navegador
 * que dispara cuando useGuestSessionToken escribe el accessToken en
 * localStorage. Esto evita la carrera entre ambos hooks.
 *
 * Flujo:
 *  1. Si ya hay token válido en localStorage → crea la partida de inmediato.
 *  2. Si no hay token → espera el evento `storage` para recibirlo.
 *  3. Una vez con token → POST /api/v1/games y guarda el id.
 */

import { useState, useEffect, useRef } from "react";
import { getStoredAccessToken, ACCESS_TOKEN_STORAGE_KEY } from "./session";
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

  const ejecutado = useRef(false);

  useEffect(() => {
    if (ejecutado.current) return;
    ejecutado.current = true;

    const controlador = new AbortController();

    const iniciar = async (token: string) => {
      try {
        const partida = await crearPartida(token, controlador.signal);
        if (controlador.signal.aborted) return;
        setEstado({ gameId: partida.id, partida, cargando: false, error: null });
      } catch (e) {
        if (controlador.signal.aborted) return;
        setEstado({
          gameId: null,
          partida: null,
          cargando: false,
          error: e instanceof Error ? e.message : "Error desconocido.",
        });
      }
    };

    // Caso 1: el token ya existe en localStorage (ej: recarga de página)
    const tokenExistente = getStoredAccessToken();
    if (tokenExistente) {
      void iniciar(tokenExistente);
      return () => controlador.abort();
    }

    // Caso 2: esperamos a que useGuestSessionToken escriba el token.
    // El evento `storage` se dispara en la misma pestaña cuando se usa
    // localStorage.setItem() — lo capturamos con un CustomEvent wrapper
    // porque el evento nativo `storage` solo se propaga a OTRAS pestañas.
    const onTokenListo = (e: Event) => {
      const token = (e as CustomEvent<string>).detail;
      if (!token || controlador.signal.aborted) return;
      // Una vez recibido el token, no necesitamos seguir escuchando
      window.removeEventListener("amazonia:token", onTokenListo);
      void iniciar(token);
    };

    window.addEventListener("amazonia:token", onTokenListo);

    return () => {
      controlador.abort();
      window.removeEventListener("amazonia:token", onTokenListo);
    };
  }, []);

  return estado;
}
