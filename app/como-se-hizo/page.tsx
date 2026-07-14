"use client";

import { Header } from '@/components/layout/Header';
import { usePredicciones } from '@/lib/predicciones/usePredicciones';

const PASOS = [
  {
    numero: 1,
    icono: '🛰️',
    titulo: 'Se recolectaron 9 años de datos satelitales',
    texto:
      'Desde enero de 2017 hasta hoy, se descargaron todos los registros de puntos de calor del sistema oficial SIATAC para los 10 departamentos de la Amazonia y la Orinoquia. Cada registro indica cuándo y dónde un satélite detectó una anomalía de calor compatible con fuego activo.',
  },
  {
    numero: 2,
    icono: '📊',
    titulo: 'Se organizaron por mes y departamento',
    texto:
      'Los registros individuales se agruparon para saber, mes por mes y departamento por departamento, cuántos focos de incendio hubo en total. Un mes sin registros se cuenta como cero, porque un mes tranquilo también es información valiosa.',
  },
  {
    numero: 3,
    icono: '🌿',
    titulo: 'El modelo aprendió a reconocer patrones',
    texto:
      'En vez de que una persona escriba reglas a mano, se le mostraron al modelo cientos de ejemplos históricos reales y él mismo descubrió qué combinaciones de información pasada anticipan mejor lo que viene: el mes pasado, hace 3 y 12 meses, el promedio reciente, la época del año.',
  },
  {
    numero: 4,
    icono: '🧪',
    titulo: 'Se puso a prueba antes de confiar en él',
    texto:
      'Se le ocultaron los últimos 12 meses de cada departamento y se le pidió que adivinara qué había ocurrido. Después se comparó su predicción contra lo que realmente pasó. Así se obtuvieron las métricas de confiabilidad que ves en la sección de Predicciones IA.',
  },
  {
    numero: 5,
    icono: '📡',
    titulo: 'Con el modelo evaluado, se proyectan los próximos 6 meses',
    texto:
      'Una vez confirmado que el modelo funciona razonablemente bien, se usa toda la historia disponible para estimar los próximos 6 meses, mes por mes, para cada departamento. La incertidumbre crece con el horizonte porque cada mes futuro se apoya en predicciones previas.',
  },
];

export default function ComoSeHizoPage() {
  const { data, loading } = usePredicciones();

  const metricas = data?.metadata;
  const reg = metricas?.metricas_globales ?? (metricas as any)?.metricas_regresion;
  const cls = metricas?.metricas_globales ?? (metricas as any)?.metricas_clasificacion_riesgo;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="¿Cómo se hizo?" subtitle="El proceso detrás del modelo predictivo" />

      <div className="flex-1 p-6 max-w-3xl mx-auto w-full space-y-6">
        {/* Pasos */}
        <div className="space-y-4">
          {PASOS.map((paso, idx) => (
            <div
              key={paso.numero}
              className="rounded-xl border bg-white p-6 flex gap-5"
              style={{ borderColor: '#D8D4C8' }}
            >
              {/* Número y línea vertical */}
              <div className="flex flex-col items-center gap-2" style={{ minWidth: 40 }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: '#0F5132' }}
                >
                  {paso.numero}
                </div>
                {idx < PASOS.length - 1 && (
                  <div style={{ width: 2, flex: 1, minHeight: 24, backgroundColor: '#D8D4C8', borderRadius: 1 }} />
                )}
              </div>

              {/* Contenido */}
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{paso.icono}</span>
                  <h3 className="text-base font-semibold" style={{ color: '#1E293B' }}>
                    {paso.titulo}
                  </h3>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>
                  {paso.texto}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Sección de confiabilidad */}
        <div>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#1E293B' }}>¿Qué tan confiable es?</h2>
          {loading ? (
            <div className="skeleton" style={{ height: 120, borderRadius: 12 }} />
          ) : (
            <div className="rounded-xl border bg-white p-6" style={{ borderColor: '#D8D4C8' }}>
              <div className="grid grid-cols-2 gap-6">
                <MetricaCard
                  icono="🎯"
                  label="Acierta el nivel de riesgo"
                  value={reg ? `${Math.round((reg.accuracy_riesgo ?? 0) * 10)} de cada 10 meses` : '—'}
                  nota="Accuracy del clasificador de riesgo"
                />
                <MetricaCard
                  icono="📏"
                  label="Error promedio"
                  value={reg ? `±${Math.round(reg.mae)} focos por mes` : '—'}
                  nota="MAE (Error Absoluto Medio)"
                />
                <MetricaCard
                  icono="📈"
                  label="Explica el comportamiento histórico"
                  value={reg ? `${Math.round(reg.r2 * 100)}% del patrón capturado` : '—'}
                  nota="R² del modelo de regresión"
                />
                <MetricaCard
                  icono="⚖️"
                  label="Precisión balanceada por categoría"
                  value={cls ? `${(cls.precision_macro * 100).toFixed(1)}%` : '—'}
                  nota="Precision macro (bajo / medio / alto)"
                />
              </div>
              <div
                className="mt-5 rounded-lg p-4 text-sm"
                style={{ backgroundColor: '#F0FDF4', borderLeft: '4px solid #0F5132', color: '#064E3B' }}
              >
                <strong>Nota de contexto:</strong> Un modelo perfecto sería imposible — los incendios dependen de
                decisiones humanas, lluvia y viento que ninguna serie histórica puede predecir al 100%.
                El objetivo es detectar tendencias y alertar con antelación, no predecir el número exacto.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MetricaCard({ icono, label, value, nota }: { icono: string; label: string; value: string; nota: string }) {
  return (
    <div className="flex gap-3 items-start">
      <span className="text-2xl mt-0.5">{icono}</span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#64748B' }}>{label}</p>
        <p className="text-lg font-bold" style={{ color: '#0F5132' }}>{value}</p>
        <p className="text-xs mt-0.5" style={{ color: '#94A3B8' }}>{nota}</p>
      </div>
    </div>
  );
}
