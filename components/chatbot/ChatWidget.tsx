"use client";

import { useState, useRef, useEffect } from 'react';
import { X, Send, Loader2, ChevronDown } from 'lucide-react';

interface Evidencia {
  descripcion: string;
  valor:       string | number;
  fuente:      string;
}

interface Mensaje {
  id:         string;
  tipo:       'usuario' | 'bot';
  texto:      string;
  evidencia?: Evidencia[];
  fuente?:    string;
  cargando?:  boolean;
}

// Bloque de evidencia con expansión progresiva
const INICIAL = 5;
const PASO    = 20;

function EvidenciaExpandible({ evidencia, fuente }: { evidencia: Evidencia[]; fuente: string }) {
  const [visibles, setVisibles] = useState(INICIAL);
  const [abierto, setAbierto]   = useState(false);
  const total   = evidencia.length;
  const muestra = evidencia.slice(0, visibles);
  const quedan  = total - visibles;

  return (
    <div style={{ marginTop: 8 }}>
      <button
        onClick={() => setAbierto(v => !v)}
        style={{
          background: 'none', border: 'none', padding: 0,
          fontSize: 11, color: '#64748B', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 4, userSelect: 'none',
        }}
      >
        <ChevronDown
          size={12}
          style={{ transform: abierto ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
        />
        {abierto ? 'Ocultar evidencia' : `Ver evidencia (${total} registros)`}
      </button>

      {abierto && (
        <div style={{
          marginTop: 6, padding: '8px 10px',
          backgroundColor: '#F1F5F9', borderRadius: 6,
          fontSize: 11, color: '#475569',
        }}>
          {muestra.map((e, i) => (
            <div key={i} style={{ marginBottom: 4, lineHeight: 1.4 }}>
              <strong>{e.descripcion}:</strong> {e.valor}
            </div>
          ))}

          {quedan > 0 && (
            <button
              onClick={() => setVisibles(v => Math.min(v + PASO, total))}
              style={{
                marginTop: 6, padding: '4px 10px',
                borderRadius: 8, border: '1px solid #CBD5E1',
                backgroundColor: 'white', color: '#0F5132',
                fontSize: 11, fontWeight: 600, cursor: 'pointer',
                width: '100%',
              }}
            >
              + {quedan} más — ver más registros
            </button>
          )}

          {visibles >= total && total > INICIAL && (
            <button
              onClick={() => setVisibles(INICIAL)}
              style={{
                marginTop: 6, padding: '4px 10px',
                borderRadius: 8, border: '1px solid #CBD5E1',
                backgroundColor: 'white', color: '#64748B',
                fontSize: 11, cursor: 'pointer', width: '100%',
              }}
            >
              Mostrar menos
            </button>
          )}

          <div style={{ marginTop: 8, color: '#94A3B8', fontStyle: 'italic', borderTop: '1px solid #E2E8F0', paddingTop: 6 }}>
            Fuente: {fuente}
          </div>
        </div>
      )}
    </div>
  );
}

// Renderiza Markdown básico: **negrita**, *cursiva*, saltos de línea
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  return lines.map((line, li) => {
    // Parsear negrita e itálica en cada línea
    const parts = line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    const rendered = parts.map((part, pi) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={pi}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={pi}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
    return (
      <span key={li}>
        {rendered}
        {li < lines.length - 1 && <br />}
      </span>
    );
  });
}

const PREGUNTAS_SUGERIDAS = [
  '¿Cuántos focos hubo en Meta en 2023?',
  '¿Qué municipios tienen más focos de calor?',
  '¿Cuál es la predicción de riesgo para los próximos meses?',
  '¿Qué departamentos tienen riesgo alto?',
  'Muéstrame los focos de calor de Caquetá en 2022',
];

export function ChatWidget() {
  const [abierto, setAbierto]     = useState(false);
  const [mensajes, setMensajes]   = useState<Mensaje[]>([
    {
      id:    'bienvenida',
      tipo:  'bot',
      texto: '¡Hola! Soy AmazonIA, tu asistente de datos sobre focos de incendio en la Amazonía y Orinoquía colombiana. Puedo consultar el histórico de puntos de calor (2017–2026) y las predicciones de riesgo para los próximos 6 meses. ¿Qué quieres saber?',
    },
  ]);
  const [input, setInput]         = useState('');
  const [cargando, setCargando]   = useState(false);
  const [mostrarSugeridas, setMostrarSugeridas] = useState(true);

  const bottomRef   = useRef<HTMLDivElement>(null);
  const inputRef    = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  useEffect(() => {
    if (abierto) setTimeout(() => inputRef.current?.focus(), 100);
  }, [abierto]);

  // Permite abrir el chat desde cualquier parte con: window.dispatchEvent(new CustomEvent('amazonia:open-chat'))
  useEffect(() => {
    const handler = () => setAbierto(true);
    window.addEventListener('amazonia:open-chat', handler);
    return () => window.removeEventListener('amazonia:open-chat', handler);
  }, []);

  async function enviarPregunta(pregunta: string) {
    if (!pregunta.trim() || cargando) return;

    setMostrarSugeridas(false);
    const idUsuario = crypto.randomUUID();
    const idBot     = crypto.randomUUID();

    setMensajes(prev => [
      ...prev,
      { id: idUsuario, tipo: 'usuario', texto: pregunta },
      { id: idBot, tipo: 'bot', texto: '', cargando: true },
    ]);
    setInput('');
    setCargando(true);

    try {
      const res = await fetch('/api/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ pregunta }),
      });

      if (!res.ok) throw new Error('Error en la respuesta del servidor');

      const data = await res.json() as {
        respuesta: string;
        evidencia: Evidencia[];
        fuente:    string;
        tieneDatos: boolean;
      };

      setMensajes(prev => prev.map(m =>
        m.id === idBot
          ? { ...m, texto: data.respuesta, evidencia: data.evidencia, fuente: data.fuente, cargando: false }
          : m
      ));
    } catch {
      setMensajes(prev => prev.map(m =>
        m.id === idBot
          ? { ...m, texto: 'Hubo un error al procesar tu pregunta. Por favor intenta de nuevo.', cargando: false }
          : m
      ));
    } finally {
      setCargando(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    enviarPregunta(input);
  }

  return (
    <>
      {/* Botón flotante */}
      {!abierto && (
        <button
          onClick={() => setAbierto(true)}
          style={{
            position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
            width: 56, height: 56, borderRadius: '50%',
            backgroundColor: '#0F5132', color: 'white',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(15,81,50,0.4)',
            border: 'none', cursor: 'pointer',
            transition: 'transform 0.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          aria-label="Abrir chatbot AmazonIA"
        >
          <span style={{ fontSize: 22, lineHeight: 1 }}>🌿</span>
        </button>
      )}

      {/* Panel del chat */}
      {abierto && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          width: 380, height: 560,
          backgroundColor: 'white',
          borderRadius: 16,
          boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
        }}>

          {/* Header */}
          <div style={{
            background: 'linear-gradient(135deg, #0F5132, #1B7A46)',
            padding: '14px 16px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 22 }}>🌿</span>
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14, margin: 0 }}>AmazonIA Chat</p>
                <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, margin: 0 }}>
                  Datos históricos · Predicciones IA
                </p>
              </div>
            </div>
            <button
              onClick={() => setAbierto(false)}
              style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 4 }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Mensajes */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '12px 14px',
            display: 'flex', flexDirection: 'column', gap: 12,
            backgroundColor: '#F8FAFC',
          }}>
            {mensajes.map(m => (
              <div key={m.id} style={{
                display: 'flex',
                justifyContent: m.tipo === 'usuario' ? 'flex-end' : 'flex-start',
              }}>
                <div style={{
                  maxWidth: '85%',
                  backgroundColor: m.tipo === 'usuario' ? '#0F5132' : 'white',
                  color: m.tipo === 'usuario' ? 'white' : '#1E293B',
                  borderRadius: m.tipo === 'usuario' ? '14px 14px 4px 14px' : '14px 14px 14px 4px',
                  padding: '10px 13px',
                  fontSize: 13,
                  lineHeight: 1.55,
                  boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  border: m.tipo === 'bot' ? '1px solid #E2E8F0' : 'none',
                }}>
                  {m.cargando ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />
                      <span style={{ color: '#64748B', fontSize: 12 }}>Consultando datos…</span>
                    </div>
                  ) : (
                    <>
                      <div style={{ margin: 0 }}>{renderMarkdown(m.texto)}</div>

                      {/* Evidencia — solo si hay 2 o más registros */}
                      {m.evidencia && m.evidencia.length > 1 && (
                        <EvidenciaExpandible evidencia={m.evidencia} fuente={m.fuente ?? ''} />
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Preguntas sugeridas */}
            {mostrarSugeridas && (
              <div style={{ marginTop: 4 }}>
                <p style={{ fontSize: 11, color: '#94A3B8', marginBottom: 6 }}>Preguntas de ejemplo:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {PREGUNTAS_SUGERIDAS.map(q => (
                    <button
                      key={q}
                      onClick={() => enviarPregunta(q)}
                      style={{
                        fontSize: 11, padding: '4px 10px',
                        borderRadius: 12, border: '1px solid #D8D4C8',
                        backgroundColor: 'white', color: '#0F5132',
                        cursor: 'pointer', fontWeight: 500,
                      }}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSubmit}
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #E2E8F0',
              display: 'flex', gap: 8, alignItems: 'center',
              backgroundColor: 'white',
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="¿Cuántos focos hubo en Meta en 2023?"
              disabled={cargando}
              style={{
                flex: 1, padding: '8px 12px', borderRadius: 10,
                border: '1px solid #D8D4C8', fontSize: 13,
                outline: 'none', backgroundColor: cargando ? '#F8FAFC' : 'white',
                color: '#1E293B',
              }}
            />
            <button
              type="submit"
              disabled={cargando || !input.trim()}
              style={{
                width: 36, height: 36, borderRadius: 10,
                backgroundColor: cargando || !input.trim() ? '#E2E8F0' : '#0F5132',
                color: 'white', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: cargando || !input.trim() ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.15s',
              }}
            >
              {cargando ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={16} />}
            </button>
          </form>
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  );
}
