import type { NextConfig } from "next";

const BACKEND_BASE =
  process.env.BACKEND_URL ?? "http://localhost:8080/api/v1";

const nextConfig: NextConfig = {
  env: {
    BACKEND_URL: BACKEND_BASE,
  },
  async rewrites() {
    return [
      {
        source: "/api/catalog",
        destination: `${BACKEND_BASE}/catalog`,
      },
      {
        // POST /api/games  → POST http://localhost:8080/api/v1/games
        // GET  /api/games/:id → GET http://localhost:8080/api/v1/games/:id
        source: "/api/games",
        destination: `${BACKEND_BASE}/games`,
      },
      {
        source: "/api/games/:id",
        destination: `${BACKEND_BASE}/games/:id`,
      },
      {
        source: "/api/games/:id/commands",
        destination: `${BACKEND_BASE}/games/:id/commands`,
      },
    ];
  },
};

export default nextConfig;
