import Link from 'next/link';
import { ModuloCard } from '@/components/home/ModuloCard';
import { NarrativaCards } from '@/components/home/NarrativaCards';
import { OpenChatButton } from '@/components/home/OpenChatButton';

// ─── Datos del equipo ─────────────────────────────────────────────────────────
const EQUIPO = [
  { nombre: 'Hanna Valentina Sarmiento Márquez',  rol: 'Desarrolladora front-end y QA'   },
  { nombre: 'Joseph Brayan Smith Caicedo Saenz',   rol: 'Desarrollador back-end'           },
  { nombre: 'Sebastián Castellanos Díaz',          rol: 'Desarrollador front-end'          },
  { nombre: 'Diego David Romero Quiroga',          rol: 'Analista de datos y comunicador' },
];

// ─── Módulos — icono como string key para que sea serializable ────────────────
const MODULOS = [
  {
    icono:       'Map' as const,
    titulo:      'Puntos de calor históricos',
    descripcion: 'Explora 9 años de focos de calor satelitales en los 10 departamentos, filtrables por año, mes y departamento.',
    cta:         'Ver mapa histórico →',
    href:        '/historico',
    color:       '#f59e0b',
  },
  {
    icono:       'TrendingUp' as const,
    titulo:      'Predicciones IA',
    descripcion: 'Consulta el nivel de riesgo estimado para los próximos 6 meses por departamento.',
    cta:         'Ver predicciones →',
    href:        '/predicciones',
    color:       '#ef4444',
  },
  {
    icono:       'Compass' as const,
    titulo:      '¿Cómo se hizo?',
    descripcion: 'Conoce el proceso completo, de los datos satelitales al modelo predictivo, y qué tan confiable es cada predicción.',
    cta:         'Ver metodología →',
    href:        '/como-se-hizo',
    color:       '#06b6d4',
  },
  {
    icono:       'Gamepad2' as const,
    titulo:      'Salva la Amazonía',
    descripcion: 'Juega como tomador de decisiones y equilibra industria, población, territorio, ecosistemas y gobernanza sin acelerar la deforestación.',
    cta:         'Jugar →',
    href:        '/juego',
    color:       '#22c55e',
  },
];

