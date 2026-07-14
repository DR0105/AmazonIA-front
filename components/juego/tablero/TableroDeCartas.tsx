"use client";

/**
 * TableroDeCartas — tablero visual conectado al backend.
 *
 * Al seleccionar una carta:
 *   1. Animación local: la carta elegida se resuelve; las demás permanecen en la mano.
 *   2. POST /api/games/:id/commands { type:"play_card", cardId, expectedVersion }
 *   3. La respuesta actualiza el estado en pantalla (mano, sectores, recursos, deforestación).
 */

import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import { LayoutGroup } from "framer-motion";

import { ANIM } from "@/lib/tablero/animaciones";
import { useCatalogo } from "@/lib/catalog/useCatalogo";
import { useGameState } from "@/lib/juego/useGameState";
import { descartarCarta, finalizarTurno, jugarCarta } from "@/lib/juego/api";
import { getStoredAccessToken } from "@/lib/juego/session";
import {
  estadoVisualInicial,
  tableroVisualReducer,
} from "@/lib/catalog/tableroVisual";
import type { GameResponse } from "@/types/juego";
import type { CartaJugable, SectorId } from "@/types/tablero";

import { PanelEventos } from "./PanelEventos";
import { PanelEstado } from "./PanelEstado";
import { FilaDeSectores } from "./FilaDeSectores";
import { ManoDesplegada } from "./ManoDesplegada";
import { Mazo } from "./Mazo";
import { PilaDescarte } from "./PilaDescarte";

export const PARCHMENT = {
  bg: "#E8D9A0",
  panel: "#F2E8C0",
  panelDark: "#DFD09A",
  border: "#7A6040",
  borderLight: "#B8A070",
  text: "#3D2B1F",
  textMuted: "#8A7060",
  slotBg: "#E0CC90",
  slotBorder: "#C4A855",
} as const;

function Aviso({
  mensaje,
  tono = "info",
}: {
  mensaje: string;
  tono?: "info" | "error";
}) {
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
      {tono === "error" && (
        <p className="text-2xl mb-2" aria-hidden>
          ⚠️
        </p>
      )}
      <p className="text-sm">{mensaje}</p>
    </div>
  );
}

