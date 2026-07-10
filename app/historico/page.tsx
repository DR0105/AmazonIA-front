"use client";

import dynamic from 'next/dynamic';
import { useState } from 'react';
import { Header } from '@/components/layout/Header';

const PuntosCalorMap = dynamic(
  () => import('@/components/maps/PuntosCalorMap'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        height: 520, background: '#0f0f1e', borderRadius: 12,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#9ca3af', fontSize: 14,
      }}>
        Iniciando mapa…
      </div>
    ),
  }
);

const MESES_ES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo',    4: 'Abril',
  5: 'Mayo',  6: 'Junio',   7: 'Julio',    8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const DEPTOS = [
  'AMAZONAS','CAQUETÁ','CAUCA','GUAINÍA','GUAVIARE',
  'META','NARIÑO','PUTUMAYO','VAUPÉS','VICHADA',
];

const ANIOS = Array.from({ length: new Date().getFullYear() - 2016 }, (_, i) => 2017 + i);

// Estilos de pills sin mezclar shorthand/longhand — todo en propiedades individuales
const PILL_ACTIVE: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#0F5132',
  backgroundColor: '#0F5132',
  color: 'white',
};

const PILL_INACTIVE: React.CSSProperties = {
  padding: '4px 12px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  cursor: 'pointer',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: '#D8D4C8',
  backgroundColor: 'white',
  color: '#1E293B',
};

export default function HistoricoPage() {
  const [anio, setAnio]   = useState<number | null>(null);
  const [mes, setMes]     = useState<number | null>(null);
  const [depto, setDepto] = useState<string | null>(null);

  return (
    <div className="flex flex-col min-h-screen">
      <Header
        title="Registro histórico de focos de incendio"
        subtitle="Todos los puntos de calor satelitales · Amazonia y Orinoquia · 2017–hoy"
      />

      <div className="p-6 flex flex-col gap-4">
        {/* Filtros */}
        <div
          className="rounded-xl bg-white p-4"
          style={{ borderWidth: 1, borderStyle: 'solid', borderColor: '#D8D4C8' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#64748B' }}>
            Filtrar puntos
          </p>

          <div className="flex flex-wrap gap-4">
            {/* Año */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: '#94A3B8' }}>Año</p>
              <div className="flex flex-wrap gap-1.5">
                <button style={anio === null ? PILL_ACTIVE : PILL_INACTIVE} onClick={() => setAnio(null)}>Todos</button>
                {ANIOS.map(a => (
                  <button key={a} style={anio === a ? PILL_ACTIVE : PILL_INACTIVE}
                    onClick={() => setAnio(prev => prev === a ? null : a)}>{a}</button>
                ))}
              </div>
            </div>

            {/* Mes */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: '#94A3B8' }}>Mes</p>
              <div className="flex flex-wrap gap-1.5">
                <button style={mes === null ? PILL_ACTIVE : PILL_INACTIVE} onClick={() => setMes(null)}>Todos</button>
                {Object.entries(MESES_ES).map(([n, label]) => (
                  <button key={n} style={mes === Number(n) ? PILL_ACTIVE : PILL_INACTIVE}
                    onClick={() => setMes(prev => prev === Number(n) ? null : Number(n))}>
                    {label.slice(0, 3)}
                  </button>
                ))}
              </div>
            </div>

            {/* Departamento */}
            <div>
              <p className="text-xs mb-1.5" style={{ color: '#94A3B8' }}>Departamento</p>
              <div className="flex flex-wrap gap-1.5">
                <button style={depto === null ? PILL_ACTIVE : PILL_INACTIVE} onClick={() => setDepto(null)}>Todos</button>
                {DEPTOS.map(d => (
                  <button key={d} style={depto === d ? PILL_ACTIVE : PILL_INACTIVE}
                    onClick={() => setDepto(prev => prev === d ? null : d)}>
                    {d.charAt(0) + d.slice(1).toLowerCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Mapa con altura fija explícita para que Leaflet lo renderice */}
        <div
          className="rounded-xl overflow-hidden"
          style={{ height: 560, borderWidth: 1, borderStyle: 'solid', borderColor: '#D8D4C8' }}
        >
          <PuntosCalorMap
            anioFiltro={anio}
            mesFiltro={mes}
            deptoFiltro={depto}
          />
        </div>

        <p className="text-xs" style={{ color: '#94A3B8' }}>
          Fuente: SIATAC · Puntos de calor satelitales 2017–{new Date().getFullYear()} ·
          Cada punto representa la ubicación de una detección de anomalía térmica registrada por satélite.
          Sin filtros activos se muestra una muestra representativa (máx. 30,000 puntos para fluidez).
        </p>
      </div>
    </div>
  );
}
