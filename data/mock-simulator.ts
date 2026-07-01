export const defaultSimulatorParams = {
  expansionAgricola: 24,
  ganaderiaExtensiva: 45,
  construccionCarreteras: 35,
  conservacionAmbiental: 55,
  crecimientoPoblacional: 12,
  esfuerzoReforestacion: "medio" as "bajo" | "medio" | "alto",
};

export const simulatorLogs = [
  { type: "sim" as const, message: "Initializing biome variables..." },
  { type: "ok" as const, message: "Satellite telemetry sync: 100%" },
  { type: "wrn" as const, message: "Precipitation levels below 10yr avg." },
];

export const copilotRecommendations = [
  {
    id: 1,
    params: { expansionAgricola: [20, 35] },
    message:
      '"Basado en la expansión agrícola del 24%, el ecosistema en el sector sur entrará en estrés hídrico en 14 meses. Se recomienda ampliar la franja de protección."',
  },
  {
    id: 2,
    params: { ganaderiaExtensiva: [40, 60] },
    message:
      '"Los niveles de ganadería extensiva generarán pérdida de 340 Ha adicionales. Considerar sistemas silvopastoriles como alternativa."',
  },
  {
    id: 3,
    params: { construccionCarreteras: [30, 50] },
    message:
      '"Nueva infraestructura vial incrementa el riesgo de tala ilegal en un 67% en zonas adyacentes. Se sugiere corredor de protección de 10km."',
  },
];

export function calculateKPIs(params: typeof defaultSimulatorParams) {
  const { expansionAgricola, ganaderiaExtensiva, construccionCarreteras, conservacionAmbiental, esfuerzoReforestacion } = params;

  const refBonus = esfuerzoReforestacion === "alto" ? 20 : esfuerzoReforestacion === "medio" ? 10 : 0;

  const deforestacion =
    ((expansionAgricola * 0.4 + ganaderiaExtensiva * 0.3 + construccionCarreteras * 0.3) / 100) * 20 -
    (conservacionAmbiental / 100) * 8 -
    refBonus / 100;

  const biodiversidad = Math.max(
    -10,
    -4.2 - (expansionAgricola * 0.02 + ganaderiaExtensiva * 0.01) + (conservacionAmbiental * 0.03 + refBonus * 0.05)
  );

  const impactoEconomico = 1.8 + expansionAgricola * 0.02 + ganaderiaExtensiva * 0.01;

  const indiceSocial = Math.min(
    100,
    70 + conservacionAmbiental * 0.1 - ganaderiaExtensiva * 0.05
  );

  const riesgoClimatico = Math.min(
    100,
    30 + expansionAgricola * 0.3 + construccionCarreteras * 0.2 - conservacionAmbiental * 0.2 - refBonus * 0.3
  );

  return {
    biodiversidad: parseFloat(biodiversidad.toFixed(1)),
    deforestacion: parseFloat((deforestacion * 1000).toFixed(1)),
    impactoEconomico: parseFloat(impactoEconomico.toFixed(1)),
    indiceSocial: parseFloat(indiceSocial.toFixed(1)),
    riesgoClimatico: Math.round(riesgoClimatico),
    riesgoLabel: riesgoClimatico > 70 ? "ALTO" : riesgoClimatico > 40 ? "MEDIO" : "BAJO",
  };
}
