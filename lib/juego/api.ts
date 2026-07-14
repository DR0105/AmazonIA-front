/** Cliente HTTP autenticado para la API de partidas. */

import type { GameResponse } from "@/types/juego";
import { fetchWithSession } from "./session";

export const GAMES_URL = "/api/games";

async function enviarComando(
  accessToken: string,
  gameId: string,
  body: Record<string, unknown>,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetchWithSession(
    `${GAMES_URL}/${gameId}/commands`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    },
    accessToken,
  );

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    throw new Error(`POST /api/games/${gameId}/commands → ${respuesta.status}. ${cuerpo}`);
  }
  return (await respuesta.json()) as GameResponse;
}

export function jugarCarta(
  accessToken: string,
  gameId: string,
  cardId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  return enviarComando(accessToken, gameId, { type: "play_card", cardId, expectedVersion }, signal);
}

export function descartarCarta(
  accessToken: string,
  gameId: string,
  cardId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  return enviarComando(accessToken, gameId, { type: "discard_card", cardId, expectedVersion }, signal);
}

export function finalizarTurno(
  accessToken: string,
  gameId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  return enviarComando(accessToken, gameId, { type: "end_turn", expectedVersion }, signal);
}

export async function crearPartida(
  accessToken: string,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetchWithSession(
    GAMES_URL,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
      signal,
    },
    accessToken,
  );

  if (!respuesta.ok) {
    throw new Error(
      `POST /api/games respondió con estado ${respuesta.status}. ` +
        "Verifica que el backend esté corriendo en http://localhost:8080.",
    );
  }
  return (await respuesta.json()) as GameResponse;
}
