"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedEventManager } from "@/lib/services/authorization";
import { explainEventError } from "@/lib/services/event-errors";

type ActionResult = { success: boolean; message: string };

const DATETIME_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export async function saveEvent(
  eventId: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const authorization = await getAuthorizedEventManager();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }

  if (eventId !== null && !isUuid(eventId)) {
    return { success: false, message: "El identificador del evento no es válido." };
  }

  const name = formData.get("name");
  const startsAt = formData.get("starts_at") || "";
  const endsAt = formData.get("ends_at");
  const registration = formData.get("registration_deadline");
  const editing = formData.get("editing_deadline");

  const startDate = startsAt.slice(0, 10);
  if (registration && registration >= startDate) {
    return { success: false, message: "La fecha límite de registro debe ser anterior al inicio del evento." };
  }
  if (editing && editing >= startDate) {
    return { success: false, message: "La fecha límite de edición debe ser anterior al inicio del evento." };
  }
  if (registration && editing && editing <= registration) {
    return { success: false, message: "La fecha límite de edición debe ser posterior a la de registro." };
  }

  if (
    typeof name !== "string" ||
    typeof startsAt !== "string" ||
    typeof endsAt !== "string" ||
    typeof registration !== "string" ||
    typeof editing !== "string"
  ) {
    return { success: false, message: "Completa los datos requeridos." };
  }

  const cleanName = name.trim();
  if (cleanName.length < 2 || cleanName.length > 150) {
    return { success: false, message: "El nombre debe tener entre 2 y 150 caracteres." };
  }
  if (!DATETIME_RE.test(startsAt) || !DATETIME_RE.test(endsAt)) {
    return { success: false, message: "Las fechas de inicio y fin no son válidas." };
  }
  // Mismo formato, así que comparar como texto equivale a comparar fechas.
  if (endsAt <= startsAt) {
    return { success: false, message: "La fecha de fin debe ser posterior a la de inicio." };
  }
  if (
    (registration !== "" && !DATE_RE.test(registration)) ||
    (editing !== "" && !DATE_RE.test(editing))
  ) {
    return { success: false, message: "Las fechas límite no son válidas." };
  }

  const { error } = await authorization.supabase.rpc("save_event", {
    p_event_id: eventId,
    p_name: cleanName,
    p_starts_at: startsAt,
    p_ends_at: endsAt,
    p_registration_deadline: registration || null,
    p_editing_deadline: editing || null,
  });

  if (error) {
    return { success: false, message: explainEventError(error.message) };
  }

  revalidatePath("/eventos");
  return {
    success: true,
    message: eventId ? "Evento actualizado." : "Evento creado.",
  };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const authorization = await getAuthorizedEventManager();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }
  if (!isUuid(eventId)) {
    return { success: false, message: "El identificador del evento no es válido." };
  }

  const { error } = await authorization.supabase.rpc("delete_event", {
    p_event_id: eventId,
  });

  if (error) {
    return { success: false, message: explainEventError(error.message) };
  }

  revalidatePath("/eventos");
  return { success: true, message: "Evento eliminado." };
}