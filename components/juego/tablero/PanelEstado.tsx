"use client";

/**
 * PanelEstado — panel horizontal entre Eventos y Sectores.
 *
 * Columna izquierda: barra de Deforestación (gradiente verde → rojo)
 * Columna derecha:   Recursos (Dinero, Tierra, Personas)
 *
 * Los valores vienen del endpoint del catálogo (scenario.initialResources).
 * Mientras no estén disponibles se muestran los defaults del mockup.
 *
 * ── PERSONALIZACIÓN ──────────────────────────────────────────────────────────
 * - La prop `deforestacion` recibe el valor real del backend (0–2999).
 *   Los doce segmentos representan intervalos consecutivos de 250 puntos.
 * - Para conectar los recursos, pasa `recursos` con { money, land, people }.
 * - Los íconos de árbol/árbol seco y de recursos son placeholders emoji;
 *   reemplázalos con tus SVGs cuando los tengas.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { PARCHMENT } from "./TableroDeCartas";

export interface Recursos {
  money: number;
  land: number;
  people: number;
}

export interface PanelEstadoProps {
  /** Deforestación devuelta por la partida: 0–2999. Default: 340 */
  deforestacion?: number;
  /** Recursos actuales del jugador. Default: mock del escenario inicial */
  recursos?: Recursos;
}

const GRADIENTE_BARRA =
  "linear-gradient(to right, #1a7a1a, #3ea83e, #8ab800, #c8c800, #e08000, #d94000, #b81010)";

/** Segmentos de color de la barra (visual, no funcional) */
const SEGMENTOS = [
  "#1a7a1a",
  "#2e8b2e",
  "#3ea83e",
  "#5cba2e",
  "#8ab800",
  "#b0c000",
  "#c8c800",
  "#dca000",
  "#e08000",
  "#d94000",
  "#cc2800",
  "#b81010",
];

const TAMANO_RANGO = 250;
const MAX_DEFORESTACION = SEGMENTOS.length * TAMANO_RANGO; // 3000

function IndicadorRecurso({
  icono,
  valor,
  etiqueta,
}: {
  icono: string;
  valor: number;
  etiqueta: string;
}) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      {/* Espacio para ícono — TODO: reemplaza el emoji con tu SVG */}
      <span className="text-2xl leading-none" aria-hidden>
        {icono}
      </span>
      <span
        className="text-2xl font-bold leading-none tabular-nums"
        style={{ color: PARCHMENT.text, fontFamily: "'Georgia', serif" }}
      >
        {valor}
      </span>
      <span
        className="text-[10px] font-bold uppercase tracking-[0.15em]"
        style={{ color: PARCHMENT.textMuted }}
      >
        {etiqueta}
      </span>
    </div>
  );
}

export function PanelEstado({
  deforestacion = 340,
  recursos = { money: 2, land: 0, people: 1 },
}: PanelEstadoProps) {
  // Cada uno de los 12 cuadros cubre 250 puntos: 0–249, 250–499, …, 2750–2999.
  const valorDeforestacion = Math.min(
    MAX_DEFORESTACION - 1,
    Math.max(0, deforestacion),
  );
  const indiceRango = Math.floor(valorDeforestacion / TAMANO_RANGO);
  const thumbPct = (valorDeforestacion / (MAX_DEFORESTACION - 1)) * 100;

  return (
    <div
      className="flex gap-2 rounded-2xl overflow-hidden"
      style={{ border: `3px solid ${PARCHMENT.border}` }}
    >
      {/* ── Columna Deforestación (izquierda, ~55%) ── */}
      <div
        className="flex-1 flex flex-col items-center gap-2 p-3"
        style={{ backgroundColor: PARCHMENT.panel }}
      >
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: PARCHMENT.text }}
        >
          Deforestación
        </p>

        <div className="w-full flex items-center gap-2">
          {/* Ícono árbol frondoso — TODO: reemplaza con tu SVG */}
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="text-2xl leading-none" aria-hidden>
              🌳
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
              style={{ color: PARCHMENT.textMuted }}
            >
              Baja
            </span>
          </div>

          {/* Barra segmentada */}
          <div className="flex-1 relative" style={{ height: 22 }}>
            {/* Fondo segmentado */}
            <div
              className="absolute inset-0 rounded-full overflow-hidden"
              style={{
                display: "flex",
                border: `1.5px solid ${PARCHMENT.border}`,
              }}
            >
              {SEGMENTOS.map((color, i) => (
                <div
                  key={i}
                  title={`${i * TAMANO_RANGO}–${(i + 1) * TAMANO_RANGO - 1}`}
                  style={{
                    flex: 1,
                    backgroundColor: color,
                    //opacity: i <= indiceRango ? 1 : 0.28,
                    borderRight:
                      i < SEGMENTOS.length - 1
                        ? "1px solid rgba(0,0,0,0.12)"
                        : "none",
                  }}
                />
              ))}
            </div>

            {/* Indicador (thumb) */}
            <div
              aria-label={`Deforestación: ${valorDeforestacion}; rango ${indiceRango * TAMANO_RANGO}–${(indiceRango + 1) * TAMANO_RANGO - 1}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{
                left: `${thumbPct}%`,
                width: 10,
                height: 28,
                backgroundColor: "#F2E8C0",
                border: `2px solid ${PARCHMENT.border}`,
                borderRadius: 3,
                boxShadow: "0 1px 4px rgba(0,0,0,0.35)",
                zIndex: 2,
                transition: "left 0.4s ease",
              }}
            />
          </div>

          {/* Ícono árbol seco — TODO: reemplaza con tu SVG */}
          <div className="flex flex-col items-center flex-shrink-0">
            <span className="text-2xl leading-none" aria-hidden>
              🪵
            </span>
            <span
              className="text-[9px] font-bold uppercase tracking-wider mt-0.5"
              style={{ color: "#8B1A1A" }}
            >
              Alta
            </span>
          </div>
        </div>
      </div>

      {/* Separador vertical */}
      <div style={{ width: 3, backgroundColor: PARCHMENT.border }} />

      {/* ── Columna Recursos (derecha, ~45%) ── */}
      <div
        className="flex flex-col items-center justify-center gap-2 px-4 py-3"
        style={{ backgroundColor: PARCHMENT.panel, minWidth: 220 }}
      >
        <p
          className="text-xs font-bold uppercase tracking-[0.2em]"
          style={{ color: PARCHMENT.text }}
        >
          Recursos
        </p>

        <div className="flex items-center gap-6">
          {/* Dinero — TODO: reemplaza 💰 con ícono de moneda dorada */}
          <IndicadorRecurso
            icono="💰"
            valor={recursos.money}
            etiqueta="Dinero"
          />

          {/* Divisor */}
          <div
            style={{
              width: 1,
              height: 40,
              backgroundColor: PARCHMENT.borderLight,
            }}
          />

          {/* Tierra — TODO: reemplaza 🌱 con ícono de tierra */}
          <IndicadorRecurso
            icono="🌱"
            valor={recursos.land}
            etiqueta="Tierra"
          />

          {/* Divisor */}
          <div
            style={{
              width: 1,
              height: 40,
              backgroundColor: PARCHMENT.borderLight,
            }}
          />

          {/* Personas — TODO: reemplaza 👥 con ícono de personas */}
          <IndicadorRecurso
            icono="👥"
            valor={recursos.people}
            etiqueta="Personas"
          />
        </div>
      </div>
    </div>
  );
}
