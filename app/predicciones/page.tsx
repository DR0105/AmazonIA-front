"use client";

import dynamic from 'next/dynamic';
import { useState, useMemo } from 'react';
import { Header } from '@/components/layout/Header';
import { usePredicciones } from '@/lib/predicciones/usePredicciones';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const ColombiaRiskMap = dynamic(
  () => import('@/components/maps/ColombiaRiskMap'),
  { ssr: false, loading: () => <div style={{ height: 450, background: '#1a1a2e', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>Cargando mapa...</div> }
);

const MESES_ES: Record<number, string> = {
  1: 'Enero', 2: 'Febrero', 3: 'Marzo', 4: 'Abril',
  5: 'Mayo', 6: 'Junio', 7: 'Julio', 8: 'Agosto',
  9: 'Septiembre', 10: 'Octubre', 11: 'Noviembre', 12: 'Diciembre',
};

const FEATURE_LABELS: Record<string, string> = {
  lag_12: 'Mismo mes, año anterior',
  lag_1: 'Mes pasado',
  lag_2: 'Hace 2 meses',
  lag_3: 'Hace 3 meses',
  lag_6: 'Hace 6 meses',
  media_movil_3: 'Promedio último trimestre',
  media_movil_6: 'Promedio último semestre',
  media_movil_12: 'Promedio últimos 12 meses',
  mes: 'Mes del año',
  'Ciclo estacional': 'Ciclo estacional',
  anio: 'Año (tendencia)',
  dept_code: 'Departamento',
};

const RIESGO_COLORS = { alto: '#ef4444', medio: '#f59e0b', bajo: '#22c55e' };

export default function PrediccionesPage() {
  const { data, loading, error } = usePredicciones();

  // Get unique month/year combos sorted
  const meses = useMemo(() => {
    if (!data) return [];
    const seen = new Set<string>();
    const result: { mes: number; anio: number; label: string }[] = [];
    for (const p of data.predicciones_proximos_6_meses) {
      const key = `${p.anio}-${p.mes}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push({ mes: p.mes, anio: p.anio, label: `${MESES_ES[p.mes]?.slice(0, 3) ?? p.mes} ${p.anio}` });
      }
    }
    result.sort((a, b) => a.anio !== b.anio ? a.anio - b.anio : a.mes - b.mes);
    return result;
  }, [data]);

  const [selectedIdx, setSelectedIdx] = useState(0);
  const selected = meses[selectedIdx] ?? { mes: 0, anio: 0 };

  const prediccionesMes = useMemo(() => {
    if (!data) return [];
    return data.predicciones_proximos_6_meses.filter(
      p => p.mes === selected.mes && p.anio === selected.anio
    );
  }, [data, selected]);

  const kpis = useMemo(() => {
    const alto = prediccionesMes.filter(p => p.riesgo_predicho === 'alto').length;
    const medio = prediccionesMes.filter(p => p.riesgo_predicho === 'medio').length;
    const bajo = prediccionesMes.filter(p => p.riesgo_predicho === 'bajo').length;
    const total = prediccionesMes.reduce((s, p) => s + p.total_predicho, 0);
    return { alto, medio, bajo, total };
  }, [prediccionesMes]);

  // Feature importance - usar importancia_variables_media, merge mes_sin + mes_cos
  const importanciaData = useMemo(() => {
    if (!data) return [];
    const raw = data.metadata.importancia_variables_media ?? (data.metadata as any).importancia_variables ?? {};
    const merged: Record<string, number> = {};
    for (const [k, v] of Object.entries(raw)) {
      if (k === 'mes_sin' || k === 'mes_cos') {
        merged['Ciclo estacional'] = (merged['Ciclo estacional'] ?? 0) + (v as number);
      } else {
        merged[k] = v as number;
      }
    }
    return Object.entries(merged)
      .map(([key, value]) => ({ name: FEATURE_LABELS[key] ?? key, value: Math.round(value * 1000) / 10 }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  // Heatmap: all months × departments
  const heatmapDepts = useMemo(() => {
    if (!data) return [];
    return [...new Set(data.predicciones_proximos_6_meses.map(p => p.departamento))].sort();
  }, [data]);

  const accuracy = data?.metadata.metricas_globales?.accuracy_riesgo
    ?? (data?.metadata as any)?.metricas_clasificacion_riesgo?.accuracy
    ?? 0;

  const rangoLabel = meses.length > 0
    ? `${meses[0].label} – ${meses[meses.length - 1].label}`
    : '';

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Predicciones IA · Amazonia y Orinoquia" subtitle="Cargando datos..." />
        <div className="flex-1 flex items-center justify-center">
          <div className="skeleton" style={{ width: 200, height: 24 }} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header title="Predicciones IA · Amazonia y Orinoquia" />
        <div className="flex-1 p-6">
          <div className="rounded-xl p-8 border bg-white text-center" style={{ borderColor: '#D8D4C8' }}>
            <p style={{ color: '#C62828' }}>Error cargando datos: {error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Predicciones IA · Amazonia y Orinoquia" subtitle={rangoLabel} />

      <div className="flex-1 p-6 space-y-6">
        {/* Selector de mes */}
        <div className="flex flex-wrap gap-2">
          {meses.map((m, i) => (
            <button
              key={`${m.anio}-${m.mes}`}
              onClick={() => setSelectedIdx(i)}
              className="px-4 py-2 rounded-full text-sm font-medium border transition-all"
              style={{
                backgroundColor: i === selectedIdx ? '#0F5132' : 'white',
                color: i === selectedIdx ? 'white' : '#1E293B',
                borderColor: i === selectedIdx ? '#0F5132' : '#D8D4C8',
              }}
            >
              {m.label}
            </button>
          ))}
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-5 gap-4">
          <div className="rounded-xl p-4 border bg-white flex flex-col gap-1" style={{ borderColor: '#D8D4C8' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>🔴 Alerta alta</p>
            <p className="text-2xl font-bold" style={{ color: '#C62828' }}>{kpis.alto} <span className="text-sm font-normal text-gray-400">de {prediccionesMes.length}</span></p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>departamentos</p>
          </div>
          <div className="rounded-xl p-4 border bg-white flex flex-col gap-1" style={{ borderColor: '#D8D4C8' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>🟡 Riesgo medio</p>
            <p className="text-2xl font-bold" style={{ color: '#D97706' }}>{kpis.medio} <span className="text-sm font-normal text-gray-400">de {prediccionesMes.length}</span></p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>departamentos</p>
          </div>
          <div className="rounded-xl p-4 border bg-white flex flex-col gap-1" style={{ borderColor: '#D8D4C8' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>🟢 Bajo riesgo</p>
            <p className="text-2xl font-bold" style={{ color: '#15803D' }}>{kpis.bajo} <span className="text-sm font-normal text-gray-400">de {prediccionesMes.length}</span></p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>departamentos</p>
          </div>
          <div className="rounded-xl p-4 border bg-white flex flex-col gap-1" style={{ borderColor: '#D8D4C8' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>🔥 Focos estimados</p>
            <p className="text-2xl font-bold" style={{ color: '#1E293B' }}>{Math.round(kpis.total).toLocaleString('es-CO')}</p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>puntos de calor</p>
          </div>
          <div className="rounded-xl p-4 border bg-white flex flex-col gap-1" style={{ borderColor: '#D8D4C8' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#64748B' }}>🎯 Precisión modelo</p>
            <p className="text-2xl font-bold" style={{ color: '#0F5132' }}>
              {Math.round(accuracy * 10)} <span className="text-sm font-normal text-gray-400">de cada 10</span>
            </p>
            <p className="text-xs" style={{ color: '#94A3B8' }}>meses acertados</p>
          </div>
        </div>

        {/* Mapa + Tabla */}
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 rounded-xl border bg-white p-4" style={{ borderColor: '#D8D4C8' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1E293B' }}>
              Mapa de riesgo — {selected.mes > 0 ? `${MESES_ES[selected.mes]} ${selected.anio}` : ''}
            </h3>
            <ColombiaRiskMap
              predicciones={data?.predicciones_proximos_6_meses ?? []}
              mesSeleccionado={selected.mes}
              anioSeleccionado={selected.anio}
            />
          </div>
          <div className="rounded-xl border bg-white p-4 overflow-auto" style={{ borderColor: '#D8D4C8' }}>
            <h3 className="text-sm font-semibold mb-3" style={{ color: '#1E293B' }}>Departamentos</h3>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left pb-2 text-xs" style={{ color: '#64748B' }}>Departamento</th>
                  <th className="text-right pb-2 text-xs" style={{ color: '#64748B' }}>Riesgo</th>
                  <th className="text-right pb-2 text-xs" style={{ color: '#64748B' }}>Focos estimados</th>
                  <th className="text-right pb-2 text-xs" style={{ color: '#64748B' }}>Promedio histórico</th>
                </tr>
              </thead>
              <tbody>
                {prediccionesMes
                  .sort((a, b) => {
                    const order = { alto: 0, medio: 1, bajo: 2 };
                    return order[a.riesgo_predicho] - order[b.riesgo_predicho];
                  })
                  .map(p => {
                    const bgColor = p.riesgo_predicho === 'alto' ? '#fde8e8' : p.riesgo_predicho === 'medio' ? '#fef3c7' : '#d1fae5';
                    const textColor = p.riesgo_predicho === 'alto' ? '#9b1c1c' : p.riesgo_predicho === 'medio' ? '#92400e' : '#065f46';
                    return (
                      <tr key={p.departamento} style={{ backgroundColor: bgColor }}>
                        <td className="py-1.5 px-2 rounded-l font-medium text-xs" style={{ color: textColor }}>
                          {p.departamento.charAt(0) + p.departamento.slice(1).toLowerCase()}
                        </td>
                        <td className="py-1.5 px-2 text-right text-xs font-semibold" style={{ color: textColor }}>
                          {p.riesgo_predicho.toUpperCase()}
                        </td>
                        <td className="py-1.5 px-2 text-right rounded-r text-xs" style={{ color: textColor }}>
                          {p.total_predicho % 1 === 0 ? p.total_predicho.toFixed(0) : p.total_predicho.toFixed(1)}
                        </td>
                        <td className="py-1.5 px-2 text-right rounded-r text-xs" style={{ color: '#64748B' }}>
                          {(() => {
                            const avg = data?.metadata.metricas_por_departamento?.[p.departamento]?.promedio_historico_mensual;
                            if (avg == null) return '—';
                            return avg % 1 === 0 ? avg.toFixed(0) : avg.toFixed(1);
                          })()}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Importancia de variables + Heatmap */}
        <div className="grid grid-cols-2 gap-4">
          {/* Feature importance */}
          <div className="rounded-xl border bg-white p-4" style={{ borderColor: '#D8D4C8' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>Importancia de variables</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={importanciaData} layout="vertical" margin={{ left: 12, right: 16, top: 4, bottom: 4 }}>
                <XAxis type="number" tick={{ fontSize: 10, fill: '#64748B' }} tickFormatter={v => `${v}%`} />
                <YAxis type="category" dataKey="name" width={175} tick={{ fontSize: 11, fill: '#1E293B' }} />
                <Tooltip
                  formatter={(v) => [v !== undefined ? `${v}%` : '—', 'Importancia']}
                  contentStyle={{ background: '#1E293B', border: 'none', borderRadius: 8, color: 'white', fontSize: 12 }}
                  itemStyle={{ color: 'white' }}
                />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {importanciaData.map((entry, i) => (
                    <Cell
                      key={`cell-${i}`}
                      fill={entry.value > 50 ? '#0F5132' : entry.value > 10 ? '#1B7A46' : '#4CAF50'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Heatmap evolución 6 meses */}
          <div className="rounded-xl border bg-white p-4 overflow-auto" style={{ borderColor: '#D8D4C8' }}>
            <h3 className="text-sm font-semibold mb-4" style={{ color: '#1E293B' }}>Evolución de riesgo — 6 meses</h3>
            {data && (
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr>
                    <th className="text-left pb-2 pr-2" style={{ color: '#64748B' }}>Depto.</th>
                    {meses.map(m => (
                      <th key={`${m.anio}-${m.mes}`} className="pb-2 px-1 text-center" style={{ color: '#64748B', minWidth: 52 }}>
                        {m.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {heatmapDepts.map(dept => (
                    <tr key={dept}>
                      <td className="py-1 pr-2 font-medium whitespace-nowrap" style={{ color: '#1E293B' }}>
                        {dept.charAt(0) + dept.slice(1).toLowerCase()}
                      </td>
                      {meses.map(m => {
                        const pred = data.predicciones_proximos_6_meses.find(
                          p => p.departamento === dept && p.mes === m.mes && p.anio === m.anio
                        );
                        const bg = pred
                          ? pred.riesgo_predicho === 'alto' ? '#fca5a5'
                          : pred.riesgo_predicho === 'medio' ? '#fcd34d'
                          : '#86efac'
                          : '#e5e7eb';
                        const tc = pred
                          ? pred.riesgo_predicho === 'alto' ? '#7f1d1d'
                          : pred.riesgo_predicho === 'medio' ? '#78350f'
                          : '#14532d'
                          : '#9ca3af';
                        return (
                          <td key={`${m.anio}-${m.mes}`} className="py-1 px-1 text-center rounded" style={{ backgroundColor: bg, color: tc, fontWeight: 600 }}>
                            {pred ? pred.riesgo_predicho.charAt(0).toUpperCase() : '—'}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Métricas por departamento */}
        {data?.metadata.metricas_por_departamento && (
          <div className="rounded-xl border bg-white p-4" style={{ borderColor: '#D8D4C8' }}>
            <h3 className="text-sm font-semibold mb-1" style={{ color: '#1E293B' }}>
              Rendimiento del modelo por departamento
            </h3>

            {/* Explicaciones de las métricas */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="rounded-lg p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#1E293B' }}>📏 MAE — Error promedio</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                  En promedio, cuántos focos se equivoca el modelo por mes. Un MAE de ±50 significa que la predicción típica está a 50 focos del valor real.
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#1E293B' }}>📈 R² — Qué tan bien sigue el patrón</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                  Qué fracción de los altibajos históricos captura el modelo. R² = 1.0 sería perfecto; R² = 0 equivale a predecir siempre el promedio; negativo significa peor que la media.
                </p>
              </div>
              <div className="rounded-lg p-3" style={{ backgroundColor: '#F8FAFC', border: '1px solid #E2E8F0' }}>
                <p className="text-xs font-semibold mb-1" style={{ color: '#1E293B' }}>🎯 Accuracy de riesgo — Aciertos de alerta</p>
                <p className="text-xs leading-relaxed" style={{ color: '#64748B' }}>
                  De cada 10 meses evaluados, en cuántos el modelo clasificó correctamente el nivel (bajo / medio / alto). Más directo que el MAE para decisiones de alerta.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
                    <th className="text-left pb-2 pr-3 font-semibold" style={{ color: '#64748B' }}>Departamento</th>
                    <th className="text-right pb-2 px-3 font-semibold" style={{ color: '#64748B' }}>MAE (focos/mes)</th>
                    <th className="text-right pb-2 px-3 font-semibold" style={{ color: '#64748B' }}>Promedio histórico/mes</th>
                    <th className="text-right pb-2 px-3 font-semibold" style={{ color: '#64748B' }}>R²</th>
                    <th className="text-right pb-2 px-3 font-semibold" style={{ color: '#64748B' }}>Aciertos riesgo</th>
                    <th className="text-right pb-2 pl-3 font-semibold" style={{ color: '#64748B' }}>Meses de examen</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(data.metadata.metricas_por_departamento)
                    .sort((a, b) => (a[1].mae ?? 9999) - (b[1].mae ?? 9999))
                    .map(([dept, m]) => {
                      const mae = m.mae;
                      const maeColor = mae == null ? '#94A3B8'
                        : mae < 50 ? '#065f46' : mae < 200 ? '#92400e' : '#9b1c1c';
                      const maeBg = mae == null ? 'transparent'
                        : mae < 50 ? '#d1fae5' : mae < 200 ? '#fef3c7' : '#fde8e8';
                      return (
                        <tr key={dept} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td className="py-1.5 pr-3 font-medium" style={{ color: '#1E293B' }}>
                            {dept.charAt(0) + dept.slice(1).toLowerCase()}
                          </td>
                          <td className="py-1.5 px-3 text-right">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
                              style={{ backgroundColor: maeBg, color: maeColor }}>
                              {mae != null ? `±${mae.toFixed(1)}` : m.nota ?? '—'}
                            </span>
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono" style={{ color: '#64748B' }}>
                            {m.promedio_historico_mensual != null ? m.promedio_historico_mensual.toFixed(1) : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono" style={{ color: '#1E293B' }}>
                            {m.r2 != null ? m.r2.toFixed(3) : '—'}
                          </td>
                          <td className="py-1.5 px-3 text-right font-mono" style={{ color: '#1E293B' }}>
                            {m.accuracy_riesgo != null ? `${(m.accuracy_riesgo * 10).toFixed(0)} de 10` : '—'}
                          </td>
                          <td className="py-1.5 pl-3 text-right" style={{ color: '#64748B' }}>
                            {m.meses_evaluados != null ? `${m.meses_evaluados} meses` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            <p className="text-xs mt-3" style={{ color: '#94A3B8' }}>
              🟢 MAE &lt; 50 · 🟡 MAE 50–200 · 🔴 MAE &gt; 200
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
