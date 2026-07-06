import type { NextConfig } from "next";

/**
 * URL del backend del catálogo. Se puede sobrescribir con la variable de entorno
 * `CATALOG_UPSTREAM` (útil si el backend no corre en localhost:8080).
 */
const CATALOG_UPSTREAM =
  process.env.CATALOG_UPSTREAM ?? "http://localhost:8080/api/v1/catalog";

const nextConfig: NextConfig = {
  /**
   * Proxy same-origin hacia el backend para evitar CORS: el navegador pide
   * `/api/catalog` (mismo origen) y Next lo redirige al backend real.
   */
  async rewrites() {
    return [
      {
        source: "/api/catalog",
        destination: CATALOG_UPSTREAM,
      },
    ];
  },
};

export default nextConfig;
