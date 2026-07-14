"use client";

import { MessageCircle } from 'lucide-react';

export function OpenChatButton() {
  function handleClick() {
    window.dispatchEvent(new CustomEvent('amazonia:open-chat'));
    // Scroll suave al fondo para que el widget quede visible
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 100);
  }

  return (
    <button
      onClick={handleClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '14px 28px', borderRadius: 12,
        backgroundColor: '#22c55e', color: 'white',
        border: 'none', cursor: 'pointer', flexShrink: 0,
        fontWeight: 700, fontSize: 15,
        boxShadow: '0 4px 20px rgba(34,197,94,0.4)',
        transition: 'transform 0.15s, box-shadow 0.15s',
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)';
      }}
    >
      <MessageCircle size={20} strokeWidth={2} />
      Preguntar al asistente
    </button>
  );
}
