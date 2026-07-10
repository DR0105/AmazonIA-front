/**
 * Tipos de la API de partidas.
 * Modelan exactamente los DTOs que expone el backend (dto.go).
 */

// ─── Respuesta de POST /api/v1/games ─────────────────────────────────────────

export interface GameResponse {
  id: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  state: GameView;
  availableActions: AvailableActions;
  domainEvents?: DomainEvent[];
}

// ─── Estado del juego (GameView en dto.go) ───────────────────────────────────

export interface GameView {
  schemaVersion: number;
  scenarioId: string;
  round: number;
  phase: string;
  resources: Resources;
  environment: EnvironmentState;
  sectors: Record<string, SectorState>;
  cards: CardZonesView;
  events: EventStateView;
  socialPressure: number;
  victory: VictoryState;
  defeat: DefeatState;
}

export interface Resources {
  money: number;
  people: number;
  land: number;
}

export interface EnvironmentState {
  deforestation: number;
  temperatureLabel: string;
  tippingPointsCrossed: string[] | null;
}

export interface SectorState {
  active: boolean;
  cycleProgress: number;
  activeCards: string[] | null;
}

export interface CardZonesView {
  hand: string[];
  deckCount: number;
  discard: string[];
  policies: string[];
  projects: string[];
  milestones: Record<string, boolean>;
}

export interface EventStateView {
  active: ActiveEvent[];
  resolved: string[];
  queuedCount: number;
  territorialFailures: number;
}

export interface ActiveEvent {
  id: string;
  [key: string]: unknown;
}

export interface VictoryState {
  completed: boolean;
}

export interface DefeatState {
  gameOver: boolean;
}

// ─── Acciones disponibles ────────────────────────────────────────────────────

export interface ActionResult {
  allowed: boolean;
  code?: string;
  message?: string;
}

export interface AvailableActions {
  cards: Record<string, ActionResult>;
  events: Record<string, ActionResult>;
  discards: Record<string, ActionResult>;
  canEndTurn: { allowed: boolean };
}

// ─── Eventos de dominio ──────────────────────────────────────────────────────

export interface DomainEvent {
  type: string;
  [key: string]: unknown;
}

// ─── Lista de partidas (GET /api/v1/games) ───────────────────────────────────

export interface GameSummary {
  id: string;
  version: number;
  round: number;
  phase: string;
  victory: VictoryState;
  defeat: DefeatState;
  createdAt: string;
  updatedAt: string;
}

export interface ListGamesResponse {
  games: GameSummary[];
  nextCursor?: string;
}
