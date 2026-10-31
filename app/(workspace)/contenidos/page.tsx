import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getContentData } from "@/lib/services/contents";
import { ContentsManagement } from "@/components/contents/contents-management";

export default async function ContenidosPage() {
   await connection();
  const supabase = await createClient(await cookies());

  const { data: claimsData } = await supabase.auth.getClaims();
const currentUserId = claimsData?.claims?.sub ?? null;

  const [active, admin, ingresador, revisor] = await Promise.all([
    supabase.rpc("is_active_user"),
    supabase.rpc("has_role", { p_role: "admin" }),
    supabase.rpc("has_role", { p_role: "ingresador" }),
    supabase.rpc("has_role", { p_role: "revisor" }),
  ]);

  if (active.error || admin.error || ingresador.error || revisor.error) {
    console.error("No se pudieron verificar los permisos:", {
      active: active.error,
      admin: admin.error,
      ingresador: ingresador.error,
      revisor: revisor.error,
    });
    return (
      <section className="users-inline-message" role="alert">
        No se pudieron verificar tus permisos. Intenta nuevamente más tarde.
      </section>
    );
  }

  if (!active.data) redirect("/dashboard");

  const { contents, events, blocks, editors, error } = await getContentData(supabase);

  if (error) {
    console.error("No se pudo cargar contenidos:", error);
    return (
      <section className="users-inline-message" role="alert">
        No se pudo cargar la lista de contenidos. Inténtalo de nuevo más tarde.
      </section>
    );
  }

  const isAdmin = Boolean(admin.data);

  return (
    <ContentsManagement
    blocks={blocks}
    canAccept={isAdmin || Boolean(revisor.data)}
    canAssign={isAdmin}
    canDelete={isAdmin}
    canRegister={isAdmin || Boolean(ingresador.data)}
    contents={contents}
    currentUserId={currentUserId}
    editors={Array.isArray(editors) ? editors : []}
    events={events}
    isAdmin={isAdmin}
/>
  );
}