"use client";

/** Panel de eventos activos, enriquecidos con el catálogo. */

import {
  type KeyboardEvent,
  type MouseEvent,
  useEffect,
  useState,
} from "react";
import { CircleCheck, Info, X } from "lucide-react";

import type { ActiveEvent, Resources } from "@/types/juego";
import type { EventoConDescripcion } from "@/types/tablero";

import { PARCHMENT } from "./TableroDeCartas";

interface PanelEventosProps {
  eventosActivos: ActiveEvent[];
  eventosCatalogo: EventoConDescripcion[];
  recursos: Resources;
  onResolverEvento: (eventId: string) => Promise<void>;
}

interface EventoActivo extends EventoConDescripcion, ActiveEvent {}

interface MenuContextual {
  evento: EventoActivo;
  x: number;
  y: number;
}

const ICONOS_EVENTO: Record<string, string> = {
  heat_wave: "🔥",
  pollinator_decline: "🐝",
  food_conflict: "🍽️",
  amazon_collapse_warning: "⚠️",
  fauna_extinction: "🦜",
  famine: "🥣",
  forest_fires: "🌲",
  illegal_logging: "🪵",
  corruption: "⚖️",
  land_tenure_conflict: "🗺️",
  armed_conflict: "🛡️",
  health_crisis: "🏥",
};

function iconoEvento(id: string): string {
  return ICONOS_EVENTO[id] ?? "⚠️";
}

function sePuedeSolucionar(evento: EventoActivo, recursos: Resources): boolean {
  return (
    recursos.money >= evento.solution.money &&
    recursos.people >= evento.solution.people &&
    recursos.land >= evento.solution.land
  );
}