export function TableroDeCartas({ gameId }: { gameId: string | null }) {
  // ── Catálogo y estado de la partida ───────────────────────────────────────
  const { cartas: catalogoCartas, cargando: cargandoCatalogo } = useCatalogo();
  const cartaPorId = useMemo(
    () => new Map(catalogoCartas.map((c) => [c.id, c])),
    [catalogoCartas],
  );

  // El mismo ID creado por POST /api/games se usa para consultar el estado
  // vigente con GET /api/games/{gameId}.
  const {
    game: partidaActual,
    cargando: cargandoPartida,
    error: errorPartida,
    refetch: consultarPartida,
  } = useGameState(gameId);

  // El GET inicial y las respuestas de comandos actualizan la misma partida.
  const [gameData, setGameData] = useState<GameResponse | null>(null);
  const [manoInicialMostrada, setManoInicialMostrada] = useState(false);

  // Cuando llega GET /api/games/{gameId}, inicializa el tablero.
  useEffect(() => {
    if (partidaActual) setGameData(partidaActual);
  }, [partidaActual]);

  useEffect(() => {
    setManoInicialMostrada(false);
  }, [gameId]);

  const state = gameData?.state ?? null;
  const version = gameData?.version ?? 0;

  // ── Estado visual local (animación) ──────────────────────────────────────
  const [estadoVisual, dispatch] = useReducer(
    tableroVisualReducer,
    estadoVisualInicial,
  );
  const jugandoRef = useRef(false); // evita doble clic durante la llamada al back

  // Cierre de animación resolviendo → idle
  useEffect(() => {
    if (estadoVisual.fase !== "resolviendo") return;
    const t = setTimeout(
      () => dispatch({ tipo: "FINALIZAR" }),
      ANIM.DESCARTE_MS,
    );
    return () => clearTimeout(t);
  }, [estadoVisual.fase]);

  // ── Selección de carta: animación + llamada al back ───────────────────────
  const handleSeleccionar = useCallback(
    async (cartaId: string) => {
      if (jugandoRef.current || !gameId || !state) return;
      jugandoRef.current = true;

      // 1. Dispara la animación visual inmediatamente
      dispatch({ tipo: "SELECCIONAR", cartaId });

      try {
        const token = getStoredAccessToken();
        if (!token) throw new Error("Sin token de sesión.");

        // 2. Llama al backend con el expectedVersion de la respuesta actual
        const partidaTrasCarta = await jugarCarta(
          token,
          gameId,
          cartaId,
          version,
        );
        setGameData(partidaTrasCarta);

        // Confirma el estado persistido usando el mismo gameId.
        await consultarPartida();
      } catch (e) {
        console.error("Error al jugar carta:", e);
        // Si falla, revertimos la animación volviendo a idle
        dispatch({ tipo: "FINALIZAR" });
      } finally {
        jugandoRef.current = false;
      }
    },
    [gameId, state, version, consultarPartida],
  );

  const handleDescartar = useCallback(
    async (cartaId: string) => {
      if (jugandoRef.current || !gameId || !state) return;
      if (state.phase !== "discard_required") return;
      if (!gameData?.availableActions.discards[cartaId]?.allowed) return;
      jugandoRef.current = true;

      try {
        const token = getStoredAccessToken();
        if (!token) throw new Error("Sin token de sesión.");

        const partidaTrasDescarte = await descartarCarta(
          token,
          gameId,
          cartaId,
          version,
        );
        setGameData(partidaTrasDescarte);
        dispatch({ tipo: "DESCARTAR", cartaId });
        await consultarPartida();
      } catch (e) {
        console.error("Error al descartar carta:", e);
      } finally {
        jugandoRef.current = false;
      }
    },
    [
      gameData?.availableActions.discards,
      gameId,
      state,
      version,
      consultarPartida,
    ],
  );

  // ── Derivar datos de presentación ─────────────────────────────────────────
  const mano = useMemo((): CartaJugable[] => {
    if (!state?.cards?.hand) return [];
    return state.cards.hand
      .map((id) => cartaPorId.get(id))
      .filter((c): c is CartaJugable => c !== undefined);
  }, [state?.cards?.hand, cartaPorId]);

  const handleMazoClick = useCallback(async () => {
    if (jugandoRef.current || !gameId || !state) return;

    // La partida nueva ya trae initialHandSize cartas. El primer clic solo las
    // revela; no debe ejecutar end_turn ni robar una sexta carta.
    if (!manoInicialMostrada) {
      dispatch({ tipo: "REPARTIR_MANO_BACK", cartas: mano });
      setManoInicialMostrada(true);
      void consultarPartida();
      return;
    }

    jugandoRef.current = true;

    try {
      const token = getStoredAccessToken();
      if (!token) throw new Error("Sin token de sesión.");

      // El clic en el mazo finaliza la ronda y el motor roba drawPerRound cartas.
      const nuevaPartida = await finalizarTurno(token, gameId, version);
      setGameData(nuevaPartida);
      dispatch({ tipo: "AVANZAR_RONDA" });

      const cartasActualizadas = nuevaPartida.state.cards.hand
        .map((id) => cartaPorId.get(id))
        .filter((c): c is CartaJugable => c !== undefined);
      dispatch({ tipo: "REPARTIR_MANO_BACK", cartas: cartasActualizadas });

      await consultarPartida();
    } catch (e) {
      console.error("Error al finalizar turno:", e);
    } finally {
      jugandoRef.current = false;
    }
  }, [gameId, state, version, cartaPorId, consultarPartida, manoInicialMostrada, mano]);

  const sectoresConCartas = useMemo((): Partial<
    Record<SectorId, CartaJugable[]>
  > => {
    if (!state?.sectors) return {};
    const resultado: Partial<Record<SectorId, CartaJugable[]>> = {};
    for (const [sectorId, sectorState] of Object.entries(state.sectors)) {
      const cartas = (sectorState.activeCards ?? [])
        .map((id) => cartaPorId.get(id))
        .filter((c): c is CartaJugable => c !== undefined);
      if (cartas.length > 0) resultado[sectorId as SectorId] = cartas;
    }

    // Durante la animación, mostramos la carta seleccionada directamente en
    // su sector. Al llegar la respuesta del backend, sus cartas activas pasan
    // a ser la fuente definitiva sin duplicarlas.
    for (const [sectorId, cartas] of Object.entries(estadoVisual.sectores)) {
      const existentes = resultado[sectorId as SectorId] ?? [];
      resultado[sectorId as SectorId] = [
        ...existentes,
        ...cartas.filter(
          (carta) => !existentes.some((actual) => actual.id === carta.id),
        ),
      ];
    }
    return resultado;
  }, [state?.sectors, cartaPorId, estadoVisual.sectores]);

  // ── Carga / error ─────────────────────────────────────────────────────────
  // Solo mostramos la pantalla de carga mientras aún no exista un estado.
  // Las consultas posteriores de GET actualizan gameData mediante useEffect
  // sin desmontar ni refrescar visualmente todo el tablero.
  const cargando = cargandoCatalogo || (!state && cargandoPartida);
  const error = errorPartida;

  if (cargando || !state) return <Aviso mensaje="Cargando partida…" />;
  if (error) return <Aviso mensaje={error} tono="error" />;

  const deckCount = state.cards?.deckCount ?? 0;
  const mazoAgotado = deckCount === 0 && mano.length === 0;
  const mazoHabilitado = estadoVisual.fase !== "resolviendo" && deckCount > 0;
  const manoVisible =
    estadoVisual.fase !== "idle" && estadoVisual.mano.length > 0;
  const manoInteractiva = estadoVisual.fase === "desplegada";

  return (
    <LayoutGroup>
      <div
        data-testid="tablero-de-cartas"
        className="flex flex-col gap-3 p-4 rounded-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, #F2E8C0 0%, #D4B86A 100%)",
          border: `6px solid ${PARCHMENT.border}`,
          boxShadow:
            "inset 0 2px 12px rgba(61,43,31,0.18), 0 8px 32px rgba(61,43,31,0.25)",
          fontFamily: "'Georgia', 'Times New Roman', serif",
        }}
      >
        <PanelEventos />

        <PanelEstado
          deforestacion={state.environment?.deforestation ?? 0}
          recursos={{
            money: state.resources?.money ?? 0,
            land: state.resources?.land ?? 0,
            people: state.resources?.people ?? 0,
          }}
        />

        <FilaDeSectores sectores={sectoresConCartas} />

        <div className="flex items-start gap-3">
          <Mazo
            cartasRestantes={deckCount}
            habilitado={mazoHabilitado}
            agotado={mazoAgotado}
            onClick={() => { void handleMazoClick(); }}
          />

          <div className="flex-1 flex flex-col items-center gap-2">
            <p
              className="text-xs font-bold uppercase tracking-[0.2em]"
              style={{ color: PARCHMENT.textMuted }}
            >
              Cartas de esta ronda
            </p>
            <ManoDesplegada
              cartas={estadoVisual.mano}
              visible={manoVisible}
              interactiva={manoInteractiva}
              accionesDisponibles={gameData?.availableActions?.cards ?? {}}
              accionesDescarte={gameData?.availableActions?.discards ?? {}}
              puedeDescartar={state.phase === "discard_required"}
              onSeleccionar={handleSeleccionar}
              onDescartar={handleDescartar}
            />
          </div>

          <PilaDescarte
            cartas={estadoVisual.descarte}
            onDescartar={handleDescartar}
          />
        </div>
      </div>
    </LayoutGroup>
  );
}
