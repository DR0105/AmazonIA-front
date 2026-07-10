"use client";

import { useGuestSessionToken } from "@/lib/juego/useGuestSessionToken";
import { useGame } from "@/lib/juego/useGame";
import { TableroDeCartas } from "@/components/juego/tablero/TableroDeCartas";

export function GameContent() {
  // 1. Gestiona el token guest (ya implementado: crea, refresca, renueva)
  useGuestSessionToken();

  // 2. Crea la partida en cuanto el token esté listo y guarda el id
  const { gameId, cargando, error } = useGame();

  if (cargando) {
    return (
      <div className="p-6 flex items-center gap-3" style={{ color: "#64748B" }}>
        <span
          className="w-3 h-3 rounded-full animate-pulse"
          style={{ backgroundColor: "#0F5132" }}
        />
        Iniciando partida…
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="p-6 rounded-xl border mx-6 mt-6 text-sm"
        style={{ borderColor: "#C62828", backgroundColor: "#FFF5F5", color: "#C62828" }}
      >
        <strong>Error al crear la partida:</strong> {error}
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* gameId disponible para los próximos endpoints (play card, end turn…) */}
      {process.env.NODE_ENV === "development" && (
        <p className="text-xs mb-3 font-mono" style={{ color: "#94A3B8" }}>
          game_id: {gameId}
        </p>
      )}
      <TableroDeCartas />
    </div>
  );
}
