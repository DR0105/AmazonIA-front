"use client";

import { useState } from "react";
import { PaperAirplaneIcon } from "@heroicons/react/24/outline";
import { chatMessages, suggestedQuestions } from "@/data/mock-dashboard";

export function CopilotChat() {
  const [messages, setMessages] = useState(chatMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = { id: Date.now(), type: "user" as const, text: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: "bot" as const,
          text: "Procesando datos satelitales de la región... He identificado patrones de correlación significativos. Los indicadores sugieren una aceleración del 18% en la frontera agrícola en los últimos 6 meses.",
        },
      ]);
      setLoading(false);
    }, 1500);
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ borderColor: "#D8D4C8", backgroundColor: "white" }}
    >
      <div className="flex h-96">
        {/* Sidebar */}
        <div
          className="w-48 flex-shrink-0 p-4 flex flex-col gap-3"
          style={{ backgroundColor: "#0F5132" }}
        >
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <div>
              <h4 className="text-sm font-bold text-white leading-tight">Copilot</h4>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.6)" }}>Científico</p>
            </div>
          </div>

          <p className="text-xs" style={{ color: "rgba(255,255,255,0.65)", lineHeight: "1.5" }}>
            Accede a la base de datos completa de monitoreo satelital y modelos climáticos mediante lenguaje natural.
          </p>

          <div className="space-y-2 mt-2">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => setInput(q)}
                className="w-full text-left text-xs px-2 py-2 rounded-md transition-all"
                style={{
                  backgroundColor: "rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.8)",
                  lineHeight: "1.4",
                }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className="max-w-xs px-3 py-2 rounded-lg text-sm"
                  style={
                    msg.type === "user"
                      ? { backgroundColor: "#F0F7F0", color: "#1E293B", borderRadius: "12px 12px 2px 12px" }
                      : { backgroundColor: "#F5F3EC", color: "#1E293B", borderRadius: "12px 12px 12px 2px", border: "1px solid #D8D4C8" }
                  }
                >
                  <p
                    style={{ lineHeight: "1.5" }}
                    dangerouslySetInnerHTML={{
                      __html: msg.text.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                    }}
                  />
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div
                  className="px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: "#F5F3EC", border: "1px solid #D8D4C8" }}
                >
                  <div className="flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        className="w-2 h-2 rounded-full animate-bounce"
                        style={{ backgroundColor: "#0F5132", animationDelay: `${i * 0.15}s` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Input */}
          <div className="p-3 border-t" style={{ borderColor: "#D8D4C8" }}>
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Haz una pregunta científica..."
                className="flex-1 px-3 py-2 rounded-lg text-sm outline-none border"
                style={{ borderColor: "#D8D4C8", color: "#1E293B" }}
              />
              <button
                onClick={handleSend}
                className="w-9 h-9 flex items-center justify-center rounded-lg transition-all hover:opacity-90"
                style={{ backgroundColor: "#0F5132" }}
              >
                <PaperAirplaneIcon className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
