"use client";

import { useState } from "react";

import {
  getCurrentSessionInfo,
  getStoredAccessToken,
  createGuestSession,
} from "@/lib/juego/session";

function formatExpiresAt(expiresAt: string | null): string {
  if (!expiresAt) {
    return "Sin expiración";
  }

  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) {
    return expiresAt;
  }

  return new Intl.DateTimeFormat("es-CO", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function GameSessionExpiryButton() {
  const [label, setLabel] = useState("Ver expiración");
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    if (busy) {
      return;
    }

    setBusy(true);

    try {
      let token = getStoredAccessToken();
      if (!token) {
        token = await createGuestSession();
      }

      const info = await getCurrentSessionInfo(token);
      setLabel(`Expira: ${formatExpiresAt(info.expiresAt)}`);
    } catch (error) {
      console.error("No se pudo consultar la expiración de la sesión:", error);
      setLabel("Sesión no disponible");
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90"
      style={{
        borderColor: "#D8D4C8",
        backgroundColor: "white",
        color: "#64748B",
      }}
      title="Consultar expiración del access token"
    >
      <span
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: "#2E7D32" }}
      />
      <span>{busy ? "Consultando..." : label}</span>
    </button>
  );
}