export function PanelEventos({
  eventosActivos,
  eventosCatalogo,
  recursos,
  onResolverEvento,
}: PanelEventosProps) {
  const [menu, setMenu] = useState<MenuContextual | null>(null);
  const [eventoInfo, setEventoInfo] = useState<EventoActivo | null>(null);
  const [resolviendoId, setResolviendoId] = useState<string | null>(null);
  const [errorResolucion, setErrorResolucion] = useState<string | null>(null);

  useEffect(() => {
    const cerrarConEscape = (evento: globalThis.KeyboardEvent) => {
      if (evento.key === "Escape") {
        setMenu(null);
        setEventoInfo(null);
      }
    };

    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, []);

  const eventosPorId = new Map(
    eventosCatalogo.map((evento) => [evento.id, evento]),
  );
  const eventos = eventosActivos
    .map((activo) => {
      const evento = eventosPorId.get(activo.id);
      return evento ? { ...evento, ...activo } : null;
    })
    .filter((evento): evento is EventoActivo => evento !== null);

  const abrirMenu = (evento: EventoActivo, posicion: MouseEvent<HTMLElement>) => {
    setEventoInfo(null);
    setErrorResolucion(null);
    setMenu({ evento, x: posicion.clientX, y: posicion.clientY });
  };

  const abrirMenuConTeclado = (
    evento: EventoActivo,
    tecla: KeyboardEvent<HTMLElement>,
  ) => {
    if (tecla.key !== "Enter" && tecla.key !== " ") return;
    tecla.preventDefault();
    const rect = tecla.currentTarget.getBoundingClientRect();
    setEventoInfo(null);
    setErrorResolucion(null);
    setMenu({ evento, x: rect.left, y: rect.bottom });
  };

  // La habilitación depende de los recursos actuales. El backend conserva la
  // validación definitiva al procesar el comando `resolve_event`.
  const solucionable = menu !== null && sePuedeSolucionar(menu.evento, recursos);

  const resolverEvento = async () => {
    console.log("resolverEvento", menu, solucionable);
    if (!menu || !solucionable) return;
    const { id } = menu.evento;
    setResolviendoId(id);
    try {
      await onResolverEvento(id);
      setMenu(null);
    } catch (error) {
      setErrorResolucion(
        error instanceof Error ? error.message : "No se pudo resolver el evento.",
      );
    } finally {
      setResolviendoId(null);
    }
  };

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

      <div
        className="flex flex-wrap items-stretch justify-center gap-3 p-4"
        style={{ minHeight: 72, color: PARCHMENT.textMuted }}
      >
        {eventos.length === 0 ? (
          <p className="text-xs uppercase tracking-widest opacity-50">
            Sin eventos activos
          </p>
        ) : (
          eventos.map((evento) => (
            <article
              key={evento.id}
              role="button"
              tabIndex={0}
              aria-haspopup="menu"
              aria-expanded={menu?.evento.id === evento.id}
              aria-label={`Acciones para ${evento.name}`}
              onClick={(posicion) => abrirMenu(evento, posicion)}
              onKeyDown={(tecla) => abrirMenuConTeclado(evento, tecla)}
              className="w-full max-w-sm cursor-pointer rounded-lg px-4 py-3 transition-transform hover:-translate-y-0.5 focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{
                backgroundColor: PARCHMENT.panelDark,
                border: `2px solid ${PARCHMENT.border}`,
                boxShadow: "inset 0 1px 2px rgba(61,43,31,0.12)",
                color: PARCHMENT.text,
              }}
            >
              <div className="flex items-center gap-2">
                <span className="text-xl" aria-hidden>
                  {iconoEvento(evento.id)}
                </span>
                <h3 className="text-sm font-bold">{evento.name}</h3>
              </div>
              <div
                className="mt-3 flex gap-5 border-t pt-2 text-sm font-bold"
                style={{ borderColor: PARCHMENT.borderLight }}
                aria-label="Recursos necesarios para solucionar el evento"
              >
                <span aria-label={`Dinero: ${evento.solution.money}`}>
                  💰 x{evento.solution.money}
                </span>
                <span aria-label={`Personas: ${evento.solution.people}`}>
                  👥 x{evento.solution.people}
                </span>
                <span aria-label={`Tierra: ${evento.solution.land}`}>
                  🌱 x{evento.solution.land}
                </span>
              </div>
            </article>
          ))
        )}
      </div>

      {menu && (
        <div
          role="menu"
          aria-label={`Acciones de ${menu.evento.name}`}
          onPointerDown={(evento) => evento.stopPropagation()}
          className="fixed z-50 w-48 rounded-lg p-1 shadow-xl"
          style={{
            left: Math.min(menu.x, window.innerWidth - 208),
            top: Math.min(menu.y + 8, window.innerHeight - 112),
            backgroundColor: PARCHMENT.panel,
            border: `2px solid ${PARCHMENT.border}`,
            color: PARCHMENT.text,
          }}
        >
          <button
            type="button"
            role="menuitem"
            disabled={!solucionable || resolviendoId === menu.evento.id}
            onClick={(evento) => {
              evento.stopPropagation();
              void resolverEvento();
            }}
            title={
              resolviendoId === menu.evento.id
                ? "Resolviendo evento…"
                : solucionable
                ? "Recursos suficientes para solucionar el evento"
                : "No tienes suficientes recursos para solucionar este evento"
            }
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold enabled:hover:bg-black/5 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <CircleCheck size={17} strokeWidth={2.5} aria-hidden />
            {resolviendoId === menu.evento.id ? "Resolviendo…" : "Solucionar"}
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setEventoInfo(menu.evento);
              setMenu(null);
            }}
            className="flex w-full items-center gap-2 rounded px-3 py-2 text-left text-sm font-bold hover:bg-black/5"
          >
            <Info size={17} strokeWidth={2.5} aria-hidden />
            Más información
          </button>
          {errorResolucion && (
            <p className="px-3 py-2 text-xs" role="alert" style={{ color: "#8B1A1A" }}>
              {errorResolucion}
            </p>
          )}
        </div>
      )}

      {eventoInfo && (
        <aside
          role="dialog"
          aria-label={`Información de ${eventoInfo.name}`}
          className="fixed z-50 w-72 rounded-lg p-4 shadow-xl"
          style={{
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            backgroundColor: PARCHMENT.panel,
            border: `2px solid ${PARCHMENT.border}`,
            color: PARCHMENT.text,
          }}
        >
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-base font-bold">{eventoInfo.name}</h3>
            <button
              type="button"
              onClick={() => setEventoInfo(null)}
              aria-label="Cerrar información"
              className="rounded p-1 hover:bg-black/5"
            >
              <X size={18} aria-hidden />
            </button>
          </div>
          <p className="mt-2 text-sm leading-relaxed">{eventoInfo.description}</p>
        </aside>
      )}
    </section>
  );
}
