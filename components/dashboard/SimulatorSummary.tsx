"use client";

import { useState } from "react";

interface CircularGaugeProps {
  value: number;
  label: string;
  color: string;
}

function CircularGauge({ value, label, color }: CircularGaugeProps) {
  const radius = 36;
  const stroke = 6;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <svg width={radius * 2} height={radius * 2}>
          <circle
            stroke="#E8E4D8"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%", transition: "stroke-dashoffset 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-base font-bold" style={{ color: "#1E293B" }}>
            {value}%
          </span>
        </div>
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-center" style={{ color: "#64748B" }}>
        {label}
      </p>
    </div>
  );
}

export function SimulatorSummary() {
  const [expansionAgricola, setExpansionAgricola] = useState(50);
  const [reforestacion, setReforestacion] = useState(75);
  const [infraestructura, setInfraestructura] = useState(35);

  const riesgoClimatico = Math.round(
    30 + expansionAgricola * 0.3 + infraestructura * 0.2 - reforestacion * 0.2
  );
  const retencionCarbono = Math.round(
    30 + reforestacion * 0.4 - expansionAgricola * 0.15
  );

  return (
    <div className="rounded-xl p-5 border bg-white" style={{ borderColor: "#D8D4C8" }}>
      <h3 className="font-semibold text-base mb-4" style={{ color: "#1E293B" }}>
        Simulador de Escenarios Ambientales
      </h3>

      <div className="flex gap-6">
        {/* Sliders */}
        <div className="flex-1 space-y-4">
          {[
            {
              label: "Expansión Agrícola",
              value: expansionAgricola,
              setValue: setExpansionAgricola,
              suffix: `+${expansionAgricola}%`,
            },
            {
              label: "Esfuerzo de Reforestación",
              value: reforestacion,
              setValue: setReforestacion,
              suffix: reforestacion > 66 ? "High" : reforestacion > 33 ? "Medium" : "Low",
            },
            {
              label: "Infraestructura Vial",
              value: infraestructura,
              setValue: setInfraestructura,
              suffix: infraestructura > 66 ? "High" : infraestructura > 33 ? "Medium" : "Low",
            },
          ].map((slider) => (
            <div key={slider.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm" style={{ color: "#1E293B" }}>
                  {slider.label}
                </span>
                <span className="text-sm font-semibold" style={{ color: "#0F5132" }}>
                  {slider.suffix}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={slider.value}
                onChange={(e) => slider.setValue(Number(e.target.value))}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #0F5132 ${slider.value}%, #D8D4C8 ${slider.value}%)`,
                  accentColor: "#0F5132",
                }}
              />
            </div>
          ))}
        </div>

        {/* Gauges */}
        <div className="flex gap-6 items-center">
          <CircularGauge
            value={Math.min(100, Math.max(0, riesgoClimatico))}
            label="Riesgo Climático"
            color="#D4A017"
          />
          <CircularGauge
            value={Math.min(100, Math.max(0, retencionCarbono))}
            label="Retención de Carbono"
            color="#2E7D32"
          />
        </div>
      </div>
    </div>
  );
}
