import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type AdminAuthorization =
  | { supabase: SupabaseClient; userId: string }
  | { error: string };

export async function getAuthorizedAdmin(): Promise<AdminAuthorization> {
  const supabase = await createClient(await cookies());
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { error: "Tu sesión no es válida. Inicia sesión nuevamente." };
  }

  const [
    { data: isActive, error: activeError },
    { data: isAdmin, error: roleError },
  ] = await Promise.all([
    supabase.rpc("is_active_user"),
    supabase.rpc("has_role", { p_role: "admin" }),
  ]);

  if (activeError || roleError) {
    console.error("No se pudieron verificar permisos administrativos:", {
      activeError,
      roleError,
    });
    return { error: "No se pudieron verificar tus permisos. Intenta más tarde." };
  }

  if (!isActive || !isAdmin) {
    return { error: "No tienes permisos para realizar esta operación." };
  }

  return { supabase, userId: claimsData.claims.sub };
}

export async function getAuthorizedEventManager(): Promise<AdminAuthorization> {
  const supabase = await createClient(await cookies());
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();

  if (claimsError || !claimsData?.claims?.sub) {
    return { error: "Tu sesión no es válida. Inicia sesión nuevamente." };
  }

  const { data: canManage, error } = await supabase.rpc("can_manage_events");

  if (error) {
    console.error("No se pudieron verificar permisos de eventos:", error);
    return { error: "No se pudieron verificar tus permisos. Intenta más tarde." };
  }
  if (!canManage) {
    return { error: "No tienes permisos para gestionar eventos." };
  }

  return { supabase, userId: claimsData.claims.sub };
}

export async function getAuthenticatedClient(): Promise<AdminAuthorization> {
  const supabase = await createClient(await cookies());
  const { data: claimsData, error } = await supabase.auth.getClaims();

  if (error || !claimsData?.claims?.sub) {
    return { error: "Tu sesión no es válida. Inicia sesión nuevamente." };
  }
  return { supabase, userId: claimsData.claims.sub };
}