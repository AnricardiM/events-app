"use server";

import { revalidatePath } from "next/cache";
import { explainEventError } from "@/lib/services/event-errors";
import { getAuthorizedEventManager } from "@/lib/services/authorization";

type ActionResult = { success: boolean; message: string };

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function saveBlock(
  eventId: string,
  blockId: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const authorization = await getAuthorizedEventManager();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }

  if (!UUID_RE.test(eventId) || (blockId !== null && !UUID_RE.test(blockId))) {
    return { success: false, message: "El identificador no es válido." };
  }

  const name = formData.get("name");
  const startsAt = formData.get("starts_at");
  const duration = formData.get("duration_minutes");

  if (
    typeof name !== "string" ||
    typeof startsAt !== "string" ||
    typeof duration !== "string"
  ) {
    return { success: false, message: "Completa los datos requeridos." };
  }

  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 150) {
    return { success: false, message: "El nombre debe tener entre 2 y 150 caracteres." };
  }
  if (!DATETIME_RE.test(startsAt)) {
    return { success: false, message: "La hora de inicio no es válida." };
  }

  const minutes = Number(duration);
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 1440) {
    return { success: false, message: "La duración debe ser de 1 a 1440 minutos." };
  }

  const { error } = await authorization.supabase.rpc("save_block", {
    p_event_id: eventId,
    p_block_id: blockId,
    p_name: cleanName,
    p_starts_at: startsAt,
    p_duration_minutes: minutes,
  });

  if (error) {
    return { success: false, message: explainEventError(error.message) };
  }

  revalidatePath(`/eventos/${eventId}/cronograma`);
  revalidatePath("/eventos");
  return {
    success: true,
    message: blockId ? "Bloque actualizado." : "Bloque creado.",
  };
}

export async function deleteBlock(
  eventId: string,
  blockId: string,
): Promise<ActionResult> {
  const authorization = await getAuthorizedEventManager();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }
  if (!UUID_RE.test(eventId) || !UUID_RE.test(blockId)) {
    return { success: false, message: "El identificador no es válido." };
  }

  const { error } = await authorization.supabase.rpc("delete_block", {
    p_block_id: blockId,
  });

  if (error) {
    return { success: false, message: explainEventError(error.message) };
  }

  revalidatePath(`/eventos/${eventId}/cronograma`);
  revalidatePath("/eventos");
  return { success: true, message: "Bloque eliminado." };
}