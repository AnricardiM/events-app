import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/services/app_settings";
import { SettingManagement } from "@/components/settings/setting-management";

export default async function AdministracionPage() {
 await connection();
  const supabase = await createClient(await cookies());
  const [
    { data: isActive, error: activeError },
    { data: isAdmin, error: roleError },
  ] = await Promise.all([
    supabase.rpc("is_active_user"),
    supabase.rpc("has_role", { p_role: "admin" }),
  ]);

  if (activeError || roleError) {
    console.error("No se pudieron verificar los permisos de usuarios:", {
      activeError,
      roleError,
    });

    return (
      <section className="users-inline-message" role="alert">
        No se pudieron verificar tus permisos. Intenta nuevamente más tarde.
      </section>
    );
  }

  if (!isActive || !isAdmin) {
    redirect("/dashboard");
  }

  const { data: settings, error: app_settingError } =
    await getSettings(supabase);

  if (app_settingError) {
    console.error("No se pudo cargar la lista de configuración:", app_settingError);

    return (
      <section className="users-inline-message" role="alert">
        No se pudo cargar la configuracion. Revisa los permisos de lectura
        en Supabase e inténtalo de nuevo.
      </section>
    );
  }

  return (
    <SettingManagement
      settings={settings}
    />
  );
}
