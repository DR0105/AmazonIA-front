"use client";

import { scenarios } from "@/data/mock-predictions";

export function ScenarioCards() {
  return (
    <div className="rounded-xl p-5 border bg-white" style={{ borderColor: "#D8D4C8" }}>
      <h3 className="font-semibold text-base mb-1" style={{ color: "#1E293B" }}>
        Escenarios Proyectados
      </h3>
      <p className="text-xs mb-4" style={{ color: "#64748B" }}>
        Comparativa de impacto según política ambiental
      </p>

      <div className="space-y-4">
        {scenarios.map((scenario) => (
          <div
            key={scenario.id}
            className="rounded-xl p-4 border"
            style={{
              borderColor: scenario.riskColor + "40",
              backgroundColor: scenario.riskColor + "08",
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h4 className="font-bold text-sm" style={{ color: "#1E293B" }}>
                  {scenario.title}
                </h4>
                <p className="text-xs" style={{ color: "#64748B" }}>
                  {scenario.subtitle}
                </p>
              </div>
              <span
                className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ backgroundColor: scenario.riskColor, color: "white" }}
              >
                {scenario.risk}
              </span>
            </div>

            <p className="text-xs mb-3" style={{ color: "#64748B", lineHeight: "1.5" }}>
              {scenario.description}
            </p>

            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "2030", value: scenario.year2030 },
                { label: "2035", value: scenario.year2035 },
              ].map((proj) => (
                <div
                  key={proj.label}
                  className="rounded-lg p-2 text-center"
                  style={{ backgroundColor: "rgba(255,255,255,0.7)" }}
                >
                  <p className="text-xs" style={{ color: "#94A3B8" }}>{proj.label}</p>
                  <p className="text-sm font-bold" style={{ color: scenario.riskColor }}>
                    {proj.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-3">
              <div className="flex justify-between text-xs mb-1">
                <span style={{ color: "#64748B" }}>Probabilidad</span>
                <span style={{ color: scenario.riskColor, fontWeight: 600 }}>
                  {scenario.probability}%
                </span>
              </div>
              <div className="w-full h-1.5 rounded-full" style={{ backgroundColor: "#E8E4D8" }}>
                <div
                  className="h-full rounded-full"
                  style={{ width: `${scenario.probability}%`, backgroundColor: scenario.riskColor }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
