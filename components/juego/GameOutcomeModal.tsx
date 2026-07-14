"use client";

import Link from "next/link";
import { House, Leaf, RotateCcw, TreePine } from "lucide-react";

interface GameOutcomeModalProps {
  outcome: "victory" | "defeat";
  version: number;
  route?: string;
  reason?: string;
}

const COPY = {
  victory: {
    title: "¡VICTORIA!",
    subtitle: "Has protegido la Amazonía",
    message: "Tus decisiones equilibradas y estratégicas han ayudado a conservar el bosque y a las comunidades que lo habitan.",
    action: "Jugar de nuevo",
    accent: "#07562f",
    border: "#96732a",
    icon: Leaf,
  },
  defeat: {
    title: "DERROTA",
    subtitle: "La Amazonía ha sufrido las consecuencias",
    message: "La deforestación avanzó, los ecosistemas se debilitaron y las comunidades no pudieron sostener su futuro.",
    action: "Intentar de nuevo",
    accent: "#811c20",
    border: "#6e1b1b",
    icon: TreePine,
  },
} as const;

export function GameOutcomeModal({ outcome, version, route, reason }: GameOutcomeModalProps) {
  const content = COPY[outcome];
  const Icon = content.icon;
  const detail = outcome === "victory" && route === "restoration"
    ? "Ruta de restauración completada"
    : outcome === "defeat" && reason
      ? `Resultado: ${reason.replace(/_/g, " ")}`
      : null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="resultado-titulo"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(15, 27, 20, 0.66)", backdropFilter: "blur(2px)" }}
    >
      <section
        className="relative w-full max-w-[540px] overflow-visible rounded-[26px] p-3 shadow-2xl"
        style={{ background: "linear-gradient(145deg, #8c6b2e, #e8cf85 45%, #8c6b2e)", border: `4px solid ${content.border}` }}
      >
        <div
          className="rounded-[18px] px-8 pb-7 pt-12 text-center"
          style={{ background: "radial-gradient(circle at 50% 0%, #fffdf1, #f5e8bf 72%, #ead9a7)", border: "2px solid #a98442" }}
        >
          <div
            className="absolute left-1/2 top-0 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full shadow-lg"
            style={{ background: outcome === "victory" ? "linear-gradient(145deg, #d9bd67, #8d6923)" : "linear-gradient(145deg, #a64742, #5a1718)", border: "4px solid #ebd58a" }}
          >
            <Icon size={40} strokeWidth={1.7} color={outcome === "victory" ? "#e8f1b8" : "#2b0d0d"} />
          </div>

          <div className="mb-3 flex items-center justify-center gap-3 text-[#bf973c]" aria-hidden>
            <span>✦</span><Leaf size={22} /><span>✦</span>
          </div>
          <h2 id="resultado-titulo" className="font-serif text-5xl font-black tracking-wide" style={{ color: content.accent }}>
            {content.title}
          </h2>
          <p className="mt-1 font-serif text-2xl font-bold" style={{ color: outcome === "victory" ? "#304e30" : "#542a25" }}>
            {content.subtitle}
          </p>

          <div className="my-5 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-[#b99c61]" /><Leaf size={18} color={content.accent} /><span className="h-px flex-1 bg-[#b99c61]" />
          </div>
          <p className="mx-auto max-w-sm text-lg leading-7 text-[#292218]">{content.message}</p>
          {detail && <p className="mt-3 text-xs font-bold uppercase tracking-wider" style={{ color: content.accent }}>{detail}</p>}

          <div className="my-5 flex items-center gap-3" aria-hidden>
            <span className="h-px flex-1 bg-[#b99c61]" /><Leaf size={18} color={content.accent} /><span className="h-px flex-1 bg-[#b99c61]" />
          </div>
          <p className="font-serif text-base font-bold tracking-[0.16em]" style={{ color: content.accent }}>RONDA JUGADA</p>
          <div className="mt-2 rounded-xl border border-dashed border-[#b79c66] bg-[#f8edca] py-1">
            <span className="font-serif text-6xl font-black" style={{ color: content.accent }}>{version}</span>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg border-2 px-4 py-3 font-serif font-bold uppercase tracking-wider transition hover:brightness-95"
              style={{ borderColor: content.accent, color: content.accent, backgroundColor: "#fff9df" }}
            >
              <RotateCcw size={18} /> {content.action}
            </button>
            <Link
              href="/"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-3 font-serif font-bold uppercase tracking-wider text-white transition hover:brightness-110"
              style={{ backgroundColor: content.accent }}
            >
              <House size={18} /> Volver al inicio
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
