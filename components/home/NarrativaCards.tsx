// Server Component — los íconos se instancian aquí, no se pasan como props
import { Flame, Satellite, Bot, Users } from 'lucide-react';

const NARRATIVA = [
  {
    Icono: Flame,
    color: '#ef4444',
    titulo: 'El problema',
    texto:
      'Un foco de calor detectado significa que el fuego ya empezó. Para frenar la deforestación, los equipos en terreno necesitan saber con semanas de anticipación qué zonas tienen mayor probabilidad de arder.',
  },
  {
    Icono: Satellite,
    color: '#06b6d4',
    titulo: 'La fuente',
    texto:
      'AmazonIA parte del histórico oficial de puntos de calor del SIATAC, disponible como dato abierto en datos.gov.co. Son años de registros satelitales desde enero de 2017, cubriendo los 10 departamentos de la Amazonía y la Orinoquía colombiana.',
  },
  {
    Icono: Bot,
    color: '#8b5cf6',
    titulo: 'El enfoque',
    texto:
      'Esos registros entrenan un modelo independiente por departamento que estima el riesgo de incendio para los próximos 6 meses. El objetivo es que cada departamento tenga una ventana de tiempo para actuar antes de que el fuego empiece.',
  },
  {
    Icono: Users,
    color: '#0F5132',
    titulo: 'La dimensión humana',
    texto:
      'Frenar la deforestación implica decisiones sobre industria, población, territorio, ecosistemas y gobernanza, con actores que no siempre están de acuerdo entre sí. Salva la Amazonía, el juego incluido en esta plataforma, pone a la persona usuaria a tomar esas mismas decisiones.',
  },
];

export function NarrativaCards() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: 20 }}>
      {NARRATIVA.map(({ Icono, color, titulo, texto }) => (
        <div key={titulo} style={{
          backgroundColor: 'white', borderRadius: 12,
          padding: '24px 22px', border: '1px solid #E2E8F0',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            backgroundColor: `${color}15`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16,
          }}>
            <Icono size={32} strokeWidth={1.5} color={color} />
          </div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>{titulo}</h3>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.65 }}>{texto}</p>
        </div>
      ))}
    </div>
  );
}
