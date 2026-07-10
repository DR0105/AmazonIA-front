/**
 * Cliente de la API de partidas.
 *
 * Usa la ruta same-origin `/api/games` proxied en next.config.ts
 * hacia POST /api/v1/games en el backend.
 */

import type { GameResponse } from "@/types/juego";

export const GAMES_URL = "/api/games";

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
