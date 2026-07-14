import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  const filePath = path.join(
    process.cwd(),
    'analytics',
    'data',
    'puntos_calor_por_semana_mes_con_coordenadas.csv',
  );

  const csv = await readFile(filePath, 'utf-8');

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="focos_historicos_amazonia_2017_hoy.csv"',
    },
  });
}
