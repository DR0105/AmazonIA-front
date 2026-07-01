"use client";

import { featureImportance } from "@/data/mock-predictions";

export function FeatureImportance() {
  return (
    <div className="rounded-xl p-5 border bg-white" style={{ borderColor: "#D8D4C8" }}>
      <h3 className="font-semibold text-base mb-1" style={{ color: "#1E293B" }}>
        Importancia de Variables
      </h3>
      <p className="text-xs mb-4" style={{ color: "#64748B" }}>
        Contribución de cada factor al modelo predictivo
      </p>

      <div className="space-y-4">
        {featureImportance.map((feature) => (
          <div key={feature.name}>
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-sm" style={{ color: "#1E293B" }}>
                {feature.name}
              </span>
              <span className="text-sm font-semibold" style={{ color: feature.color }}>
                {feature.value}%
              </span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ backgroundColor: "#E8E4D8" }}>
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{ width: `${feature.value}%`, backgroundColor: feature.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
