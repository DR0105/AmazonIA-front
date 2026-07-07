"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import type { Layer, LeafletMouseEvent, PathOptions } from 'leaflet';
import type { Prediccion } from '@/lib/predicciones/usePredicciones';

// We must import leaflet CSS at component level to avoid SSR issues
import 'leaflet/dist/leaflet.css';

interface Props {
  predicciones: Prediccion[];
  mesSeleccionado: number;
  anioSeleccionado: number;
}

type RiesgoLevel = 'alto' | 'medio' | 'bajo' | 'sin datos';

const RIESGO_COLORS: Record<RiesgoLevel, string> = {
  alto: '#ef4444',
  medio: '#f59e0b',
  bajo: '#22c55e',
  'sin datos': '#9ca3af',
};

const RIESGO_LABELS: Record<RiesgoLevel, string> = {
  alto: 'Alto',
  medio: 'Medio',
  bajo: 'Bajo',
  'sin datos': 'Sin datos',
};

// Normalize department names for matching GeoJSON DPTO_CNMBR vs JSON departamento
function normalizeDeptName(name: string): string {
  return name
    .toUpperCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

export default function ColombiaRiskMap({ predicciones, mesSeleccionado, anioSeleccionado }: Props) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [geoData, setGeoData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/colombia-geojson')
      .then(r => r.json())
      .then(setGeoData)
      .catch(console.error);
  }, []);

  // Build lookup map: normalizedDeptName → Prediccion
  const riesgoMap = new Map<string, Prediccion>();
  for (const p of predicciones) {
    if (p.mes === mesSeleccionado && p.anio === anioSeleccionado) {
      riesgoMap.set(normalizeDeptName(p.departamento), p);
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function styleFeature(feature: any): PathOptions {
    const dptName = normalizeDeptName(feature?.properties?.DPTO_CNMBR ?? '');
    const pred = riesgoMap.get(dptName);
    const riesgo: RiesgoLevel = pred?.riesgo_predicho ?? 'sin datos';
    return {
      fillColor: RIESGO_COLORS[riesgo],
      fillOpacity: 0.75,
      color: '#1a1a2e',
      weight: 1,
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function onEachFeature(feature: any, layer: Layer) {
    const dptName = normalizeDeptName(feature?.properties?.DPTO_CNMBR ?? '');
    const displayName: string = feature?.properties?.DPTO_CNMBR ?? 'Desconocido';
    const pred = riesgoMap.get(dptName);
    const riesgo: RiesgoLevel = pred?.riesgo_predicho ?? 'sin datos';
    const focos = pred ? Math.round(pred.total_predicho) : null;

    layer.bindTooltip(
      `<div style="font-family:Inter,sans-serif;min-width:140px;padding:2px 0">
        <strong style="font-size:13px">${displayName}</strong><br/>
        <span style="font-size:12px">Riesgo: <b style="color:${RIESGO_COLORS[riesgo]}">${RIESGO_LABELS[riesgo]}</b></span><br/>
        ${focos !== null ? `<span style="font-size:12px">Focos estimados: <b>${focos}</b></span>` : '<span style="font-size:11px;color:#9ca3af">Sin predicción</span>'}
      </div>`,
      { sticky: true, className: 'leaflet-tooltip-custom' }
    );

    layer.on({
      mouseover: (e: LeafletMouseEvent) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.95, weight: 2, color: '#ffffff' });
        l.bringToFront();
      },
      mouseout: (e: LeafletMouseEvent) => {
        const l = e.target;
        l.setStyle({ fillOpacity: 0.75, weight: 1, color: '#1a1a2e' });
      },
    });
  }

  return (
    <div style={{ height: 450, width: '100%', borderRadius: 12, overflow: 'hidden', position: 'relative' }}>
      <MapContainer
        center={[4.0, -73.5]}
        zoom={5}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          subdomains="abcd"
        />
        {geoData && (
          <GeoJSON
            key={`${mesSeleccionado}-${anioSeleccionado}`}
            data={geoData}
            style={styleFeature}
            onEachFeature={onEachFeature}
          />
        )}
      </MapContainer>

      {/* Legend */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          zIndex: 1000,
          background: 'rgba(15,15,30,0.85)',
          borderRadius: 8,
          padding: '8px 12px',
          color: 'white',
          fontSize: 12,
        }}
      >
        {(['alto', 'medio', 'bajo', 'sin datos'] as RiesgoLevel[]).map(r => (
          <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
            <span style={{ width: 12, height: 12, borderRadius: 2, backgroundColor: RIESGO_COLORS[r], display: 'inline-block' }} />
            <span>{RIESGO_LABELS[r]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
