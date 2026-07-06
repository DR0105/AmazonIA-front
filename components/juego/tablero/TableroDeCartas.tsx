"use client";

/**
 * TableroDeCartas — tablero visual estilo pergamino/tablero de mesa.
 *
 * Layout (de arriba hacia abajo):
 *   1. Panel EVENTOS
 *   2. Panel central: columna izq (Deforestación + Recursos) | col der (5 sectores)
 *   3. Franja inferior: Mazo | 5 slots "Cartas de esta ronda" | Descarte
 *
 * Mecánica: al hacer clic en el Mazo se reparten 5 cartas en los slots.
 * Al elegir una carta, ésta vuela a su sector (layoutId) y las restantes van
 * al descarte, todo animado con framer-motion.
 */

import { useEffect, useReducer } from "react";
import { LayoutGroup } from "framer-motion";

import { ANIM } from "@/lib/tablero/animaciones";
import { useCatalogo } from "@/lib/catalog/useCatalogo";
import {
  estadoVisualInicial,
  tableroVisualReducer,
} from "@/lib/catalog/tableroVisual";

import { PanelEventos } from "./PanelEventos";
import { PanelEstado } from "./PanelEstado";
import { FilaDeSectores } from "./FilaDeSectores";
import { ManoDesplegada } from "./ManoDesplegada";
import { Mazo } from "./Mazo";
import { PilaDescarte } from "./PilaDescarte";

// ─── Paleta pergamino ────────────────────────────────────────────────────────
export const PARCHMENT = {
  bg: "#E8D9A0",          // fondo general pergamino
  panel: "#F2E8C0",       // fondo de paneles internos
  panelDark: "#DFD09A",   // fondo de panel con más contraste
  border: "#7A6040",      // borde oscuro madera
  borderLight: "#B8A070", // borde más claro
  text: "#3D2B1F",        // texto oscuro
  textMuted: "#8A7060",   // texto secundario
  slotBg: "#E0CC90",      // fondo del slot vacío
  slotBorder: "#C4A855",  // borde del slot
} as const;

function Aviso({ mensaje, tono = "info" }: { mensaje: string; tono?: "info" | "error" }) {
  return (
    <div
      role={tono === "error" ? "alert" : "status"}
      className="rounded-2xl border-4 p-6 text-center font-bold uppercase tracking-widest"
      style={{
        backgroundColor: PARCHMENT.panel,
        borderColor: PARCHMENT.border,
        color: tono === "error" ? "#8B1A1A" : PARCHMENT.text,
        fontFamily: "'Georgia', serif",
      }}
    >
      {tono === "error" && <p className="text-2xl mb-2" aria-hidden>⚠️</p>}
      <p className="text-sm">{mensaje}</p>
    </div>
  );
}

export function TableroDeCartas() {
  const { cartas, cargando, error } = useCatalogo();
  const [estado, dispatch] = useReducer(tableroVisualReducer, estadoVisualInicial);

  useEffect(() => {
    if (!cargando && !error && cartas.length > 0) {
      dispatch({ tipo: "INICIALIZAR", cartas });
    }
  }, [cargando, error, cartas]);

  useEffect(() => {
    if (estado.fase !== "resolviendo") return;
    const t = setTimeout(() => dispatch({ tipo: "FINALIZAR" }), ANIM.DESCARTE_MS);
    return () => clearTimeout(t);
  }, [estado.fase]);

  if (cargando) return <Aviso mensaje="Cargando catálogo…" />;
  if (error) return <Aviso mensaje={error} tono="error" />;
  if (cartas.length === 0) return <Aviso mensaje="Sin cartas con imagen disponibles." tono="error" />;

  const mazoAgotado = estado.mazo.length === 0;
  const mazoHabilitado = estado.fase === "idle";
  const manoVisible = estado.fase !== "idle" && estado.mano.length > 0;
  const manoInteractiva = estado.fase === "desplegada";

  return (
    <LayoutGroup>
      {/*
        ─── Tablero exterior ──────────────────────────────────────────────────
        Fondo pergamino + borde grueso "madera" + sombra interna suave.
      */}
      <div
        data-testid="tablero-de-cartas"
        className="flex flex-col gap-3 p-4 rounded-3xl"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, #F2E8C0 0%, #D4B86A 100%)`,
          border: `6px solid ${PARCHMENT.border}`,
          boxShadow: "inset 0 2px 12px rgba(61,43,31,0.18), 0 8px 32px rgba(61,43,31,0.25)",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >

        {/* ── 1. ZONA EVENTOS ─────────────────────────────────────────────── */}
        <PanelEventos />

        {/* ── 2. DEFORESTACIÓN + RECURSOS ─────────────────────────────────── */}
        <PanelEstado />

        {/* ── 3. SECTORES ─────────────────────────────────────────────────── */}
        <FilaDeSectores sectores={estado.sectores} />

        {/* ── 3. FRANJA INFERIOR ──────────────────────────────────────────── */}
        <div className="flex items-start gap-3">

          {/* Mazo (izquierda) */}
          <Mazo
            cartasRestantes={estado.mazo.length}
            habilitado={mazoHabilitado}
            agotado={mazoAgotado}
            onClick={() => dispatch({ tipo: "REPARTIR" })}
          />

          {/* Zona central: label + 5 slots */}
          <div className="flex-1 flex flex-col items-center gap-2">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: PARCHMENT.textMuted }}
            >
              Cartas de esta ronda
            </p>
            <div className="w-full flex justify-center">
              <ManoDesplegada
                cartas={estado.mano}
                visible={manoVisible}
                interactiva={manoInteractiva}
                onSeleccionar={(id) => dispatch({ tipo: "SELECCIONAR", cartaId: id })}
              />
            </div>
          </div>

          {/* Descarte (derecha) */}
          <PilaDescarte cartas={estado.descarte} />
        </div>

      </div>
    </LayoutGroup>
  );
}
