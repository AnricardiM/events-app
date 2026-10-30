import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getProfilesWithRoles } from "@/lib/services/profiles";
import { UsersManagement } from "@/components/users/users-management";

export default async function UsuariosPage() {
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

  const { data: profiles, error: profilesError } =
    await getProfilesWithRoles(supabase);

  if (profilesError) {
    console.error("No se pudo cargar la lista de perfiles:", profilesError);

    return (
      <section className="users-inline-message" role="alert">
        No se pudo cargar la lista de usuarios. Revisa los permisos de lectura
        en Supabase e inténtalo de nuevo.
      </section>
    );
  }

  return <UsersManagement users={profiles} />;
}
