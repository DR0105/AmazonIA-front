/**
 * Cliente de la API de partidas.
 *
 * Usa la ruta same-origin `/api/games` proxied en next.config.ts
 * hacia POST /api/v1/games en el backend.
 */

import type { GameResponse } from "@/types/juego";

export const GAMES_URL = "/api/games";

/**
 * POST /api/v1/games/:id/commands — ejecuta un comando sobre la partida.
 * Devuelve el nuevo estado completo (mismo shape que GameResponse).
 */
export async function jugarCarta(
  accessToken: string,
  gameId: string,
  cardId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetch(`${GAMES_URL}/${gameId}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "play_card",
      cardId,
      expectedVersion,
    }),
    signal,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    throw new Error(
      `POST /api/games/${gameId}/commands → ${respuesta.status}. ${cuerpo}`,
    );
  }

  return (await respuesta.json()) as GameResponse;
}

/** POST /api/v1/games/:id/commands — descarta una carta de la mano. */
export async function descartarCarta(
  accessToken: string,
  gameId: string,
  cardId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetch(`${GAMES_URL}/${gameId}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "discard_card",
      cardId,
      expectedVersion,
    }),
    signal,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    throw new Error(
      `POST /api/games/${gameId}/commands → ${respuesta.status}. ${cuerpo}`,
    );
  }

  return (await respuesta.json()) as GameResponse;
}

/** POST /api/v1/games/:id/commands — avanza la ronda actual. */
export async function finalizarTurno(
  accessToken: string,
  gameId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetch(`${GAMES_URL}/${gameId}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ type: "end_turn", expectedVersion }),
    signal,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    throw new Error(
      `POST /api/games/${gameId}/commands → ${respuesta.status}. ${cuerpo}`,
    );
  }

  return (await respuesta.json()) as GameResponse;
}

/** POST /api/v1/games/:id/commands — resuelve un evento activo. */
export async function resolverEvento(
  accessToken: string,
  gameId: string,
  eventId: string,
  expectedVersion: number,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetch(`${GAMES_URL}/${gameId}/commands`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      type: "resolve_event",
      eventId,
      expectedVersion,
    }),
    signal,
  });

  if (!respuesta.ok) {
    const cuerpo = await respuesta.text().catch(() => "");
    throw new Error(
      `POST /api/games/${gameId}/commands → ${respuesta.status}. ${cuerpo}`,
    );
  }

  return (await respuesta.json()) as GameResponse;
}

/**
 * POST /api/v1/games — crea una nueva partida.
 * Devuelve el estado inicial completo con `id`, `state` y `availableActions`.
 */
export async function crearPartida(
  accessToken: string,
  signal?: AbortSignal,
): Promise<GameResponse> {
  const respuesta = await fetch(GAMES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}), // seed opcional, omitido → aleatorio
    signal,
  });

  if (!respuesta.ok) {
    throw new Error(
      `POST /api/games respondió con estado ${respuesta.status}. ` +
        "Verifica que el backend esté corriendo en http://localhost:8080.",
    );
  }

  return (await respuesta.json()) as GameResponse;
}