export default function HomePage() {
  return (
    <div style={{ backgroundColor: '#F5F3EC', minHeight: '100vh' }}>

      {/* ── A. HERO ──────────────────────────────────────────────────── */}
      <section style={{
        background: 'linear-gradient(135deg, #0a2e1a 0%, #0F5132 50%, #1B7A46 100%)',
        padding: '80px 48px 64px',
        position: 'relative', overflow: 'hidden',
      }}>
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }} />
        <div style={{ position: 'relative', maxWidth: 800 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28 }}>
            <span style={{
              fontSize: 32, width: 52, height: 52,
              background: 'rgba(255,255,255,0.12)', borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>🌿</span>
            <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, fontWeight: 500, letterSpacing: '0.08em' }}>
              AmazonIA
            </span>
          </div>
          <h1 style={{
            color: 'white', fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700, lineHeight: 1.2, marginBottom: 16,
          }}>
            Anticipar el fuego<br />antes de que ocurra
          </h1>
          <p style={{
            color: 'rgba(255,255,255,0.75)', fontSize: 18,
            lineHeight: 1.65, maxWidth: 620, marginBottom: 36,
          }}>
            Monitoreo satelital e inteligencia artificial para prevenir incendios forestales
            y la deforestación en la Amazonía y la Orinoquía colombiana.
          </p>
          <Link href="/predicciones">
            <span style={{
              display: 'inline-block',
              backgroundColor: '#22c55e', color: 'white',
              padding: '14px 32px', borderRadius: 10,
              fontWeight: 600, fontSize: 15, cursor: 'pointer',
              boxShadow: '0 4px 24px rgba(34,197,94,0.35)',
            }}>
              Ver predicciones de riesgo →
            </span>
          </Link>
        </div>
      </section>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 32px' }}>

        {/* ── B. POR QUÉ EXISTE AmazonIA ──────────────────────────────── */}
        <section style={{ padding: '64px 0 48px' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#0F5132', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Por qué existe AmazonIA
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1E293B', marginBottom: 36 }}>
            Qué resuelve AmazonIA
          </h2>
          <NarrativaCards />
        </section>

        {/* ── C. MÓDULOS ───────────────────────────────────────────────── */}
        <section style={{ paddingBottom: 64 }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#0F5132', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Módulos del proyecto
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1E293B', marginBottom: 36 }}>
            ¿Por dónde quieres empezar?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
            {MODULOS.map(props => (
              <ModuloCard key={props.href} {...props} />
            ))}
          </div>
        </section>

        {/* ── D. LLAMADA A LA ACCIÓN — CHATBOT ────────────────────────── */}
        <section style={{
          background: 'linear-gradient(135deg, #0a2e1a 0%, #0F5132 100%)',
          borderRadius: 16, padding: '36px 40px', marginBottom: 0,
          display: 'flex', flexWrap: 'wrap', gap: 24,
          alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div>
            <p style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
              Asistente IA
            </p>
            <h3 style={{ color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 8 }}>
              ¿Tienes una pregunta sobre los datos?
            </h3>
            <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14, maxWidth: 480, lineHeight: 1.6 }}>
              Consulta el histórico de focos de calor, las predicciones de riesgo
              o compara departamentos directamente con el asistente de AmazonIA.
            </p>
          </div>
          <OpenChatButton />
        </section>

        {/* ── E. FUENTES ───────────────────────────────────────────────── */}
        <section style={{
          borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0',
          padding: '40px 0',
          display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start',
        }}>
          <div style={{ flex: '1 1 320px' }}>
            <p style={{
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
              color: '#0F5132', textTransform: 'uppercase', marginBottom: 8,
            }}>
              Datos abiertos
            </p>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65, maxWidth: 480 }}>
              Los datos utilizados provienen del{' '}
              <strong style={{ color: '#1E293B' }}>
                Sistema de Información Ambiental Territorial de la Amazonia Colombiana (SIATAC)
              </strong>{' '}
              y están disponibles como dato abierto en datos.gov.co.
            </p>
          </div>
          <div style={{ flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <a href="https://www.datos.gov.co/dataset/Puntos-de-calor-por-regi-n-Hist-rico-Escala-1-100-/4dyk-z4e2/about_data"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#0F5132', fontWeight: 500 }}>
              Dataset en datos.gov.co ↗
            </a>
            <a href="https://siatac.co/reportes-puntos-de-calor/"
              target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 13, color: '#0F5132', fontWeight: 500 }}>
              Reportes SIATAC ↗
            </a>
          </div>
        </section>

        {/* ── E. EQUIPO ────────────────────────────────────────────────── */}
        <section style={{ padding: '48px 0 56px' }}>
          <p style={{
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            color: '#0F5132', textTransform: 'uppercase', marginBottom: 8,
          }}>
            Equipo
          </p>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: '#1E293B', marginBottom: 32 }}>
            Quiénes somos
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {EQUIPO.map(({ nombre, rol }) => {
              const iniciales = nombre.split(' ').filter((_, i) => i === 0 || i === 2).map(n => n[0]).join('');
              return (
                <div key={nombre} style={{
                  backgroundColor: 'white', borderRadius: 12,
                  padding: '20px', border: '1px solid #E2E8F0',
                  display: 'flex', alignItems: 'flex-start', gap: 14,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                    backgroundColor: '#0F5132',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', fontWeight: 700, fontSize: 13,
                  }}>
                    {iniciales}
                  </div>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#1E293B', marginBottom: 3 }}>{nombre}</p>
                    <p style={{ fontSize: 12, color: '#64748B' }}>{rol}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </div>

      {/* ── F. FOOTER ────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: '1px solid #D8D4C8', backgroundColor: '#F5F3EC',
        padding: '20px 48px',
        display: 'flex', flexWrap: 'wrap', gap: 12,
        alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          © 2026 AmazonIA · Datos: SIATAC / datos.gov.co
        </span>
        <span style={{ fontSize: 12, color: '#94A3B8' }}>
          AmazonIA usa modelos predictivos como apoyo a la toma de decisiones, no como certeza absoluta —{' '}
          <Link href="/como-se-hizo" style={{ color: '#0F5132', fontWeight: 500 }}>
            conoce el detalle en Cómo se hizo
          </Link>.
        </span>
      </footer>

    </div>
  );
}
