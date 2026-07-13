import { NextRequest, NextResponse } from 'next/server';
import { recuperarContexto } from '@/lib/chatbot/retriever';
import { generarRespuesta } from '@/lib/chatbot/generator';

export async function POST(req: NextRequest) {
  try {
    const { pregunta } = await req.json() as { pregunta: string };

    if (!pregunta?.trim()) {
      return NextResponse.json({ error: 'Pregunta vacía' }, { status: 400 });
    }

    const contexto  = await recuperarContexto(pregunta);
    console.log('[api/chat] query parseada:', JSON.stringify(contexto.query));
    console.log('[api/chat] tipo contexto:', contexto.tipo);
    if (contexto.tipo === 'historico') {
      console.log('[api/chat] registros encontrados:', contexto.registros.length, 'totalFocos:', contexto.totalFocos);
    }

    const resultado = await generarRespuesta(pregunta, contexto);

    return NextResponse.json(resultado);
  } catch (err) {
    console.error('[api/chat] Error:', err);
    return NextResponse.json(
      { error: 'Error interno del chatbot. Intenta de nuevo.', detalle: String(err) },
      { status: 500 },
    );
  }
}
