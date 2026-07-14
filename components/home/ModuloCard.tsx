"use client";

import Link from 'next/link';
import { useState } from 'react';
import { Map, TrendingUp, Compass, Gamepad2 } from 'lucide-react';

const ICONO_MAP = { Map, TrendingUp, Compass, Gamepad2 } as const;
type IconoKey = keyof typeof ICONO_MAP;

interface Props {
  icono:       IconoKey;
  titulo:      string;
  descripcion: string;
  cta:         string;
  href:        string;
  color:       string;
}

export function ModuloCard({ icono, titulo, descripcion, cta, href, color }: Props) {
  const [hovered, setHovered] = useState(false);
  const Icono = ICONO_MAP[icono];

  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          backgroundColor: 'white',
          borderRadius: 14,
          padding: '28px 24px',
          border: `1px solid ${hovered ? color : '#E2E8F0'}`,
          boxShadow: hovered ? `0 4px 24px ${color}33` : 'none',
          height: '100%',
          cursor: 'pointer',
          transition: 'box-shadow 0.15s, border-color 0.15s',
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        <div style={{
          width: 50, height: 50, borderRadius: '50%',
          backgroundColor: `${color}15`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 16,
        }}>
          <Icono size={28} strokeWidth={1.5} color={color} />
        </div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: '#1E293B', marginBottom: 8 }}>
          {titulo}
        </h3>
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 20 }}>
          {descripcion}
        </p>
        <span style={{ fontSize: 13, fontWeight: 600, color }}>
          {cta}
        </span>
      </div>
    </Link>
  );
}
