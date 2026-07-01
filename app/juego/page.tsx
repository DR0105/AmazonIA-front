"use client";

import { GameContent } from "@/components/juego/GameContent";
import { Header } from "@/components/layout/Header";

export default function JuegoPage() {
  return (
    <div>
      <Header title="Estado del Amazonas" />
      <div className="p-6">
        <div
          className="rounded-xl p-8 border bg-white text-center"
          style={{ borderColor: "#D8D4C8" }}
        >
          <div className="text-4xl mb-4">🌿</div>
          <h2
            className="text-xl font-semibold mb-2"
            style={{ color: "#1E293B" }}
          >
            Sección en desarrollo
          </h2>
          <p style={{ color: "#64748B" }}>
            Este módulo estará disponible próximamente.
          </p>
        </div>
      </div>
    </div>
  );
}
