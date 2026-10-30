"use server";

import { revalidatePath } from "next/cache";
import {
  contentCategories,
  contentMedia,
  contentSources,
  isOneOf,
} from "@/lib/models/content";
import { getAuthenticatedClient } from "@/lib/services/authorization";
import { explainContentError } from "@/lib/services/content-errors";

type ActionResult = { success: boolean; message: string };

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readInt(formData: FormData, name: string) {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function saveContent(
  contentId: string | null,
  formData: FormData,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient();
  if ("error" in auth) return { success: false, message: auth.error };

  if (contentId !== null && !UUID_RE.test(contentId)) {
    return { success: false, message: "El identificador no es válido." };
  }

  const fileName = formData.get("file_name");
  const deliveredBy = formData.get("delivered_by");
  const category = formData.get("content_category");
  const media = formData.get("media_type");
  const source = formData.get("source");
  const blockId = formData.get("block_id");
  const eventId = formData.get("event_id");
  const minutes = readInt(formData, "duration_minutes");
  const seconds = readInt(formData, "duration_seconds");
  const filesCount = readInt(formData, "files_count");

  if (
    typeof fileName !== "string" ||
    typeof deliveredBy !== "string" ||
    typeof blockId !== "string" ||
    typeof eventId !== "string" ||
    minutes === null ||
    seconds === null ||
    filesCount === null ||
    !isOneOf(contentCategories, category) ||
    !isOneOf(contentMedia, media) ||
    !isOneOf(contentSources, source)
  ) {
    return { success: false, message: "Completa los datos requeridos." };
  }

  const cleanFile = fileName.trim();
  const cleanPerson = deliveredBy.trim();

  if (cleanFile.length < 1 || cleanFile.length > 200) {
    return { success: false, message: "El nombre del archivo debe tener entre 1 y 200 caracteres." };
  }
  if (cleanPerson.length < 2 || cleanPerson.length > 120) {
    return { success: false, message: "El nombre de la persona debe tener entre 2 y 120 caracteres." };
  }
  if (!UUID_RE.test(eventId)) {
  return { success: false, message: "Selecciona un evento." };
  }
  if (!UUID_RE.test(blockId)) {
    return { success: false, message: "Selecciona un bloque." };
  }


  if (minutes < 0 || seconds < 0 || seconds > 59) {
    return { success: false, message: "Los segundos deben estar entre 0 y 59." };
  }
  const duration = minutes * 60 + seconds;
  if (duration < 1 || duration > 86400) {
    return { success: false, message: "La duración debe ser mayor a cero y de hasta 24 horas." };
  }
  if (filesCount < 1 || filesCount > 999) {
    return { success: false, message: "La cantidad de archivos debe estar entre 1 y 999." };
  }

  const common = {
    p_event_id: eventId,
    p_block_id: blockId,
    p_file_name: cleanFile,
    p_category: category,
    p_delivered_by: cleanPerson,
    p_media: media,
    p_source: source,
    p_duration_seconds: duration,
    p_files_count: filesCount,
  };

  const { error } = contentId
    ? await auth.supabase.rpc("update_content", { p_content_id: contentId, ...common })
    : await auth.supabase.rpc("register_content", common);

  if (error) return { success: false, message: explainContentError(error.message) };

  revalidatePath("/contenidos");
  revalidatePath("/eventos/[eventId]/cronograma", "page");
  return {
    success: true,
    message: contentId ? "Contenido actualizado." : "Contenido registrado.",
  };
}

export async function deleteContent(contentId: string): Promise<ActionResult> {
  const auth = await getAuthenticatedClient();
  if ("error" in auth) return { success: false, message: auth.error };
  if (!UUID_RE.test(contentId)) {
    return { success: false, message: "El identificador no es válido." };
  }

  const { error } = await auth.supabase.rpc("delete_content", {
    p_content_id: contentId,
  });
  if (error) return { success: false, message: explainContentError(error.message) };

  revalidatePath("/contenidos");
  return { success: true, message: "Contenido eliminado." };
}

export async function assignContentEditor(
  contentId: string,
  editorId: string | null,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient();
  if ("error" in auth) return { success: false, message: auth.error };
  if (!UUID_RE.test(contentId) || (editorId !== null && !UUID_RE.test(editorId))) {
    return { success: false, message: "El identificador no es válido." };
  }

  const { error } = await auth.supabase.rpc("assign_content_editor", {
    p_content_id: contentId,
    p_editor_id: editorId,
  });
  if (error) return { success: false, message: explainContentError(error.message) };

  revalidatePath("/contenidos");
  revalidatePath("/eventos/[eventId]/cronograma", "page");
  return {
    success: true,
    message: editorId ? "Editor asignado." : "Se quitó la asignación del editor.",
  };
}

export async function setContentAccepted(
  contentId: string,
  accepted: boolean,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient();
  if ("error" in auth) return { success: false, message: auth.error };
  if (!UUID_RE.test(contentId) || typeof accepted !== "boolean") {
    return { success: false, message: "El identificador no es válido." };
  }

  const { error } = await auth.supabase.rpc("set_content_accepted", {
    p_content_id: contentId,
    p_accepted: accepted,
  });
  if (error) return { success: false, message: explainContentError(error.message) };

  revalidatePath("/contenidos");
  revalidatePath("/eventos/[eventId]/cronograma", "page");
  return {
    success: true,
    message: accepted ? "Contenido aceptado." : "Se quitó la aceptación.",
  };
}

export async function setContentEdited(
  contentId: string,
  edited: boolean,
): Promise<ActionResult> {
  const auth = await getAuthenticatedClient();
  if ("error" in auth) return { success: false, message: auth.error };
  if (!UUID_RE.test(contentId) || typeof edited !== "boolean") {
    return { success: false, message: "El identificador no es válido." };
  }

  const { error } = await auth.supabase.rpc("set_content_edited", {
    p_content_id: contentId,
    p_edited: edited,
  });
  if (error) return { success: false, message: explainContentError(error.message) };

  revalidatePath("/contenidos");
  revalidatePath("/eventos/[eventId]/cronograma", "page");
  return {
    success: true,
    message: edited ? "Contenido marcado como editado." : "Se quitó la marca de editado.",
  };
}