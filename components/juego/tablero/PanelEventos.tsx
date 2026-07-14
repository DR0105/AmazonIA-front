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
        <>
          {/* Overlay */}
          <div
            role="presentation"
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(30,20,10,0.55)', backdropFilter: 'blur(2px)' }}
            onClick={() => setEventoInfo(null)}
          />

          {/* Modal */}
          <aside
            role="dialog"
            aria-modal="true"
            aria-label={`Información de ${eventoInfo.name}`}
            className="fixed z-50 rounded-2xl shadow-2xl"
            style={{
              left: '50%', top: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(92vw, 560px)',
              backgroundColor: PARCHMENT.panel,
              border: `3px solid ${PARCHMENT.border}`,
              color: PARCHMENT.text,
              overflow: 'hidden',
            }}
          >
            {/* Cabecera */}
            <div
              className="px-5 py-3 text-center relative"
              style={{ borderBottom: `2px solid ${PARCHMENT.borderLight}`, backgroundColor: PARCHMENT.panelDark }}
            >
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-1" style={{ color: '#8B1A1A' }}>
                ⚠️ Evento crítico
              </p>
              <h3 className="text-xl font-bold">
                {iconoEvento(eventoInfo.id)} {eventoInfo.name}
              </h3>
              <button
                type="button"
                onClick={() => setEventoInfo(null)}
                aria-label="Cerrar"
                className="absolute right-3 top-3 rounded-lg p-1.5 hover:bg-black/10"
              >
                <X size={18} aria-hidden />
              </button>
            </div>

            {/* Cuerpo */}
            <div className="p-5 grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>

              {/* Columna izquierda: recursos + botón */}
              <div className="flex flex-col gap-4">
                <div
                  className="rounded-xl p-4"
                  style={{ backgroundColor: PARCHMENT.panelDark, border: `1.5px solid ${PARCHMENT.borderLight}` }}
                >
                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-center mb-3"
                     style={{ color: PARCHMENT.textMuted }}>
                    Recursos necesarios
                  </p>
                  <div className="flex justify-around">
                    {[
                      { emoji: '💰', label: 'DINERO',   val: eventoInfo.solution.money  },
                      { emoji: '👥', label: 'PERSONAS', val: eventoInfo.solution.people },
                      { emoji: '🌱', label: 'TIERRA',   val: eventoInfo.solution.land   },
                    ].map(({ emoji, label, val }) => (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <span className="text-2xl">{emoji}</span>
                        <span className="text-sm font-bold">x{val}</span>
                        <span className="text-xs uppercase tracking-wide" style={{ color: PARCHMENT.textMuted }}>
                          {label}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Botón resolver dentro del modal */}
                <button
                  type="button"
                  disabled={!sePuedeSolucionar(eventoInfo, recursos) || resolviendoId === eventoInfo.id}
                  onClick={async () => {
                    setResolviendoId(eventoInfo.id);
                    try {
                      await onResolverEvento(eventoInfo.id);
                      setEventoInfo(null);
                    } catch (err) {
                      setErrorResolucion(err instanceof Error ? err.message : 'Error al resolver.');
                    } finally {
                      setResolviendoId(null);
                    }
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
                  style={{
                    backgroundColor: '#1B4D2E',
                    color: '#F5EDD0',
                    border: '2px solid #0F3020',
                  }}
                >
                  <CircleCheck size={17} strokeWidth={2.5} aria-hidden />
                  {resolviendoId === eventoInfo.id ? 'Resolviendo…' : 'Resolver evento'}
                </button>

                {errorResolucion && (
                  <p className="text-xs text-center" role="alert" style={{ color: '#8B1A1A' }}>
                    {errorResolucion}
                  </p>
                )}
              </div>

              {/* Columna derecha: efectos */}
              <div className="flex flex-col gap-3">
                {/* Al resolver */}
                {eventoInfo.solveEffects.length > 0 && (
                  <div
                    className="rounded-xl p-3"
                    style={{ backgroundColor: '#EEF7EE', border: '1.5px solid #4CAF50' }}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm font-bold" style={{ color: '#1B5E20' }}>✅ Al resolver</span>
                    </div>
                    {eventoInfo.solveEffects.map((ef, i) => {
                      const esRemove = ef.type === 'remove_deforestation';
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-lg">🌳</span>
                          <span className="text-lg font-bold" style={{ color: '#1B5E20' }}>
                            ↓ -{ef.amount}
                          </span>
                          <span className="text-xs uppercase tracking-wide" style={{ color: '#2E7D32' }}>
                            {esRemove ? 'Deforestación' : ef.type}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Si expira */}
                <div
                  className="rounded-xl p-3"
                  style={{ backgroundColor: '#FFF0F0', border: '1.5px solid #E57373' }}
                >
                  <div className="flex items-center gap-1.5 mb-2">
                    <span className="text-sm font-bold" style={{ color: '#8B1A1A' }}>❌ Si expira</span>
                  </div>
                  {eventoInfo.expirationEffects.map((ef, i) => {
                    const esAdd = ef.type === 'add_deforestation';
                    return (
                      <div key={i} className="flex items-center gap-2 mb-1">
                        <span className="text-lg">🪵</span>
                        <span className="text-lg font-bold" style={{ color: '#8B1A1A' }}>
                          ↑ +{ef.amount}
                        </span>
                        <span className="text-xs uppercase tracking-wide" style={{ color: '#C62828' }}>
                          {esAdd ? 'Deforestación' : ef.type}
                        </span>
                      </div>
                    );
                  })}

                  {/* Recursos perdidos */}
                  {(eventoInfo.expirationLoss.money > 0 || eventoInfo.expirationLoss.people > 0 || eventoInfo.expirationLoss.land > 0) && (
                    <>
                      <div className="my-2 border-t" style={{ borderColor: '#FFCDD2' }} />
                      <p className="text-xs uppercase tracking-wide mb-1" style={{ color: '#8B1A1A' }}>
                        Recursos perdidos
                      </p>
                      {[
                        { emoji: '💰', label: 'DINERO',   val: eventoInfo.expirationLoss.money  },
                        { emoji: '👥', label: 'PERSONAS', val: eventoInfo.expirationLoss.people },
                        { emoji: '🌱', label: 'TIERRA',   val: eventoInfo.expirationLoss.land   },
                      ].map(({ emoji, label, val }) => (
                        <div key={label} className="flex items-center gap-2 text-sm">
                          <span>{emoji}</span>
                          <span className="font-bold" style={{ color: '#8B1A1A' }}>-{val}</span>
                          <span className="text-xs uppercase" style={{ color: '#C62828' }}>{label}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </>
      )}
    </section>
  );
}
