"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { predictionTimeline } from "@/data/mock-predictions";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: "#1E293B", color: "white" }}>
        <p className="font-semibold mb-1">{label}</p>
        {payload.map((p: any) => (
          <p key={p.dataKey} style={{ color: p.color }}>
            {p.name}: {p.value ? `${p.value}k Ha` : "–"}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function PredictionTimeline() {
  return (
    <div className="rounded-xl p-5 border bg-white" style={{ borderColor: "#D8D4C8" }}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base" style={{ color: "#1E293B" }}>
            Línea de Tiempo Predictiva
          </h3>
          <p className="text-xs" style={{ color: "#64748B" }}>
            Comparativa datos reales vs. predicción del modelo 2024–2030
          </p>
        </div>
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
          style={{ backgroundColor: "#F0F7F0", color: "#0F5132" }}
        >
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: "#0F5132" }} />
          AmazonNet-v4
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={predictionTimeline}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E8E4D8" />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} axisLine={false} tickLine={false} />
          <Tooltip content={<CustomTooltip />} />
          <ReferenceLine x="2024" stroke="#D8D4C8" strokeDasharray="4 4" label={{ value: "Presente", position: "top", fontSize: 10, fill: "#94A3B8" }} />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#0F5132"
            strokeWidth={2}
            dot={{ r: 4, fill: "#0F5132" }}
            name="Real"
            connectNulls={false}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#C62828"
            strokeWidth={2}
            strokeDasharray="6 3"
            dot={{ r: 4, fill: "#C62828" }}
            name="Predicción"
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#64748B", paddingTop: 8 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
