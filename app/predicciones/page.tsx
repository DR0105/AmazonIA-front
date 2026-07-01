import { Header } from "@/components/layout/Header";
import { PredictionsMap } from "@/components/predicciones/PredictionsMap";
import { AIMetricsCards } from "@/components/predicciones/AIMetricsCards";
import { FeatureImportance } from "@/components/predicciones/FeatureImportance";
import { ScenarioCards } from "@/components/predicciones/ScenarioCards";
import { PredictionTimeline } from "@/components/predicciones/PredictionTimeline";

export default function PrediccionesPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Módulo de Análisis Predictivo IA" subtitle="Predicciones 2024–2030" />

      <div className="flex-1 p-6 space-y-6">
        {/* Top row: Map + AI metrics */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <PredictionsMap />
          </div>
          <div className="flex flex-col gap-4">
            <AIMetricsCards />
          </div>
        </div>

        {/* Bottom row: Feature importance + Scenarios */}
        <div className="grid grid-cols-2 gap-4">
          <FeatureImportance />
          <ScenarioCards />
        </div>

        {/* Timeline */}
        <PredictionTimeline />
      </div>
    </div>
  );
}
