import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { TasksBoard } from "@/components/tasks/tasks-board";
import { getTasks } from "@/lib/services/tasks";
import { createClient } from "@/lib/supabase/server";

export default async function TareasPage() {
  await connection();
  const supabase = await createClient(await cookies());

  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub ?? null;
  if (!userId) redirect("/login");

  const [active, admin, programmer, review, edit] = await Promise.all([
    supabase.rpc("is_active_user"),
    supabase.rpc("has_role", { p_role: "admin" }),
    supabase.rpc("has_role", { p_role: "programmer" }),
    supabase.rpc("has_role", { p_role: "review" }),
    supabase.rpc("has_role", { p_role: "edit" }),
  ]);

  if (active.error || admin.error || programmer.error || review.error || edit.error) {
    console.error("No se pudieron verificar los permisos:", {
      active: active.error,
      admin: admin.error,
      programmer: programmer.error,
      review: review.error,
      edit: edit.error,
    });
    return (
      <section className="users-inline-message" role="alert">
        No se pudieron verificar tus permisos. Intenta nuevamente más tarde.
      </section>
    );
  }

  const isAdmin = Boolean(admin.data);
  const canAssign = isAdmin || Boolean(programmer.data);
  const canReview = isAdmin || Boolean(review.data);
  const canEdit = Boolean(edit.data);

  // Mis tareas existe para admin, review, edit y programmer.
  if (!active.data || (!canAssign && !canReview && !canEdit)) {
    redirect("/dashboard");
  }

  const tasks = await getTasks(supabase, { userId, canAssign, canEdit, canReview });

  return <TasksBoard tasks={tasks} />;
}