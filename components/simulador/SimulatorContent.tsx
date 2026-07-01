"use client";

import { useState } from "react";
import { defaultSimulatorParams, calculateKPIs, simulatorLogs, copilotRecommendations } from "@/data/mock-simulator";
import { cn } from "@/lib/utils";
import { ArrowPathIcon, PlayIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";

type ReforestacionLevel = "bajo" | "medio" | "alto";

export function SimulatorContent() {
  const [params, setParams] = useState(defaultSimulatorParams);
  const [running, setRunning] = useState(false);

  const kpis = calculateKPIs(params);

  const handleRun = () => {
    setRunning(true);
    setTimeout(() => setRunning(false), 1200);
  };

  const handleReset = () => {
    setParams(defaultSimulatorParams);
  };

  const updateParam = (key: keyof typeof defaultSimulatorParams, value: number | string) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  const getRecommendation = () => {
    for (const rec of copilotRecommendations) {
      for (const [paramKey, [min, max]] of Object.entries(rec.params)) {
        const val = params[paramKey as keyof typeof params] as number;
        if (val >= min && val <= max) return rec.message;
      }
    }
    return '"Los parámetros actuales muestran un escenario de riesgo moderado. Aumentar la conservación ambiental mejoraría la resiliencia del ecosistema."';
  };

  const sliders = [
    { key: "expansionAgricola" as const, label: "Expansión Agrícola", min: 0, max: 100, unit: "%", minLabel: "Sostenible", maxLabel: "Crítico" },
    { key: "ganaderiaExtensiva" as const, label: "Ganadería Extensiva", min: 0, max: 100, unit: "%", minLabel: "Baja Densidad", maxLabel: "Alta Densidad" },
    { key: "construccionCarreteras" as const, label: "Construcción de Carreteras", min: 0, max: 2500, unit: " Km", minLabel: "Mantenimiento", maxLabel: "Nuevas Troncales" },
    { key: "conservacionAmbiental" as const, label: "Conservación Ambiental", min: 0, max: 1000, unit: "k Ha", minLabel: "Nivel Actual", maxLabel: "Meta COP16" },
    { key: "crecimientoPoblacional" as const, label: "Crecimiento Poblacional", min: 0, max: 30, unit: "%", minLabel: "Estable", maxLabel: "Alto" },
  ];

  const kpiCards = [
    { label: "Biodiversidad", value: kpis.biodiversidad + "%", sublabel: "Variación neta", color: kpis.biodiversidad >= 0 ? "#2E7D32" : "#C62828" },
    { label: "Deforestación", value: kpis.deforestacion + "k", sublabel: "Ha – Proyección Anual", color: "#D4A017" },
    { label: "Impacto Eco.", value: "$" + kpis.impactoEconomico + "M", sublabel: "Servicios Bióticos", color: "#D4A017" },
    { label: "Índice Social", value: kpis.indiceSocial, sublabel: "Estabilidad Regional", color: "#1B5E20" },
    { label: "Riesgo Climático", value: kpis.riesgoLabel, sublabel: null, color: kpis.riesgoLabel === "ALTO" ? "#C62828" : kpis.riesgoLabel === "MEDIO" ? "#D4A017" : "#2E7D32", isAlert: true },
  ];

  return (
    <div className="flex flex-col min-h-screen">
      {/* Custom header for simulator */}
      <header
        className="sticky top-0 z-40 flex items-center justify-between px-6 border-b"
        style={{ backgroundColor: "#F5F3EC", borderColor: "#D8D4C8", height: 64 }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📊</span>
          <div>
            <h2 className="text-base font-semibold" style={{ color: "#1E293B" }}>
              AmazonIA Simulation Center
            </h2>
            <p className="text-xs" style={{ color: "#64748B" }}>
              Visualización satelital de escenarios multivariables
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-4 text-sm" style={{ color: "#64748B" }}>
            <span className="cursor-pointer hover:text-green-800">Reports</span>
            <span className="cursor-pointer hover:text-green-800">Policy</span>
          </nav>
          <div className="w-px h-6" style={{ backgroundColor: "#D8D4C8" }} />
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm border transition-all hover:bg-white"
            style={{ borderColor: "#D8D4C8", color: "#64748B" }}
          >
            <ArrowPathIcon className="w-4 h-4" />
            Reset
          </button>
          <button
            onClick={handleRun}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ backgroundColor: "#0F5132" }}
          >
            <PlayIcon className="w-4 h-4" />
            {running ? "Running..." : "Run Simulation"}
          </button>
        </div>
      </header>

      <div className="flex flex-1" style={{ minHeight: "calc(100vh - 64px)" }}>
        {/* Left panel: variable controls */}
        <div
          className="flex-shrink-0 overflow-y-auto"
          style={{ width: 320, backgroundColor: "#FAFAF7", borderRight: "1px solid #D8D4C8" }}
        >
          <div className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <span>⚙️</span>
              <h3 className="font-bold text-base" style={{ color: "#1E293B" }}>
                Panel de Control de Variables
              </h3>
            </div>
            <p className="text-xs mb-6" style={{ color: "#64748B" }}>
              Ajuste los parámetros para simular el impacto ambiental y social.
            </p>

            <div className="space-y-6">
              {sliders.map((slider) => {
                const value = params[slider.key] as number;
                const displayValue =
                  slider.key === "construccionCarreteras"
                    ? `${value.toLocaleString()} Km`
                    : slider.key === "conservacionAmbiental"
                    ? `${Math.round(value / 10) * 10}k Ha`
                    : `${slider.unit === "%" ? "+" : ""}${value}${slider.unit}`;

                return (
                  <div key={slider.key}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>
                        {slider.label}
                      </span>
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded"
                        style={{ backgroundColor: "#0F5132", color: "white" }}
                      >
                        {displayValue}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={slider.min}
                      max={slider.max}
                      value={value}
                      onChange={(e) => updateParam(slider.key, Number(e.target.value))}
                      className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #0F5132 ${((value - slider.min) / (slider.max - slider.min)) * 100}%, #D8D4C8 ${((value - slider.min) / (slider.max - slider.min)) * 100}%)`,
                      }}
                    />
                    <div className="flex justify-between mt-1">
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{slider.minLabel}</span>
                      <span className="text-xs" style={{ color: "#94A3B8" }}>{slider.maxLabel}</span>
                    </div>
                  </div>
                );
              })}

              {/* Reforestation selector */}
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
                  Esfuerzo de Reforestación
                </p>
                <div className="flex gap-2">
                  {(["bajo", "medio", "alto"] as ReforestacionLevel[]).map((level) => (
                    <button
                      key={level}
                      onClick={() => updateParam("esfuerzoReforestacion", level)}
                      className="flex-1 py-2 rounded-lg text-sm font-medium capitalize border transition-all"
                      style={
                        params.esfuerzoReforestacion === level
                          ? { backgroundColor: "#0F5132", color: "white", borderColor: "#0F5132" }
                          : { backgroundColor: "white", color: "#64748B", borderColor: "#D8D4C8" }
                      }
                    >
                      {level.charAt(0).toUpperCase() + level.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Simulation logs */}
          <div
            className="mx-4 mb-4 rounded-lg p-3 text-xs font-mono"
            style={{ backgroundColor: "#1E293B", color: "#94A3B8" }}
          >
            {simulatorLogs.map((log, i) => (
              <div key={i} className="flex gap-2">
                <span
                  style={{
                    color: log.type === "ok" ? "#4CAF50" : log.type === "wrn" ? "#D4A017" : "#64748B",
                  }}
                >
                  [{log.type.toUpperCase()}]
                </span>
                <span>{log.message}</span>
              </div>
            ))}
            {running && (
              <div className="flex gap-2" style={{ color: "#4CAF50" }}>
                <span>[RUN]</span>
                <span>Processing biome simulation...</span>
              </div>
            )}
          </div>

          <div className="px-4 pb-4">
            <button
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium border transition-all hover:bg-white"
              style={{ borderColor: "#D8D4C8", color: "#64748B" }}
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              Export Analysis
            </button>
          </div>
        </div>

        {/* Center: Map + copilot */}
        <div className="flex-1 flex flex-col">
          {/* Map header */}
          <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: "#D8D4C8" }}>
            <div>
              <h3 className="font-bold" style={{ color: "#1E293B" }}>Impacto Proyectado en Tiempo Real</h3>
              <p className="text-xs" style={{ color: "#64748B" }}>Visualización satelital de escenarios multivariables.</p>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold" style={{ color: "#C62828" }}>
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: "#C62828" }} />
              LIVE SCENARIO
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative" style={{ minHeight: 400 }}>
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(160deg, #1a3d1a 0%, #2d5a2d 30%, #1B5E20 60%, #0d3d1a 100%)",
              }}
            >
              <svg viewBox="0 0 600 500" className="w-full h-full opacity-70">
                <defs>
                  <radialGradient id="srisk1" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#FF4500" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
                  </radialGradient>
                </defs>
                {/* Terrain lines */}
                {[0, 40, 80, 120, 160, 200, 240, 280].map((y) => (
                  <path
                    key={y}
                    d={`M0,${y} Q150,${y + 15} 300,${y + 5} Q450,${y - 10} 600,${y}`}
                    stroke="rgba(255,255,255,0.04)"
                    strokeWidth="1"
                    fill="none"
                  />
                ))}
                {/* Deforestation risk zones based on params */}
                <ellipse
                  cx="380"
                  cy="200"
                  rx={30 + params.expansionAgricola * 0.4}
                  ry={25 + params.expansionAgricola * 0.3}
                  fill="url(#srisk1)"
                  opacity={0.5 + params.expansionAgricola / 200}
                />
                <ellipse
                  cx="300"
                  cy="280"
                  rx={20 + params.ganaderiaExtensiva * 0.3}
                  ry={18 + params.ganaderiaExtensiva * 0.25}
                  fill="url(#srisk1)"
                  opacity={0.4 + params.ganaderiaExtensiva / 200}
                />
                {/* Road overlay */}
                <path
                  d="M100,150 Q250,170 380,200 Q450,220 500,260"
                  stroke="#D4A017"
                  strokeWidth={1 + params.construccionCarreteras / 500}
                  strokeDasharray="8,4"
                  fill="none"
                  opacity="0.8"
                />
              </svg>

              {/* Layer legend */}
              <div
                className="absolute bottom-4 left-4 rounded-lg p-3 text-xs shadow-lg"
                style={{ backgroundColor: "rgba(20,30,20,0.85)", color: "white" }}
              >
                <p className="font-semibold mb-2">Capas de Datos</p>
                <div className="space-y-1.5">
                  {[
                    { color: "#2E7D32", label: "Reserva Forestal" },
                    { color: "#4CAF50", label: "Reforestación Activa" },
                    { color: "#C62828", label: "Riesgo de Tala" },
                  ].map((l) => (
                    <div key={l.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                      <span>{l.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copilot floating card */}
              <div
                className="absolute top-4 right-4 rounded-xl p-4 shadow-xl"
                style={{ backgroundColor: "rgba(245,243,236,0.97)", maxWidth: 280, border: "1px solid #D8D4C8" }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">🤖</span>
                  <span className="font-bold text-sm" style={{ color: "#1E293B" }}>AmazonIA Copilot</span>
                </div>
                <p className="text-xs" style={{ color: "#64748B", lineHeight: "1.5" }}>
                  {getRecommendation()}
                </p>
              </div>
            </div>
          </div>

          {/* KPI bar */}
          <div
            className="grid border-t"
            style={{ gridTemplateColumns: "repeat(5, 1fr)", borderColor: "#D8D4C8" }}
          >
            {kpiCards.map((kpi, i) => (
              <div
                key={kpi.label}
                className="p-4 flex flex-col gap-1 border-r last:border-r-0"
                style={{ borderColor: "#D8D4C8", backgroundColor: kpi.isAlert ? (kpis.riesgoLabel === "ALTO" ? "#C6282812" : "#D4A01712") : "white" }}
              >
                <div className="flex items-center gap-1.5">
                  <span className="text-xs" style={{ color: "#64748B" }}>{kpi.label}</span>
                  {i === 0 && <span style={{ color: kpis.biodiversidad >= 0 ? "#2E7D32" : "#C62828", fontSize: 10 }}>▼</span>}
                </div>
                <span
                  className="text-xl font-bold"
                  style={{ color: kpi.color }}
                >
                  {kpi.value}
                </span>
                {kpi.sublabel && (
                  <span className="text-xs" style={{ color: "#94A3B8" }}>{kpi.sublabel}</span>
                )}
                {kpi.isAlert && (
                  <div className="flex items-center gap-1 text-xs">
                    <span>⚠️</span>
                    <span style={{ color: kpi.color, fontWeight: 600 }}>ALTO</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
