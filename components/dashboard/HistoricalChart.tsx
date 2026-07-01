"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { historicalData } from "@/data/mock-dashboard";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        className="px-3 py-2 rounded-lg text-sm"
        style={{ backgroundColor: "#1E293B", color: "white" }}
      >
        <p className="font-semibold">{label}</p>
        <p style={{ color: "#4CAF50" }}>{payload[0].value.toLocaleString()} Ha</p>
      </div>
    );
  }
  return null;
};

export function HistoricalChart() {
  return (
    <div className="rounded-xl p-5 border bg-white" style={{ borderColor: "#D8D4C8" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base" style={{ color: "#1E293B" }}>
            Tendencias Históricas
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "#64748B" }}>
            Pérdida de cobertura forestal vs. Tiempo (2010–2024)
          </p>
        </div>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 rounded text-xs font-medium border"
            style={{ borderColor: "#D8D4C8", color: "#64748B" }}
          >
            5 Años
          </button>
          <button
            className="px-3 py-1 rounded text-xs font-medium text-white"
            style={{ backgroundColor: "#0F5132" }}
          >
            Max
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={historicalData} barCategoryGap="30%">
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D8" vertical={false} />
          <XAxis
            dataKey="year"
            tick={{ fontSize: 11, fill: "#94A3B8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis hide />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(15,81,50,0.05)" }} />
          <Bar dataKey="area" radius={[3, 3, 0, 0]}>
            {historicalData.map((entry, index) => (
              <Cell
                key={index}
                fill={index >= historicalData.length - 3 ? "#0F5132" : "#B8D4C0"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
