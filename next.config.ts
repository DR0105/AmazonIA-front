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
        source: "/api/sessions/guest",
        destination: `${BACKEND_BASE}/sessions/guest`,
      },
      {
        source: "/api/sessions/current",
        destination: `${BACKEND_BASE}/sessions/current`,
      },
      {
        source: "/api/sessions/refresh",
        destination: `${BACKEND_BASE}/sessions/refresh`,
      },
      {
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
