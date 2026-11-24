import { connection } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { DashboardHome } from "@/components/dashboard/dashboard-home";
import { appRoles } from "@/lib/models/roles";
import type { AppRole } from "@/lib/models/roles";
import { getSettings } from "@/lib/services/app_settings";
import { getDashboardData } from "@/lib/services/dashboard";
import { createClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  await connection();

  const supabase = await createClient(await cookies());
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect("/login");

  const [settingsResult, ...roleResults] = await Promise.all([
    getSettings(supabase),
    ...appRoles.map((role) => supabase.rpc("has_role", { p_role: role })),
  ]);

  const roles: AppRole[] = appRoles.filter(
    (_, index) => roleResults[index].data === true,
  );

  const data = await getDashboardData(supabase, {
    userId,
    roles,
    timezone: settingsResult.data?.display_timezone ?? "UTC",
    toleranceSeconds: settingsResult.data?.duration_tolerance_seconds ?? 300,
  });

  return <DashboardHome data={data} />;
}