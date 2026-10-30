"use server";

import { revalidatePath } from "next/cache";
import { getAuthorizedAdmin } from "@/lib/services/authorization";

type ActionResult = { success: boolean; message: string };

function parseNumber(formData: FormData, name: string): number | null {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidTimezone(value: string) {
  try {
    new Intl.DateTimeFormat("es", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export async function updateAppSettings(
  formData: FormData,
): Promise<ActionResult> {
  const authorization = await getAuthorizedAdmin();
  if ("error" in authorization) {
    return { success: false, message: authorization.error };
  }

  const durationTolerance = parseNumber(formData, "duration_tolerance_seconds");
  const warningPercent = parseNumber(formData, "section_warning_percent");
  const alertDays = parseNumber(formData, "registration_alert_days");
  const retentionDays = parseNumber(formData, "event_retention_days");
  const timezone = formData.get("display_timezone");

  if (
    durationTolerance === null ||
    warningPercent === null ||
    alertDays === null ||
    retentionDays === null ||
    typeof timezone !== "string"
  ) {
    return { success: false, message: "Completa todos los campos." };
  }

  if (!Number.isInteger(durationTolerance) || durationTolerance < 0) {
    return {
      success: false,
      message: "La tolerancia de duración debe ser un entero de 0 o más.",
    };
  }
  if (warningPercent < 1 || warningPercent > 100) {
    return {
      success: false,
      message: "El porcentaje de aviso debe estar entre 1 y 100.",
    };
  }
  if (!Number.isInteger(alertDays) || alertDays < 0) {
    return {
      success: false,
      message: "Los días de alerta deben ser un entero de 0 o más.",
    };
  }
  if (!Number.isInteger(retentionDays) || retentionDays < 0) {
    return {
      success: false,
      message: "Los días de retención deben ser un entero de 0 o más.",
    };
  }
  if (!isValidTimezone(timezone)) {
    return { success: false, message: "La zona horaria no es válida." };
  }

  const { data, error } = await authorization.supabase
    .from("app_settings")
    .update({
      duration_tolerance_seconds: durationTolerance,
      display_timezone: timezone,
      section_warning_percent: warningPercent,
      registration_alert_days: alertDays,
      event_retention_days: retentionDays,
      updated_by: authorization.userId,
    })
    .eq("singleton", true)
    .select("singleton")
    .maybeSingle();

  if (error) {
    console.error("No se pudo actualizar la configuración:", error);
    return {
      success: false,
      message: "No se pudo guardar la configuración. Revisa los valores e inténtalo de nuevo.",
    };
  }

  // Con RLS, un UPDATE sin permiso no da error: simplemente afecta 0 filas.
  if (!data) {
    return {
      success: false,
      message: "No se actualizó ningún registro. Verifica tus permisos.",
    };
  }

  revalidatePath("/administracion");
  return { success: true, message: "Configuración guardada." };
}