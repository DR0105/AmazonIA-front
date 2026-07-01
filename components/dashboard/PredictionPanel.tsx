"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";

export function PredictionPanel() {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 h-full"
      style={{ backgroundColor: "#0F5132", color: "white" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🤖</span>
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
              Predicción IA 2030
            </span>
          </div>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
            Basado en el modelo AmazonNet-v4. Análisis de vectores de expansión agrícola.
          </p>
        </div>
        <span className="text-white/40 text-lg">?</span>
      </div>

      {/* Confidence */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.5)" }}>
            Confianza del Modelo
          </span>
          <span className="text-sm font-bold" style={{ color: "#4CAF50" }}>
            94.2%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.15)" }}>
          <div
            className="h-full rounded-full"
            style={{ width: "94.2%", backgroundColor: "#4CAF50" }}
          />
        </div>
      </div>

      {/* Impact */}
      <div
        className="rounded-lg p-3"
        style={{ backgroundColor: "rgba(255,255,255,0.08)" }}
      >
        <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.5)" }}>
          Impacto Proyectado
        </p>
        <p className="text-2xl font-bold" style={{ color: "#FF6B35" }}>
          +2.1M Hectáreas
        </p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
          Scenario: Business as Usual
        </p>
      </div>

      {/* CTA */}
      <Link
        href="/predicciones"
        className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all hover:opacity-90 mt-auto"
        style={{ backgroundColor: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)", color: "white" }}
      >
        Ver Análisis de Factores
        <ArrowRightIcon className="w-4 h-4" />
      </Link>
    </div>
  );
}
