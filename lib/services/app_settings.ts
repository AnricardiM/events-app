import type { SupabaseClient } from "@supabase/supabase-js";

export type AppSettings = {
  singleton: boolean;
  duration_tolerance_seconds: number;
  display_timezone: string;
  section_warning_percent: number;
  registration_alert_days: number;
  event_retention_days: number;
  updated_at: string;
  updated_by: string | null;
};

export async function getSettings(supabase: SupabaseClient) {
  return supabase
    .from("app_settings")
    .select("*")
    .eq("singleton", true)
    .single<AppSettings>();
}
