"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";

type Message = { role: "user" | "assistant"; text: string };

const suggestions = [
  "¿Cómo registro un contenido?",
  "¿Por qué no puedo aprobar un archivo?",
  "¿Cuándo un bloque está completo?",
];

export function HelpAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages, open]);

  async function send(text: string) {
    const question = text.trim();
    if (!question || loading) return;

    const history: Message[] = [...messages, { role: "user", text: question }];
    setMessages([...history, { role: "assistant", text: "" }]);
    setInput("");
    setLoading(true);

    const setAnswer = (answer: string) =>
      setMessages((current) => [...current.slice(0, -1), { role: "assistant", text: answer }]);

    try {
      const response = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Se envían solo los últimos mensajes para no gastar de más.
        body: JSON.stringify({ messages: history.slice(-10) }),
      });

      if (!response.ok || !response.body) {
        const data = await response.json().catch(() => null);
        setAnswer(data?.error ?? "No se pudo obtener la respuesta.");
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let answer = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        answer += decoder.decode(value, { stream: true });
        setAnswer(answer);
      }
    } catch {
      setAnswer("No se pudo conectar. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void send(input);
  }

  return (
    <>
      <button
        aria-expanded={open}
        aria-label={open ? "Cerrar ayuda" : "Abrir ayuda"}
        className="fixed bottom-4 right-4 z-50 grid size-12 cursor-pointer place-items-center rounded-full bg-primary text-xl font-bold text-on-primary shadow-lg hover:bg-primary-hover"
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        {open ? "×" : "?"}
      </button>

      {open && (
        <section
          aria-label="Asistente de ayuda"
          className="fixed bottom-20 right-4 z-50 flex max-h-[min(70dvh,560px)] w-[min(calc(100vw-32px),380px)] flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-[0_18px_70px_rgb(12_12_35/24%)]"
        >
          <header className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-semibold text-text">Ayuda</h2>
            <p className="text-[11px] text-text-subtle">
              Respuestas generadas por IA; pueden tener errores.
            </p>
          </header>

          <div aria-live="polite" className="flex-1 overflow-y-auto px-4 py-3">
            {messages.length === 0 ? (
              <div className="grid gap-2">
                <p className="text-sm text-text-muted">¿En qué te puedo ayudar?</p>
                {suggestions.map((suggestion) => (
                  <button
                    className="cursor-pointer rounded-lg border border-border px-3 py-2 text-left text-sm text-text-muted hover:border-navy-300 hover:text-primary"
                    key={suggestion}
                    onClick={() => void send(suggestion)}
                    type="button"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            ) : (
              <ul className="grid gap-3">
                {messages.map((message, index) => (
                  <li
                    className={
                      message.role === "user"
                        ? "ml-8 justify-self-end rounded-xl bg-primary px-3 py-2 text-sm text-on-primary"
                        : "mr-8 whitespace-pre-wrap rounded-xl bg-surface-muted px-3 py-2 text-sm text-text"
                    }
                    key={index}
                  >
                    {message.text || (loading ? "Escribiendo..." : "")}
                  </li>
                ))}
              </ul>
            )}
            <div ref={endRef} />
          </div>

          <form className="flex gap-2 border-t border-border p-3" onSubmit={handleSubmit}>
            <input
              aria-label="Escribe tu pregunta"
              className="h-11 min-w-0 flex-1 rounded-lg border border-border bg-surface px-3 text-base text-text placeholder:text-text-subtle focus-visible:border-primary"
              disabled={loading}
              maxLength={1000}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Escribe tu pregunta"
              value={input}
            />
            <button
              className="min-h-11 cursor-pointer rounded-lg bg-primary px-4 text-sm font-semibold text-on-primary hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={loading || input.trim() === ""}
              type="submit"
            >
              Enviar
            </button>
          </form>
        </section>
      )}
    </>
  );
}