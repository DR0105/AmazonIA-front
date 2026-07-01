"use client";

import {
  BellIcon,
  Cog6ToothIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export function Header({ title, subtitle }: HeaderProps) {
  return (
    <header
      className="sticky top-0 z-40 flex items-center justify-between px-6 py-3 border-b"
      style={{
        backgroundColor: "#F5F3EC",
        borderColor: "#D8D4C8",
        height: 64,
      }}
    >
      {/* Left: title */}
      <div>
        <h2
          className="text-lg font-semibold leading-tight"
          style={{ color: "#1E293B" }}
        >
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs" style={{ color: "#64748B" }}>
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-3">
        {/* Date range */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border text-sm"
          style={{
            borderColor: "#D8D4C8",
            backgroundColor: "white",
            color: "#64748B",
          }}
        >
          <span>Enero 2024 – Presente</span>
        </div>

        {/* Live indicator */}
        <div
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium"
          style={{
            borderColor: "#D8D4C8",
            backgroundColor: "white",
            color: "#64748B",
          }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse-dot"
            style={{ backgroundColor: "#2E7D32" }}
          />
          Live Data
        </div>

        {/* Export */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium text-white transition-all hover:opacity-90"
          style={{ backgroundColor: "#0F5132" }}
        >
          <ArrowDownTrayIcon className="w-4 h-4" />
          Export Report
        </button>
      </div>
    </header>
  );
}
