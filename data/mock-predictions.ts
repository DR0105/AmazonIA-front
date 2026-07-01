export const predictionMetrics = {
  accuracy: 94.2,
  confidence: 91.8,
  architecture: "AmazonNet-v4",
  lastTrained: "2024-11",
  dataPoints: "2.4M",
};

export const featureImportance = [
  { name: "Expansión de vías", value: 87, color: "#C62828" },
  { name: "Proximidad centros poblados", value: 73, color: "#D4A017" },
  { name: "Precipitación anual", value: 61, color: "#2E7D32" },
  { name: "Ganadería extensiva", value: 54, color: "#1B5E20" },
  { name: "Incendios históricos", value: 48, color: "#0F5132" },
  { name: "Tenencia de tierra", value: 39, color: "#64748B" },
];

export const scenarios = [
  {
    id: "bau",
    title: "Business as Usual",
    subtitle: "Sin cambios en política",
    year2030: "3.2M Ha",
    year2035: "5.8M Ha",
    risk: "Crítico",
    riskColor: "#C62828",
    description:
      "Proyección basada en tendencias actuales sin intervención política. La deforestación acumulada alcanzaría niveles irreversibles hacia 2028.",
    probability: 68,
  },
  {
    id: "sostenible",
    title: "Desarrollo Sostenible",
    subtitle: "Con intervención política",
    year2030: "0.8M Ha",
    year2035: "0.3M Ha",
    risk: "Moderado",
    riskColor: "#D4A017",
    description:
      "Escenario con implementación plena de acuerdos de paz ambiental, moratoria a nuevas vías y subsidios a economías alternativas.",
    probability: 32,
  },
];

export const riskZones = [
  { name: "Caquetá Norte", risk: 94, lat: 1.2, lng: -74.8 },
  { name: "Guaviare Centro", risk: 87, lat: 2.1, lng: -72.6 },
  { name: "Meta Sur", risk: 76, lat: 3.5, lng: -73.4 },
  { name: "Amazonas", risk: 45, lat: -1.2, lng: -71.9 },
  { name: "Vaupés", risk: 38, lat: 0.8, lng: -70.2 },
];

export const predictionTimeline = [
  { year: "2024", actual: 124, predicted: 124 },
  { year: "2025", actual: null, predicted: 138 },
  { year: "2026", actual: null, predicted: 155 },
  { year: "2027", actual: null, predicted: 174 },
  { year: "2028", actual: null, predicted: 198 },
  { year: "2029", actual: null, predicted: 226 },
  { year: "2030", actual: null, predicted: 260 },
];
