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

  const [active, admin, enter, review, programmer] = await Promise.all([
    supabase.rpc("is_active_user"),
    supabase.rpc("has_role", { p_role: "admin" }),
    supabase.rpc("has_role", { p_role: "enter" }),
    supabase.rpc("has_role", { p_role: "review" }),
    supabase.rpc("has_role", { p_role: "programmer" }),
  ]);

  if (active.error || admin.error || enter.error || review.error || programmer.error) {
    console.error("No se pudieron verificar los permisos:", {
      active: active.error,
      admin: admin.error,
      enter: enter.error,
      review: review.error,
      programmer: programmer.error,
    });
    return (
      <section className="users-inline-message" role="alert">
        No se pudieron verificar tus permisos. Intenta nuevamente más tarde.
      </section>
    );
  }

  if (!active.data) redirect("/dashboard");
  // Recepción es solo para quien registra contenido; el resto trabaja desde Tareas.
  if (!admin.data && !enter.data) redirect("/dashboard");

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
      canAccept={isAdmin || Boolean(review.data)}
      canAssign={isAdmin || Boolean(programmer.data)}
      canDelete={isAdmin}
      canRegister={isAdmin || Boolean(enter.data)}
      contents={contents}
      currentUserId={currentUserId}
      editors={Array.isArray(editors) ? editors : []}
      events={events}
      isAdmin={isAdmin}
    />
  );
}