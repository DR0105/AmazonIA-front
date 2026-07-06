"use client";

/**
 * PanelEventos — zona de eventos en la parte superior del tablero.
 *
 * Panel con título "EVENTOS" y área de contenido vacía.
 * Tu tarea: agregar aquí las cartas/íconos de eventos cuando los tengas.
 */

import { PARCHMENT } from "./TableroDeCartas";

export function PanelEventos() {
  return (
    <section
      data-testid="panel-eventos"
      aria-label="Zona de eventos"
      className="rounded-2xl"
      style={{
        backgroundColor: PARCHMENT.panel,
        border: `3px solid ${PARCHMENT.border}`,
        boxShadow: "inset 0 1px 4px rgba(61,43,31,0.10)",
        minHeight: 100,
      }}
    >
      {/* Título del panel */}
      <div
        className="px-4 py-2 text-center"
        style={{ borderBottom: `2px solid ${PARCHMENT.borderLight}` }}
      >
        <h2
          className="text-sm font-bold uppercase tracking-[0.25em]"
          style={{ color: PARCHMENT.text }}
        >
          Eventos
        </h2>
      </div>

      {/* Área de contenido — deja este div para colocar las cartas de evento */}
      <div
        className="flex items-center justify-center p-4"
        style={{ minHeight: 72, color: PARCHMENT.textMuted }}
      >
        {/* TODO: insertar cartas de evento aquí */}
        <p className="text-xs uppercase tracking-widest opacity-50">
          Sin eventos activos
        </p>
      </div>
    </section>
  );
}
