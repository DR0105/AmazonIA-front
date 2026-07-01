"use client";

import { useState } from "react";
import { initialGameState, activeEvents, tippingPointWarning, gameActions, mapZones } from "@/data/mock-game";
import {
  GlobeAmericasIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  QuestionMarkCircleIcon,
  BellIcon,
  PhotoIcon,
} from "@heroicons/react/24/outline";

export function GameContent() {
  const [gameState, setGameState] = useState(initialGameState);
  const [events, setEvents] = useState(activeEvents);
  const [selectedZone, setSelectedZone] = useState<string | null>(null);

  const resolveEvent = (id: string) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === id ? { ...e, resolved: !e.resolved } : e))
    );
  };

  const applyAction = (action: typeof gameActions[0]) => {
    setGameState((prev) => ({
      ...prev,
      woodStock: prev.woodStock + (action.effect.woodStock || 0),
      bioPoints: prev.bioPoints + (action.effect.bioPoints || 0),
      funding: +(prev.funding + (action.effect.funding || 0)).toFixed(2),
      deforestationLevel: Math.max(0, +(prev.deforestationLevel + (action.effect.deforestation || 0)).toFixed(1)),
    }));
  };

  const deforestPct = gameState.deforestationLevel;
  const deforestColor = deforestPct > 50 ? "#C62828" : deforestPct > 30 ? "#D4A017" : "#2E7D32";

  const sidebarNav = [
    { label: "Territories", icon: GlobeAmericasIcon },
    { label: "Industry", icon: BuildingOfficeIcon },
    { label: "Population", icon: UsersIcon },
    { label: "Reports", icon: ChartBarIcon },
  ];

  return (
    <div
      className="flex min-h-screen"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Game Sidebar */}
      <aside
        className="fixed left-0 top-0 h-full flex flex-col z-50"
        style={{ width: 280, backgroundColor: "#0F5132" }}
      >
        <div className="px-6 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.1)" }}>
          <h1 className="text-white font-bold text-xl">AmazonIA</h1>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>
            Strategic Bio-Monitor
          </p>
        </div>

        <nav className="flex-1 px-3 py-4">
          <ul className="space-y-1">
            {sidebarNav.map(({ label, icon: Icon }) => (
              <li key={label}>
                <button
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:text-white hover:bg-white/10 transition-all"
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Emergency button */}
        <div className="px-4 pb-4">
          <button
            className="w-full py-2.5 rounded-lg text-sm font-bold uppercase tracking-wider transition-all hover:opacity-90"
            style={{ backgroundColor: "#C62828", color: "white" }}
          >
            Emergency Protocol
          </button>
        </div>

        <div className="px-3 pb-4 border-t space-y-1" style={{ borderColor: "rgba(255,255,255,0.1)", paddingTop: 12 }}>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:text-white hover:bg-white/10 transition-all">
            <Cog6ToothIcon className="w-5 h-5" />
            Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:text-white hover:bg-white/10 transition-all">
            <QuestionMarkCircleIcon className="w-5 h-5" />
            Support
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ marginLeft: 280, flex: 1 }}>
        {/* Game header */}
        <header
          className="sticky top-0 z-40 flex items-center justify-between px-6 border-b"
          style={{ backgroundColor: "#F5F3EC", borderColor: "#D8D4C8", height: 64 }}
        >
          <div className="flex items-center gap-3">
            <button className="p-1.5 rounded">
              <div className="space-y-1">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="w-5 h-0.5 rounded" style={{ backgroundColor: "#64748B" }} />
                ))}
              </div>
            </button>
            <span className="font-bold tracking-widest text-sm" style={{ color: "#1E293B" }}>
              STRATEGIC BIO-BOARD V1.0
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
              style={{ borderColor: "#2E7D32", color: "#2E7D32", backgroundColor: "#F0F7F0" }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse-dot" style={{ backgroundColor: "#2E7D32" }} />
              SYNC: ACTIVE
            </div>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border" style={{ borderColor: "#D8D4C8" }}>
              <BellIcon className="w-5 h-5" style={{ color: "#64748B" }} />
            </button>
            <button className="w-9 h-9 flex items-center justify-center rounded-lg border" style={{ borderColor: "#D8D4C8" }}>
              <PhotoIcon className="w-5 h-5" style={{ color: "#64748B" }} />
            </button>
            <div
              className="w-9 h-9 rounded-full overflow-hidden border-2"
              style={{ borderColor: "#0F5132", backgroundColor: "#1B5E20" }}
            >
              <div className="w-full h-full flex items-center justify-center text-white text-xs font-bold">OE</div>
            </div>
          </div>
        </header>

        {/* Main flex */}
        <div className="flex" style={{ minHeight: "calc(100vh - 64px)" }}>
          {/* Map area */}
          <div
            className="flex-1 relative"
            style={{ backgroundColor: "#E8E4D8" }}
          >
            {/* Coordinates */}
            <div className="absolute top-4 left-4 text-xs font-mono" style={{ color: "#64748B" }}>
              <div>LAT: 3.4653° N</div>
              <div>LONG: 76.5320° W</div>
              <div>ALT: 1,018 M</div>
            </div>

            {/* Map canvas */}
            <div className="absolute inset-0 m-8 mt-16 rounded-xl overflow-hidden" style={{ border: "1px solid #D8D4C8" }}>
              <div
                className="w-full h-full"
                style={{
                  background: "linear-gradient(135deg, #c8d8a8 0%, #a8c890 20%, #90b878 40%, #78a060 60%, #60885048 80%)",
                }}
              >
                {/* Game zones */}
                <svg viewBox="0 0 500 400" className="w-full h-full">
                  {mapZones.map((zone) => {
                    const x = (zone.lng + 80) * 5;
                    const y = (10 - zone.lat) * 20;
                    const zoneColor =
                      zone.status === "critical"
                        ? "#C62828"
                        : zone.status === "danger"
                        ? "#FF4500"
                        : zone.status === "warning"
                        ? "#D4A017"
                        : "#2E7D32";
                    return (
                      <g key={zone.id} onClick={() => setSelectedZone(zone.id)} className="cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r={zone.risk / 5 + 8}
                          fill={zoneColor}
                          opacity={0.25}
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r={8}
                          fill={zoneColor}
                          stroke="white"
                          strokeWidth="1.5"
                        />
                        <text
                          x={x}
                          y={y + 1}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          fill="white"
                          fontSize="8"
                          fontWeight="bold"
                        >
                          {zone.id}
                        </text>
                        {selectedZone === zone.id && (
                          <rect
                            x={x + 12}
                            y={y - 16}
                            width={90}
                            height={32}
                            fill="white"
                            rx="4"
                            opacity="0.95"
                          />
                        )}
                        {selectedZone === zone.id && (
                          <>
                            <text x={x + 17} y={y - 5} fill="#1E293B" fontSize="7" fontWeight="600">
                              {zone.name}
                            </text>
                            <text x={x + 17} y={y + 6} fill={zoneColor} fontSize="7">
                              Risk: {zone.risk}%
                            </text>
                          </>
                        )}
                      </g>
                    );
                  })}
                </svg>

                {/* Action buttons */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                  {gameActions.map((action) => (
                    <button
                      key={action.id}
                      onClick={() => applyAction(action)}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all hover:scale-105 shadow-md"
                      style={{ backgroundColor: "rgba(255,255,255,0.9)", color: "#0F5132", border: "1px solid #D8D4C8" }}
                    >
                      <span className="text-base">{action.icon}</span>
                      <span>{action.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right panel: Game Status */}
          <div
            className="overflow-y-auto flex-shrink-0 p-4 space-y-4"
            style={{ width: 300, borderLeft: "1px solid #D8D4C8", backgroundColor: "#F5F3EC" }}
          >
            <h3 className="font-bold text-lg" style={{ color: "#1E293B" }}>
              Game Status
            </h3>

            {/* Stats */}
            {[
              { label: "WOOD STOCK", value: `${gameState.woodStock.toLocaleString()} units`, change: `+${gameState.woodStockChange}%`, positive: true, icon: "🌲" },
              { label: "BIO POINTS", value: `${gameState.bioPoints.toLocaleString()} pts`, change: `${gameState.bioPointsChange}%`, positive: gameState.bioPointsChange >= 0, icon: "💎" },
              { label: "FUNDING", value: `$${gameState.funding}M`, change: "—", positive: true, icon: "💰" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-xl p-4 border bg-white flex items-center gap-3"
                style={{ borderColor: "#D8D4C8" }}
              >
                <span className="text-2xl">{stat.icon}</span>
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider" style={{ color: "#64748B" }}>
                    {stat.label}
                  </p>
                  <p className="font-bold" style={{ color: "#1E293B" }}>{stat.value}</p>
                </div>
                <span
                  className="text-sm font-semibold"
                  style={{ color: stat.positive ? "#2E7D32" : "#C62828" }}
                >
                  {stat.change}
                </span>
              </div>
            ))}

            {/* Deforestation Level */}
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: "#0F5132", color: "white" }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "rgba(255,255,255,0.6)" }}>
                  Deforestation Level
                </span>
                <span className="text-white/60">⚠</span>
              </div>
              <div className="text-4xl font-bold mb-3">
                {gameState.deforestationLevel}
                <span className="text-2xl">%</span>
              </div>
              <div className="w-full h-2 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.2)" }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${gameState.deforestationLevel}%`, backgroundColor: deforestColor }}
                />
              </div>
            </div>

            {/* Active Events */}
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#64748B" }}>
                Active Events
              </p>
              <div className="space-y-2">
                {events.map((event) => (
                  <div
                    key={event.id}
                    onClick={() => resolveEvent(event.id)}
                    className="rounded-lg p-3 border cursor-pointer hover:opacity-80 transition-all flex items-start gap-2"
                    style={{
                      borderColor: event.resolved
                        ? "#D8D4C8"
                        : event.type === "danger"
                        ? "#C62828"
                        : "#D8D4C8",
                      backgroundColor: event.resolved
                        ? "#FAFAF7"
                        : event.type === "danger"
                        ? "#FFF5F5"
                        : "white",
                      borderLeftWidth: event.type === "danger" ? 3 : 1,
                    }}
                  >
                    <span className="text-base flex-shrink-0">
                      {event.resolved ? "✓" : event.icon}
                    </span>
                    <div>
                      <p
                        className="text-sm font-semibold"
                        style={{
                          color: event.resolved ? "#94A3B8" : "#1E293B",
                          textDecoration: event.resolved ? "line-through" : "none",
                        }}
                      >
                        {event.title}
                      </p>
                      <p className="text-xs" style={{ color: "#94A3B8" }}>
                        {event.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Tipping Point Warning */}
            <div
              className="rounded-xl p-4 border"
              style={{ backgroundColor: "#FFF5F5", borderColor: "#C62828" }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">⚠️</span>
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#C62828" }}>
                  Tipping Point Warning
                </span>
              </div>
              <p className="text-sm" style={{ color: "#C62828" }}>
                {tippingPointWarning.message}
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer
          className="flex items-center justify-between px-6 py-3 border-t"
          style={{ borderColor: "#D8D4C8", backgroundColor: "#F5F3EC" }}
        >
          <div>
            <span className="font-bold" style={{ color: "#1E293B" }}>Raíces&Cultura</span>
            <span className="text-xs ml-3" style={{ color: "#94A3B8" }}>
              © 2026 — Hecho con orgullo latinoamericano
            </span>
          </div>
          <div className="flex gap-4 text-xs" style={{ color: "#94A3B8" }}>
            <span className="cursor-pointer hover:text-green-800">Instagram</span>
            <span className="cursor-pointer hover:text-green-800">Contacto</span>
            <span className="cursor-pointer hover:text-green-800">Privacidad</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
