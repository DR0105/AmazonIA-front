"use client";

export function PredictionsMap() {
  return (
    <div
      className="rounded-xl overflow-hidden border relative"
      style={{ borderColor: "#D8D4C8", height: 420, backgroundColor: "#1a2a1a" }}
    >
      {/* Heatmap background */}
      <svg viewBox="0 0 400 380" className="absolute inset-0 w-full h-full">
        <defs>
          <radialGradient id="risk1" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#C62828" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#C62828" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="risk2" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4A017" stopOpacity="0.75" />
            <stop offset="100%" stopColor="#D4A017" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="risk3" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#D4A017" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#D4A017" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="bg" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#2d5a1a" />
            <stop offset="100%" stopColor="#0d2d0d" />
          </radialGradient>
        </defs>

        {/* Base terrain */}
        <rect width="400" height="380" fill="url(#bg)" />

        {/* Colombia silhouette */}
        <path
          d="M130,30 L220,18 L270,50 L295,90 L305,140 L290,190 L315,240 L300,290 L265,330 L235,360 L200,370 L165,355 L135,320 L105,285 L75,255 L55,210 L60,165 L75,115 L100,65 Z"
          fill="#2E7D32"
          stroke="#1B5E20"
          strokeWidth="2"
          opacity="0.7"
        />

        {/* Critical risk zones */}
        <ellipse cx="255" cy="140" rx="55" ry="45" fill="url(#risk1)" />
        <ellipse cx="210" cy="210" rx="40" ry="35" fill="url(#risk2)" />
        <ellipse cx="275" cy="230" rx="35" ry="28" fill="url(#risk1)" />
        <ellipse cx="170" cy="165" rx="30" ry="25" fill="url(#risk3)" />
        <ellipse cx="130" cy="245" rx="25" ry="20" fill="url(#risk3)" />

        {/* Agricultural frontier line */}
        <path
          d="M100,180 Q180,150 250,170 Q300,185 310,240"
          stroke="#D4A017"
          strokeWidth="2"
          strokeDasharray="8,4"
          fill="none"
          opacity="0.8"
        />
      </svg>

      {/* Layer controls */}
      <div
        className="absolute top-4 left-4 rounded-lg p-3 text-xs shadow-lg"
        style={{ backgroundColor: "rgba(255,255,255,0.9)" }}
      >
        <p className="font-bold uppercase tracking-wider mb-2" style={{ color: "#64748B", fontSize: 10 }}>
          Capas
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#C62828" }} />
            <span style={{ color: "#1E293B" }}>Riesgo Crítico</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#D4A017" }} />
            <span style={{ color: "#1E293B" }}>Riesgo Moderado</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-1 rounded" style={{ backgroundColor: "#D4A017", borderTop: "2px dashed #D4A017" }} />
            <span style={{ color: "#1E293B" }}>Frontera Agrícola</span>
          </div>
        </div>
      </div>

      {/* Info badge */}
      <div
        className="absolute top-4 right-4 px-3 py-1.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: "rgba(198,40,40,0.9)", color: "white" }}
      >
        🔴 HEATMAP PROBABILÍSTICO
      </div>

      {/* Coordinates */}
      <div
        className="absolute bottom-4 left-4 text-xs font-mono"
        style={{ color: "rgba(255,255,255,0.6)" }}
      >
        Proyección 2030 | Resolución: 30m
      </div>
    </div>
  );
}
