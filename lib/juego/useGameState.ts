"use client";

/**
 * useGameState — carga y refresca el estado de una partida activa.
 *
 * GET /api/games/:id con el token del localStorage.
 * Soporta polling opcional (pollMs > 0).
 */

import { useEffect, useState, useCallback, useRef } from "react";
import type { GameView, AvailableActions } from "@/types/juego";
import { getStoredAccessToken } from "./session";

export interface GameStateData {
  state: GameView | null;
  availableActions: AvailableActions | null;
  cargando: boolean;
  error: string | null;
  refetch: () => void;
}

const GAMES_URL = "/api/games";

export function useGameState(gameId: string | null, pollMs = 0): GameStateData {
  const [state, setState] = useState<GameView | null>(null);
  const [availableActions, setAvailableActions] = useState<AvailableActions | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Guardamos el id del último fetch en vuelo para poder cancelarlo si
  // llega uno nuevo (gameId cambia) sin cancelar el del Strict Mode remount.
  const fetchIdRef = useRef(0);

  const doFetch = useCallback(async () => {
    if (!gameId) return;
    const token = getStoredAccessToken();
    if (!token) return;

    const thisFetchId = ++fetchIdRef.current;
    setCargando(true);
    setError(null);

    try {
      const res = await fetch(`${GAMES_URL}/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Si ya llegó un fetch más nuevo, ignoramos este resultado
      if (fetchIdRef.current !== thisFetchId) return;

      if (!res.ok) throw new Error(`GET /api/games/${gameId} → ${res.status}`);

      const data = await res.json() as { state: GameView; availableActions: AvailableActions };
      setState(data.state);
      setAvailableActions(data.availableActions);
    } catch (e) {
      if (fetchIdRef.current !== thisFetchId) return;
      if ((e as Error).name === "AbortError") return;
      setError(e instanceof Error ? e.message : "Error desconocido.");
    } finally {
      if (fetchIdRef.current === thisFetchId) setCargando(false);
    }
  }, [gameId]);

  // Carga inicial cada vez que cambia gameId
  useEffect(() => {
    void doFetch();
  }, [doFetch]);

  // Polling opcional
  useEffect(() => {
    if (!pollMs || !gameId) return;
    const id = setInterval(() => { void doFetch(); }, pollMs);
    return () => clearInterval(id);
  }, [pollMs, gameId, doFetch]);

  return { state, availableActions, cargando, error, refetch: doFetch };
}
