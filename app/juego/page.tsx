"use client";

import { GameContent } from "@/components/juego/GameContent";
import { Header } from "@/components/layout/Header";

export default function JuegoPage() {
  return (
    <div>
      <Header title="Estado del Amazonas" />
      <GameContent />
    </div>
  );
}
