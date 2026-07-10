"use client";

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { usePredicciones } from '@/lib/predicciones/usePredicciones';

const ColombiaRiskMap = dynamic(
  () => import('@/components/maps/ColombiaRiskMap'),
  {
    ssr: false,
    loading: () => (
      <div
        style={{
          height: 450,
          background: '#1a1a2e',
          borderRadius: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#9ca3af',
        }}
      >
        Cargando mapa...
      </div>
    ),
  }
);

const MESES_ES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

export default function HomePage() {
  const { data, loading } = usePredicciones();

  // First month in predictions
  const primerMes = useMemo(() => {
    if (!data?.predicciones_proximos_6_meses.length) return null;
    const sorted = [...data.predicciones_proximos_6_meses].sort((a, b) =>
      a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes
    );
    return { mes: sorted[0].mes, anio: sorted[0].anio };
  }, [data]);

  const kpis = useMemo(() => {
    if (!data || !primerMes) return null;
    const preds = data.predicciones_proximos_6_meses.filter(
      p => p.mes === primerMes.mes && p.anio === primerMes.anio
    );
    return {
      alto: preds.filter(p => p.riesgo_predicho === 'alto').length,
      medio: preds.filter(p => p.riesgo_predicho === 'medio').length,
      bajo: preds.filter(p => p.riesgo_predicho === 'bajo').length,
      total: preds.reduce((s, p) => s + p.total_predicho, 0),
    };
  }, [data, primerMes]);

  const mesLabel = primerMes
    ? `${MESES_ES[primerMes.mes]} ${primerMes.anio}`
    : '';

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="AmazonIA · Dashboard Principal" subtitle="Resumen ejecutivo de predicciones" />

      <div className="flex-1 p-6 space-y-6">
        {/* KPIs */}
        {loading ? (
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton rounded-xl" style={{ height: 90 }} />
            ))}
          </div>
        ) : kpis && primerMes ? (
          <>
            <div
              className="rounded-lg px-4 py-2 text-sm font-medium inline-block"
              style={{ backgroundColor: '#d1fae5', color: '#065f46', border: '1px solid #a7f3d0' }}
            >
              Próximo mes con predicción: {mesLabel}
            </div>
            <div className="grid grid-cols-4 gap-4">
              <KpiCard
                label="🔴 Alerta alta"
                value={String(kpis.alto)}
                sub={`departamentos de 10`}
                valueColor="#C62828"
              />
              <KpiCard
                label="🟡 Riesgo medio"
                value={String(kpis.medio)}
                sub={`departamentos de 10`}
                valueColor="#D97706"
              />
              <KpiCard
                label="🟢 Bajo riesgo"
                value={String(kpis.bajo)}
                sub={`departamentos de 10`}
                valueColor="#15803D"
              />
              <KpiCard
                label="🔥 Focos estimados"
                value={Math.round(kpis.total).toLocaleString('es-CO')}
                sub="puntos de calor"
                valueColor="#1E293B"
              />
            </div>
          </>
        ) : null}

        {/* Mapa */}
        <div className="rounded-xl border bg-white p-4" style={{ borderColor: '#D8D4C8' }}>
          <h3 className="text-sm font-semibold mb-3" style={{ color: '#1E293B' }}>
            Mapa de riesgo — {mesLabel}
          </h3>
          <ColombiaRiskMap
            predicciones={data?.predicciones_proximos_6_meses ?? []}
            mesSeleccionado={primerMes?.mes ?? 0}
            anioSeleccionado={primerMes?.anio ?? 0}
          />
        </div>

        {/* Cards de navegación */}
        <div className="grid grid-cols-2 gap-4">
          <Link href="/como-se-hizo">
            <div
              className="rounded-xl border bg-white p-6 cursor-pointer transition-all hover:shadow-md hover:border-[#0F5132]"
              style={{ borderColor: '#D8D4C8' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🤖</span>
                <h3 className="font-semibold" style={{ color: '#1E293B' }}>¿Cómo funciona este sistema?</h3>
              </div>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Conoce el proceso paso a paso: datos satelitales, entrenamiento del modelo y evaluación de resultados.
              </p>
              <span className="inline-block mt-3 text-sm font-medium" style={{ color: '#0F5132' }}>
                Ver proceso →
              </span>
            </div>
          </Link>

          <Link href="/predicciones">
            <div
              className="rounded-xl border bg-white p-6 cursor-pointer transition-all hover:shadow-md hover:border-[#0F5132]"
              style={{ borderColor: '#D8D4C8' }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">📊</span>
                <h3 className="font-semibold" style={{ color: '#1E293B' }}>Ver predicciones detalladas</h3>
              </div>
              <p className="text-sm" style={{ color: '#64748B' }}>
                Explora las predicciones mes a mes, filtra por departamento y analiza la importancia de las variables del modelo.
              </p>
              <span className="inline-block mt-3 text-sm font-medium" style={{ color: '#0F5132' }}>
                Ir a predicciones →
              </span>
            </div>
          </Link>
        </div>

        {/* Footer */}
        <footer
          className="border-t pt-4 flex items-center justify-between text-xs"
          style={{ borderColor: '#D8D4C8', color: '#94A3B8' }}
        >
          <span>AmazonIA</span>
          <span>© 2026 AmazonIA Project – Technological Stewardship for the Biome</span>
          <div className="flex gap-4">
            <span className="cursor-pointer hover:text-forest-primary">Project Members</span>
            <span className="cursor-pointer hover:text-forest-primary">Tech Stack</span>
            <span className="cursor-pointer hover:text-forest-primary">Open Data Sources</span>
            <span className="cursor-pointer hover:text-forest-primary">Privacy Policy</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

function KpiCard({
  label, value, sub, valueColor,
}: {
  label: string;
  value: string;
  sub: string;
  valueColor: string;
}) {
  return (
    <div className="rounded-xl p-4 border bg-white flex flex-col gap-1" style={{ borderColor: '#D8D4C8' }}>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>{label}</p>
      <p className="text-2xl font-bold" style={{ color: valueColor }}>{value}</p>
      <p className="text-xs" style={{ color: '#94A3B8' }}>{sub}</p>
    </div>
  );
}
