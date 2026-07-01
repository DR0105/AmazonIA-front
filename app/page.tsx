import { Header } from "@/components/layout/Header";
import { KPICard } from "@/components/ui/KPICard";
import { DashboardMap } from "@/components/dashboard/DashboardMap";
import { HistoricalChart } from "@/components/dashboard/HistoricalChart";
import { PredictionPanel } from "@/components/dashboard/PredictionPanel";
import { SimulatorSummary } from "@/components/dashboard/SimulatorSummary";
import { DecisionCards } from "@/components/dashboard/DecisionCards";
import { CopilotChat } from "@/components/dashboard/CopilotChat";
import { kpiData } from "@/data/mock-dashboard";

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="AmazonIA" subtitle="Dashboard Principal" />

      <div className="flex-1 p-6 space-y-6">
        {/* KPIs */}
        <div className="grid grid-cols-5 gap-4">
          <KPICard
            label={kpiData.hectareasDeforestadas.label}
            value={kpiData.hectareasDeforestadas.value}
            change={kpiData.hectareasDeforestadas.change}
            changeType={kpiData.hectareasDeforestadas.changeType}
            sublabel={kpiData.hectareasDeforestadas.sublabel}
          />
          <KPICard
            label={kpiData.variacionAnual.label}
            value={kpiData.variacionAnual.value}
            change={kpiData.variacionAnual.change}
            changeType={kpiData.variacionAnual.changeType}
            sublabel={kpiData.variacionAnual.sublabel}
          />
          <KPICard
            label={kpiData.municipiosRiesgo.label}
            value={kpiData.municipiosRiesgo.value}
            change={kpiData.municipiosRiesgo.change}
            changeType={kpiData.municipiosRiesgo.changeType}
            sublabel={kpiData.municipiosRiesgo.sublabel}
          />
          <KPICard
            label={kpiData.indiceBiodiversidad.label}
            value={kpiData.indiceBiodiversidad.value}
            change={kpiData.indiceBiodiversidad.change}
            changeType={kpiData.indiceBiodiversidad.changeType}
            sublabel={kpiData.indiceBiodiversidad.sublabel}
          />
          <KPICard
            label={kpiData.nivelAlerta.label}
            value={kpiData.nivelAlerta.value}
            sublabel={kpiData.nivelAlerta.sublabel}
            isAlert
            alertColor="#C62828"
          />
        </div>

        {/* Map */}
        <DashboardMap />

        {/* Chart + Prediction side by side */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2">
            <HistoricalChart />
          </div>
          <div>
            <PredictionPanel />
          </div>
        </div>

        {/* Simulator summary */}
        <SimulatorSummary />

        {/* Decision cards */}
        <DecisionCards />

        {/* Copilot chat */}
        {/*<CopilotChat />*/}

        {/* Footer */}
        <footer
          className="border-t pt-4 flex items-center justify-between text-xs"
          style={{ borderColor: "#D8D4C8", color: "#94A3B8" }}
        >
          <span>AmazonIA</span>
          <span>
            © 2026 AmazonIA Project – Technological Stewardship for the Biome
          </span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-forest-primary">
              Project Members
            </span>
            <span className="cursor-pointer hover:text-forest-primary">
              Tech Stack
            </span>
            <span className="cursor-pointer hover:text-forest-primary">
              Open Data Sources
            </span>
            <span className="cursor-pointer hover:text-forest-primary">
              Privacy Policy
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}
