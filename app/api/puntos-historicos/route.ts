import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET() {
  const filePath = path.join(process.cwd(), 'analytics', 'data', 'puntos_historicos.json');
  const raw = await readFile(filePath, 'utf-8');
  return new NextResponse(raw, {
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  });
}
