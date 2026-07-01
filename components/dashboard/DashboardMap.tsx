"use client";

import { useState } from "react";
import { PlusIcon, MinusIcon } from "@heroicons/react/24/outline";

export function DashboardMap() {
  const [layers, setLayers] = useState({
    deforestacion: true,
    areasProtegidas: true,
    focosIncendio: false,
  });

  const toggleLayer = (key: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div
      className="rounded-xl overflow-hidden border relative"
      style={{ borderColor: "#D8D4C8", height: 420 }}
    >
      {/* Map background - Colombia satellite imagery simulation */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, #1a4a1a 0%, #2d6a2d 20%, #1B5E20 40%, #0d3d0d 60%, #2d5a1a 80%, #1a3d0a 100%)",
        }}
      >
        {/* SVG Colombia shape overlay */}
        <svg viewBox="0 0 300 380" className="absolute inset-0 w-full h-full opacity-80">
          {/* Simplified Colombia silhouette */}
          <defs>
            <radialGradient id="hotspot1" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF6B00" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#FF6B00" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hotspot2" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#FF4500" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#FF4500" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Colombia body */}
          <path
            d="M110,30 L180,20 L220,50 L240,80 L250,120 L240,160 L260,200 L250,240 L220,270 L200,300 L180,330 L160,350 L140,340 L120,310 L100,280 L80,250 L60,220 L50,180 L60,140 L70,100 L90,60 Z"
            fill="#2E7D32"
            stroke="#1B5E20"
            strokeWidth="2"
          />

          {/* Deforestation heat areas */}
          {layers.deforestacion && (
            <>
              <ellipse cx="200" cy="120" rx="35" ry="28" fill="url(#hotspot1)" />
              <ellipse cx="170" cy="180" rx="25" ry="20" fill="url(#hotspot2)" />
              <ellipse cx="210" cy="200" rx="20" ry="15" fill="url(#hotspot1)" />
            </>
          )}

          {/* Protected areas */}
          {layers.areasProtegidas && (
            <>
              <circle cx="120" cy="250" r="20" fill="#0F5132" opacity="0.6" stroke="#4CAF50" strokeWidth="1.5" />
              <circle cx="90" cy="200" r="15" fill="#0F5132" opacity="0.6" stroke="#4CAF50" strokeWidth="1.5" />
              <circle cx="150" cy="290" r="18" fill="#0F5132" opacity="0.6" stroke="#4CAF50" strokeWidth="1.5" />
            </>
          )}

          {/* Fire hotspots */}
          {layers.focosIncendio && (
            <>
              <circle cx="195" cy="115" r="5" fill="#FF0000" opacity="0.9" />
              <circle cx="215" cy="195" r="4" fill="#FF4500" opacity="0.9" />
              <circle cx="175" cy="175" r="3" fill="#FF6B00" opacity="0.9" />
            </>
          )}
        </svg>

        {/* Terrain texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.03) 10px, rgba(0,0,0,0.03) 20px)",
          }}
        />
      </div>

      {/* Map controls overlay */}
      <div className="absolute top-4 left-4 z-10">
        <div
          className="rounded-lg p-3 shadow-lg"
          style={{ backgroundColor: "rgba(255,255,255,0.95)", minWidth: 160 }}
        >
          <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
            Capas del Mapa
          </p>
          {[
            { key: "deforestacion" as const, label: "Deforestación", color: "#FF6B00" },
            { key: "areasProtegidas" as const, label: "Áreas Protegidas", color: "#2E7D32" },
            { key: "focosIncendio" as const, label: "Focos de Incendio", color: "#C62828" },
          ].map((layer) => (
            <label key={layer.key} className="flex items-center gap-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={layers[layer.key]}
                onChange={() => toggleLayer(layer.key)}
                className="w-3.5 h-3.5 rounded"
                style={{ accentColor: layer.color }}
              />
              <span className="text-xs" style={{ color: "#1E293B" }}>
                {layer.label}
              </span>
            </label>
          ))}
        </div>

        {/* Zoom controls */}
        <div className="mt-2 rounded-lg overflow-hidden shadow-lg" style={{ backgroundColor: "rgba(255,255,255,0.95)" }}>
          <button className="flex items-center justify-center w-9 h-9 hover:bg-gray-100 transition-colors border-b" style={{ borderColor: "#e5e5e5" }}>
            <PlusIcon className="w-4 h-4" style={{ color: "#1E293B" }} />
          </button>
          <button className="flex items-center justify-center w-9 h-9 hover:bg-gray-100 transition-colors">
            <MinusIcon className="w-4 h-4" style={{ color: "#1E293B" }} />
          </button>
        </div>
      </div>

      {/* Legend */}
      <div
        className="absolute bottom-4 right-4 rounded-lg p-3 shadow-lg text-xs"
        style={{ backgroundColor: "rgba(20,30,20,0.85)", color: "white" }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#2E7D32" }} />
          <span>Bosque Primario</span>
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#C62828" }} />
          <span>Pérdida Crítica</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#FF6B00" }} />
          <span>Zona de Transición</span>
        </div>
      </div>

      {/* Coordinates */}
      <div
        className="absolute bottom-4 left-4 text-xs font-mono"
        style={{ color: "rgba(255,255,255,0.7)" }}
      >
        LAT: 3.4653° N | LNG: -74.2159° W
      </div>
    </div>
  );
}
