export const kpiData = {
  hectareasDeforestadas: {
    value: "12,450",
    unit: "Ha",
    change: "+4.2%",
    changeType: "negative" as const,
    label: "Hectáreas Deforestadas",
    sublabel: "Ref: 2023 Period",
    badge: "Crítico",
  },
  variacionAnual: {
    value: "-1.8%",
    unit: "",
    change: "Mejora",
    changeType: "positive" as const,
    label: "Variación Anual",
    sublabel: "Trend Analysis",
    badge: "Mejora",
  },
  municipiosRiesgo: {
    value: "42",
    unit: "",
    change: "Alerta",
    changeType: "negative" as const,
    label: "Municipios en Riesgo",
    sublabel: "Regional Scan",
    badge: "Alerta",
  },
  indiceBiodiversidad: {
    value: "0.84",
    unit: "",
    change: "Estable",
    changeType: "neutral" as const,
    label: "Índice Biodiversidad",
    sublabel: "Bio-Score V2",
    badge: "Estable",
  },
  nivelAlerta: {
    value: "CRÍTICO",
    unit: "",
    change: "",
    changeType: "negative" as const,
    label: "Nivel de Alerta",
    sublabel: "Real-time Feed",
    badge: "Crítico",
  },
};

export const historicalData = [
  { year: "2016", value: 178000, area: 178 },
  { year: "2017", value: 219000, area: 219 },
  { year: "2018", value: 197000, area: 197 },
  { year: "2019", value: 158000, area: 158 },
  { year: "2020", value: 171000, area: 171 },
  { year: "2021", value: 174000, area: 174 },
  { year: "2022", value: 189000, area: 189 },
  { year: "2023", value: 143000, area: 143 },
  { year: "2024", value: 124000, area: 124 },
];

export const decisionCards = [
  {
    id: "ganaderia",
    title: "Expansión Ganadera",
    description: "Aumenta los ingresos locales pero acelera la deforestación crítica.",
    impact: -15,
    impactLabel: "Deforestación",
    impactType: "negative" as const,
    icon: "🐄",
    color: "#C62828",
  },
  {
    id: "indigena",
    title: "Reserva Indígena",
    description: "Fortalece la soberanía territorial y protege el bosque primario.",
    impact: +20,
    impactLabel: "Gobernanza",
    impactType: "positive" as const,
    icon: "🌿",
    color: "#2E7D32",
  },
  {
    id: "corredores",
    title: "Corredores Biológicos",
    description: "Conecta fragmentos de selva para restaurar el flujo de fauna.",
    impact: +30,
    impactLabel: "Biodiversidad",
    impactType: "positive" as const,
    icon: "🦋",
    color: "#0F5132",
  },
  {
    id: "ecoturismo",
    title: "Ecoturismo Sostenible",
    description: "Genera empleo verde para comunidades en zonas de amortiguación.",
    impact: +12,
    impactLabel: "Economía Verde",
    impactType: "positive" as const,
    icon: "🏕️",
    color: "#1B5E20",
  },
];

export const chatMessages = [
  {
    id: 1,
    type: "user" as const,
    text: "Analiza la correlación entre nuevos focos de incendio y proyectos viales propuestos en Caquetá.",
  },
  {
    id: 2,
    type: "bot" as const,
    text: "He detectado una correlación del **0.82** en un radio de 10km alrededor de la Vía Marginal de la Selva. Los focos han aumentado un **24%** en el último trimestre coincidiendo con la fase de prospección...\n\nCorrelación: 0.8234 | Confidence: 0.91 | n: 142 sites",
  },
];

export const suggestedQuestions = [
  "¿Cuál es la tasa de deforestación en Guaviare este mes?",
  "Comparar emisiones de CO2 con la meta 2030.",
];
