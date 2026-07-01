"use client";

import { cn } from "@/lib/utils";

interface KPICardProps {
  label: string;
  value: string;
  unit?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  sublabel?: string;
  isAlert?: boolean;
  alertColor?: string;
}

export function KPICard({
  label,
  value,
  unit,
  change,
  changeType = "neutral",
  sublabel,
  isAlert,
  alertColor = "#C62828",
}: KPICardProps) {
  const changeColors = {
    positive: "#2E7D32",
    negative: "#C62828",
    neutral: "#64748B",
  };

  return (
    <div
      className="rounded-xl p-4 border flex flex-col gap-1 bg-white"
      style={{ borderColor: "#D8D4C8" }}
    >
      <p
        className="text-xs font-semibold uppercase tracking-wider"
        style={{ color: "#64748B", letterSpacing: "0.08em" }}
      >
        {label}
      </p>

      <div className="flex items-end gap-2 mt-1">
        <span
          className={cn(
            "font-bold leading-none",
            isAlert ? "text-2xl" : "text-2xl"
          )}
          style={{ color: isAlert ? alertColor : "#1E293B" }}
        >
          {value}
        </span>
        {unit && (
          <span className="text-sm mb-0.5" style={{ color: "#64748B" }}>
            {unit}
          </span>
        )}
      </div>

      {change && (
        <div className="flex items-center gap-1 mt-0.5">
          <span
            className="text-xs font-semibold"
            style={{ color: changeColors[changeType] }}
          >
            {changeType === "positive" && "↑ "}
            {changeType === "negative" && "↑ "}
            {change}
          </span>
        </div>
      )}

      {sublabel && (
        <p className="text-xs mt-0.5" style={{ color: "#94A3B8" }}>
          {sublabel}
        </p>
      )}
    </div>
  );
}
