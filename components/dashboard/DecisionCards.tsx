"use client";

import Link from "next/link";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import { decisionCards } from "@/data/mock-dashboard";

export function DecisionCards() {
  return (
    <div className="rounded-xl p-5 border bg-white" style={{ borderColor: "#D8D4C8" }}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-base" style={{ color: "#1E293B" }}>
            AmazonIA: El Desafío
          </h3>
          <p className="text-xs" style={{ color: "#64748B" }}>
            Módulo de toma de decisiones estratégicas
          </p>
        </div>
        <Link
          href="/juego"
          className="flex items-center gap-1 text-xs font-medium hover:opacity-70 transition-opacity"
          style={{ color: "#0F5132" }}
        >
          Ir al Simulador de Juego
          <ArrowRightIcon className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {decisionCards.map((card) => (
          <div
            key={card.id}
            className="rounded-lg p-3 border cursor-pointer hover:shadow-md transition-all"
            style={{ borderColor: "#D8D4C8", backgroundColor: "#FAFAF7" }}
          >
            <div className="text-2xl mb-2">{card.icon}</div>
            <h4 className="text-sm font-semibold mb-1" style={{ color: "#1E293B" }}>
              {card.title}
            </h4>
            <p className="text-xs mb-3" style={{ color: "#64748B", lineHeight: "1.4" }}>
              {card.description}
            </p>
            <div
              className="flex items-center gap-1 text-xs font-semibold"
              style={{ color: card.impactType === "positive" ? "#2E7D32" : "#C62828" }}
            >
              <span>{card.impactType === "positive" ? "+" : ""}{card.impact}</span>
              <span>{card.impactLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
