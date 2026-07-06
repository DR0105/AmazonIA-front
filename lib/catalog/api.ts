/**
 * Cliente del catálogo de cartas.
 *
 * Se consume a través de una ruta del MISMO origen (`/api/catalog`) que Next
 * redirige por proxy al backend (`http://localhost:8080/api/v1/catalog`) mediante
 * un `rewrite` en `next.config.ts`. Así se evitan problemas de CORS desde el
 * navegador.
 */

import type { RespuestaCatalogo } from "@/types/tablero";

/** Ruta same-origin proxied al backend (ver `next.config.ts`). */
export const CATALOG_URL = "/api/catalog";

/** Trae el catálogo de cartas del backend. Lanza si la respuesta no es OK. */
export async function fetchCatalogo(
  signal?: AbortSignal
): Promise<RespuestaCatalogo> {
  const respuesta = await fetch(CATALOG_URL, { signal });
  if (!respuesta.ok) {
    throw new Error(
      `El catálogo respondió con estado ${respuesta.status}. ` +
        "Verifica que el backend esté corriendo en http://localhost:8080."
    );
  }
  return (await respuesta.json()) as RespuestaCatalogo;
}
