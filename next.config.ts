import type { NextConfig } from "next";

const BACKEND_BASE =
  process.env.BACKEND_URL ?? "http://localhost:8080/api/v1";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/catalog",
        destination: `${BACKEND_BASE}/catalog`,
      },
      {
        // POST /api/games → POST http://localhost:8080/api/v1/games
        source: "/api/games",
        destination: `${BACKEND_BASE}/games`,
      },
    ];
  },
};

export default nextConfig;
