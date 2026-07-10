"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  HomeIcon,
  CpuChipIcon,
  PuzzlePieceIcon,
  QuestionMarkCircleIcon,
  Cog6ToothIcon,
  BookOpenIcon,
  MapIcon,
} from "@heroicons/react/24/outline";

const navigation = [
  { name: "Inicio", href: "/", icon: HomeIcon },
  { name: "Predicciones IA", href: "/predicciones", icon: CpuChipIcon },
  { name: "Focos históricos", href: "/historico", icon: MapIcon },
  { name: "¿Cómo se hizo?", href: "/como-se-hizo", icon: BookOpenIcon },
  { name: "Juego Educativo", href: "/juego", icon: PuzzlePieceIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{ width: 280, minWidth: 280, backgroundColor: "#0F5132" }}
      className="fixed left-0 top-0 h-full flex flex-col z-50 shadow-xl"
    >
      {/* Logo */}
      <div
        className="px-6 py-6 border-b"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            🌿
          </div>
          <div>
            <h1 className="text-white font-bold text-xl leading-none tracking-tight">
              AmazonIA
            </h1>
            <p
              className="text-xs mt-0.5"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              Scientific Monitoring
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all duration-200",
                    isActive
                      ? "text-white font-medium"
                      : "text-white/65 hover:text-white hover:bg-white/10",
                  )}
                  style={
                    isActive
                      ? {
                          backgroundColor: "rgba(255,255,255,0.18)",
                          fontWeight: 500,
                        }
                      : {}
                  }
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.name}</span>
                  {isActive && (
                    <div
                      className="ml-auto w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: "#4CAF50" }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div
        className="px-3 pb-4 border-t"
        style={{ borderColor: "rgba(255,255,255,0.1)", paddingTop: 12 }}
      >
        <Link
          href="/soporte"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:text-white hover:bg-white/10 transition-all"
        >
          <QuestionMarkCircleIcon className="w-5 h-5" />
          Soporte Científico
        </Link>
        <Link
          href="/configuracion"
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-white/65 hover:text-white hover:bg-white/10 transition-all"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          Configuración
        </Link>
      </div>
    </aside>
  );
}
