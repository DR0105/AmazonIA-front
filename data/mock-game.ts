export const initialGameState = {
  woodStock: 12450,
  woodStockChange: 2.4,
  bioPoints: 4890,
  bioPointsChange: -0.8,
  funding: 2.4,
  deforestationLevel: 34.2,
  turn: 1,
  score: 0,
};

export const activeEvents = [
  {
    id: "fire",
    title: "Forest Fire",
    description: "Spread rate: +5% in Zone D",
    type: "danger" as const,
    icon: "🔥",
    resolved: false,
  },
  {
    id: "legislation",
    title: "New Legislation",
    description: "Ecosystem protection bonus: +15",
    type: "info" as const,
    icon: "📋",
    resolved: false,
  },
  {
    id: "mining",
    title: "Illegal Mining",
    description: "Detected in River Basin C",
    type: "warning" as const,
    icon: "⛏️",
    resolved: true,
  },
];

export const tippingPointWarning = {
  turnsLeft: 6,
  zone: "Alpha",
  message: "6 turns until irreversible collapse in Zone Alpha",
};

export const gameActions = [
  {
    id: "plant",
    label: "Plant Trees",
    cost: 50,
    effect: { bioPoints: 10, woodStock: 200, deforestation: -0.5 },
    icon: "🌱",
  },
  {
    id: "protect",
    label: "Create Reserve",
    cost: 200,
    effect: { bioPoints: 30, funding: -0.1, deforestation: -2 },
    icon: "🛡️",
  },
  {
    id: "patrol",
    label: "Anti-poaching Patrol",
    cost: 100,
    effect: { bioPoints: 15, funding: -0.05, deforestation: -1 },
    icon: "👮",
  },
  {
    id: "research",
    label: "Fund Research",
    cost: 150,
    effect: { bioPoints: 20, funding: -0.08 },
    icon: "🔬",
  },
];

export const mapZones = [
  { id: "A", name: "Zone Alpha", status: "critical", lat: 1.2, lng: -74.3, risk: 94 },
  { id: "B", name: "Zone Beta", status: "warning", lat: 2.5, lng: -72.8, risk: 67 },
  { id: "C", name: "Zone Gamma", status: "stable", lat: 0.8, lng: -71.5, risk: 32 },
  { id: "D", name: "Zone Delta", status: "danger", lat: 3.1, lng: -73.9, risk: 88 },
];
