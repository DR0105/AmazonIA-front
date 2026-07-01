"use client";

import { predictionMetrics } from "@/data/mock-predictions";

export function AIMetricsCards() {
  return (
    <div className="flex flex-col gap-4">
      {/* Accuracy */}
      <div className="rounded-xl p-4 border bg-white" style={{ borderColor: "#D8D4C8" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
          Accuracy del Modelo
        </p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold" style={{ color: "#0F5132" }}>
            {predictionMetrics.accuracy}
          </span>
          <span className="text-lg font-semibold mb-1" style={{ color: "#64748B" }}>%</span>
        </div>
        <div className="mt-2 w-full h-2 rounded-full" style={{ backgroundColor: "#E8E4D8" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${predictionMetrics.accuracy}%`, backgroundColor: "#0F5132" }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>
          Validación cruzada k=10
        </p>
      </div>

      {/* Confidence */}
      <div className="rounded-xl p-4 border bg-white" style={{ borderColor: "#D8D4C8" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
          Confianza Predictiva
        </p>
        <div className="flex items-end gap-2">
          <span className="text-3xl font-bold" style={{ color: "#1B5E20" }}>
            {predictionMetrics.confidence}
          </span>
          <span className="text-lg font-semibold mb-1" style={{ color: "#64748B" }}>%</span>
        </div>
        <div className="mt-2 w-full h-2 rounded-full" style={{ backgroundColor: "#E8E4D8" }}>
          <div
            className="h-full rounded-full"
            style={{ width: `${predictionMetrics.confidence}%`, backgroundColor: "#1B5E20" }}
          />
        </div>
        <p className="text-xs mt-1.5" style={{ color: "#94A3B8" }}>
          Intervalo confianza 95%
        </p>
      </div>

      {/* Architecture */}
      <div className="rounded-xl p-4 border bg-white" style={{ borderColor: "#D8D4C8" }}>
        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
          Arquitectura Utilizada
        </p>
        <div
          className="px-3 py-2 rounded-lg text-sm font-bold"
          style={{ backgroundColor: "#F5F3EC", color: "#0F5132" }}
        >
          {predictionMetrics.architecture}
        </div>
        <div className="mt-3 space-y-1.5">
          {[
            { label: "Entrenamiento", value: predictionMetrics.dataPoints + " registros" },
            { label: "Última versión", value: predictionMetrics.lastTrained },
            { label: "Tipo", value: "Random Forest + LSTM" },
          ].map((item) => (
            <div key={item.label} className="flex justify-between text-xs">
              <span style={{ color: "#94A3B8" }}>{item.label}</span>
              <span style={{ color: "#1E293B", fontWeight: 500 }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
