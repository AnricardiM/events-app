import type { SupabaseClient } from "@supabase/supabase-js";
import {  isAppRole, type AppRole } from "@/lib/models/roles";

export type Profile = {
  full_name: string | null;
  avatar_url: string | null;
};

export type ManagedProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  is_active: boolean;
  created_at: string;
  roles: AppRole[];
};

export async function getProfile(
  supabase: SupabaseClient,
  userId: string,
) {
  return supabase
    .from("profiles")
    .select("full_name, avatar_url")
    .eq("id", userId)
    .maybeSingle();
}

export async function getProfilesWithRoles(supabase: SupabaseClient) {
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, is_active, created_at")
    .order("created_at", { ascending: false });

  if (profilesError) {
    return { data: null, error: profilesError };
  }

  const { data: roleRows, error: rolesError } = await supabase
    .from("user_roles")
    .select("user_id, role");

  if (rolesError) {
    return { data: null, error: rolesError };
  }

  const rolesByUser = new Map<string, AppRole[]>();

  for (const row of roleRows ?? []) {
    if (!isAppRole(row.role)) {
      return {
        data: null,
        error: new Error("Supabase devolvió un rol fuera del enum app_role."),
      };
    }

    const roles = rolesByUser.get(row.user_id) ?? [];
    roles.push(row.role);
    rolesByUser.set(row.user_id, roles);
  }

  return {
    data: (profiles ?? []).map((profile) => ({
      ...profile,
      roles: rolesByUser.get(profile.id) ?? [],
    })),
    error: null,
  };
}

export async function getUserRoles(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) return { data: [] as AppRole[], error };

  return {
    data: (data ?? []).map((row) => row.role).filter(isAppRole),
    error: null,
  };
}
