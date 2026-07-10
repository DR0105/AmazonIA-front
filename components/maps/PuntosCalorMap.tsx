"use client";

import { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const DEPTO_COLORS: Record<string, string> = {
  'AMAZONAS': '#f59e0b',
  'CAQUETÁ':  '#ef4444',
  'CAUCA':    '#8b5cf6',
  'GUAINÍA':  '#06b6d4',
  'GUAVIARE': '#f97316',
  'META':     '#dc2626',
  'NARIÑO':   '#10b981',
  'PUTUMAYO': '#6366f1',
  'VAUPÉS':   '#ec4899',
  'VICHADA':  '#84cc16',
};

const MESES_ES: Record<number, string> = {
  1:'Enero', 2:'Febrero', 3:'Marzo', 4:'Abril', 5:'Mayo', 6:'Junio',
  7:'Julio', 8:'Agosto', 9:'Septiembre', 10:'Octubre', 11:'Noviembre', 12:'Diciembre',
};
const COLOMBIA_CENTER: [number, number] = [1.5, -73.0];
const MAX_PUNTOS = 30_000;

interface RawData {
  columns: string[];
  data: [number, number, string, string, string, number, number, number][];
}

interface Punto {
  lon:          number;
  lat:          number;
  departamento: string;
  municipio:    string;
  paisaje:      string;
  anio:         number;
  mes:          number;
  semana_mes:   number;
}

interface Props {
  anioFiltro:  number | null;
  mesFiltro:   number | null;
  deptoFiltro: string | null;
}

// Sub-componente para invalidar el tamaño cuando el mapa monta
function ResizeHelper() {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => map.invalidateSize(), 100);
  }, [map]);
  return null;
}

export default function PuntosCalorMap({ anioFiltro, mesFiltro, deptoFiltro }: Props) {
  const [allPuntos, setAllPuntos] = useState<Punto[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);

  // Cargar datos una sola vez
  useEffect(() => {
    fetch('/api/puntos-historicos')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((raw: RawData) => {
        const puntos: Punto[] = raw.data.map(([lon, lat, departamento, municipio, paisaje, anio, mes, semana_mes]) => ({
          lon, lat, departamento, municipio, paisaje, anio, mes, semana_mes,
        }));
        setAllPuntos(puntos);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  // Filtrar
  let filtrados = allPuntos;
  if (anioFiltro  != null) filtrados = filtrados.filter(p => p.anio === anioFiltro);
  if (mesFiltro   != null) filtrados = filtrados.filter(p => p.mes  === mesFiltro);
  if (deptoFiltro != null) filtrados = filtrados.filter(p => p.departamento === deptoFiltro);

  const esMuestra = filtrados.length > MAX_PUNTOS;
  const muestra   = esMuestra
    ? filtrados.filter((_, i) => i % Math.ceil(filtrados.length / MAX_PUNTOS) === 0)
    : filtrados;

  if (error) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: '#0f0f1e', color: '#ef4444', fontSize: 13, borderRadius: 12 }}>
        Error cargando puntos: {error}
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Overlay de carga */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1000, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(15,15,30,0.9)', color: '#9ca3af', fontSize: 14,
        }}>
          Cargando datos satelitales…
        </div>
      )}

      <MapContainer
        center={COLOMBIA_CENTER}
        zoom={5}
        style={{ height: 560, width: '100%', background: '#0f0f1e' }}
        zoomControl
        attributionControl={false}
      >
        <ResizeHelper />
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {!loading && muestra.map((p, i) => (
          <CircleMarker
            key={i}
            center={[p.lat, p.lon]}
            radius={3}
            pathOptions={{
              color:       DEPTO_COLORS[p.departamento] ?? '#f59e0b',
              fillColor:   DEPTO_COLORS[p.departamento] ?? '#f59e0b',
              fillOpacity: 0.7,
              weight:      0,
            }}
          >
            <Tooltip sticky>
              <div style={{ fontSize: 12, lineHeight: 1.5 }}>
                <b>{p.departamento.charAt(0) + p.departamento.slice(1).toLowerCase()}</b>
                <br />{p.municipio}
                <br /><span style={{ color: '#888' }}>{p.paisaje}</span>
                <br />{MESES_ES[p.mes]} {p.anio} · Semana {p.semana_mes}
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      {/* Leyenda */}
      {!loading && (
        <div style={{
          position: 'absolute', bottom: 16, left: 16, zIndex: 1000,
          background: 'rgba(15,15,30,0.88)', borderRadius: 8, padding: '8px 12px',
          color: 'white', fontSize: 11, pointerEvents: 'none',
        }}>
          {Object.entries(DEPTO_COLORS).map(([dept, color]) => (
            <div key={dept} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: color, flexShrink: 0 }} />
              <span>{dept.charAt(0) + dept.slice(1).toLowerCase()}</span>
            </div>
          ))}
        </div>
      )}

      {/* Contador */}
      {!loading && (
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 1000,
          background: 'rgba(15,15,30,0.88)', borderRadius: 8, padding: '6px 10px',
          color: '#9ca3af', fontSize: 11, pointerEvents: 'none',
        }}>
          {muestra.length.toLocaleString('es-CO')} puntos visibles
          {esMuestra && <span style={{ color: '#f59e0b' }}> (muestra)</span>}
          {' · '}{filtrados.length.toLocaleString('es-CO')} total filtrado
        </div>
      )}
    </div>
  );
}
