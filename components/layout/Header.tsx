"use client";

import {
  BellIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";

import { GameSessionExpiryButton } from "@/components/juego/GameSessionExpiryButton";
import { useGuestSessionToken } from "@/lib/juego/useGuestSessionToken";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

function descargarCSV(pathname: string) {
  if (pathname.startsWith("/predicciones")) {
    // Genera CSV desde los datos de predicciones via API
    fetch("/api/predicciones")
      .then((r) => r.json())
      .then((data) => {
        const rows = data.predicciones_proximos_6_meses ?? [];
        if (!rows.length) return;
        const headers = Object.keys(rows[0]).join(",");
        const body = rows
          .map((r: Record<string, unknown>) => Object.values(r).join(","))
          .join("\n");
        bajarArchivo(`${headers}\n${body}`, "predicciones_amazonia.csv");
      });
  } else {
    // Histórico: descarga el CSV original directamente (no pasa por JSON)
    const a = document.createElement("a");
    a.href = "/api/export-historico";
    a.download = "focos_historicos_amazonia_2017_hoy.csv";
    a.click();
  }
}

function bajarArchivo(contenido: string, nombre: string) {
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8;" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = nombre;
  a.click();
  URL.revokeObjectURL(url);
}

export function Header({ title, subtitle }: HeaderProps) {
  const pathname = usePathname();
  const showGameSessionButton = pathname.startsWith("/juego");
  useGuestSessionToken(showGameSessionButton);

  // Mostrar el botón Export solo en páginas de datos
  const showExport = pathname.startsWith("/predicciones") || pathname.startsWith("/historico");

  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: "#F5F3EC",
        borderColor: "#D8D4C8",
        height: 64,
      }}
    >
      {/* Left: title */}
      <div>
        <h2
          className="text-lg font-semibold leading-tight"
          style={{ color: "#1E293B" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs" style={{ color: "#64748B" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {showGameSessionButton && <GameSessionExpiryButton />}

        {/* Date range */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm"
          style={{
            borderColor: "#D8D4C8",
            backgroundColor: "white",
            color: "#64748B",
          }}
        >
          <span>Enero 2017 – Presente</span>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium"
          style={{
            borderColor: "#D8D4C8",
            backgroundColor: "white",
            color: "#64748B",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse-dot"
            style={{ backgroundColor: "#2E7D32" }}
          />
          Live Data
        </div>

        {/* Export — solo en páginas de datos */}
        {showExport && (
          <button
            onClick={() => descargarCSV(pathname)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#0F5132" }}
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            Export Report
          </button>
        )}
      </div>
    </header>
  );
}

