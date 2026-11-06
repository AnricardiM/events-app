import { GoogleGenAI } from "@google/genai";
import { cookies } from "next/headers";
import { HELP_SYSTEM_PROMPT } from "@/lib/ai/help-context";
import { getUserRoles } from "@/lib/services/profiles";
import { createClient } from "@/lib/supabase/server";

type ChatMessage = { role: "user" | "assistant"; text: string };

const MAX_MESSAGES = 12;
const MAX_CHARS = 1000;

// Límite sencillo por usuario. En memoria: sirve para desarrollo, pero no se
// comparte entre instancias en producción (ahí usa Redis/Upstash o una tabla).
const hits = new Map<string, number[]>();
function isRateLimited(userId: string) {
  const now = Date.now();
  const recent = (hits.get(userId) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(userId, recent);
  return recent.length > 20;
}

function parseMessages(body: unknown): ChatMessage[] | null {
  const messages = (body as { messages?: unknown })?.messages;
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > MAX_MESSAGES) {
    return null;
  }
  const parsed: ChatMessage[] = [];
  for (const item of messages) {
    const { role, text } = (item ?? {}) as Partial<ChatMessage>;
    if (
      (role !== "user" && role !== "assistant") ||
      typeof text !== "string" ||
      text.trim() === "" ||
      text.length > MAX_CHARS
    ) {
      return null;
    }
    parsed.push({ role, text: text.trim() });
  }
  // Debe empezar y terminar con un mensaje del usuario.
  if (parsed[0].role !== "user" || parsed[parsed.length - 1].role !== "user") return null;
  return parsed;
}

export async function POST(request: Request) {
  const supabase = await createClient(await cookies());
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub;

  if (error || !userId) {
    return Response.json({ error: "Inicia sesión para usar la ayuda." }, { status: 401 });
  }
  if (!process.env.GEMINI_API_KEY) {
    console.error("Falta GEMINI_API_KEY");
    return Response.json({ error: "La ayuda no está configurada." }, { status: 500 });
  }
  if (isRateLimited(userId)) {
    return Response.json(
      { error: "Hiciste muchas preguntas seguidas. Espera unos minutos." },
      { status: 429 },
    );
  }

  const messages = parseMessages(await request.json().catch(() => null));
  if (!messages) {
    return Response.json({ error: "Mensaje no válido." }, { status: 400 });
  }

  // Los roles del usuario se leen en el servidor con su propia sesión (respeta RLS).
  const { data: roles } = await getUserRoles(supabase, userId);
  const roleText = Array.isArray(roles) && roles.length > 0 ? roles.join(", ") : "sin rol";

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

  try {
    const stream = await ai.models.generateContentStream({
      model: process.env.GEMINI_MODEL ?? "gemini-flash-latest",
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.text }],
      })),
      config: {
        systemInstruction: `${HELP_SYSTEM_PROMPT}\n\nRol(es) de quien pregunta: ${roleText}.`,
        temperature: 0.3,
        maxOutputTokens: 700,
      },
    });

    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            if (chunk.text) controller.enqueue(encoder.encode(chunk.text));
          }
        } catch (streamError) {
          console.error("Error en el streaming de Gemini:", streamError);
          controller.enqueue(encoder.encode("\n\n(Se cortó la respuesta. Inténtalo de nuevo.)"));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(body, {
      headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (apiError) {
    console.error("Error al llamar a Gemini:", apiError);
    return Response.json(
      { error: "No se pudo obtener la respuesta. Inténtalo más tarde." },
      { status: 502 },
    );
  }
}