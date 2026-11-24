import type { SupabaseClient } from "@supabase/supabase-js";
import { CONTENT_COLUMNS } from "@/lib/services/contents";
import type { ContentRow, EditorOption } from "@/lib/services/contents";

// Máximo de tareas por lista. Si hay más, el contador total sigue siendo exacto.
const LIST_LIMIT = 200;

export type TaskList = { total: number; items: ContentRow[] };

export type TasksData = {
  /** admin y programmer: contenido que necesita edición y no tiene editor. */
  toAssign: TaskList | null;
  /** edit: contenido asignado al usuario que todavía no marcó como editado. */
  toEdit: TaskList | null;
  /** admin y review: contenido editado que falta aprobar o rechazar. */
  toReview: TaskList | null;
  editors: EditorOption[];
  hasError: boolean;
};

export async function getTasks(
  supabase: SupabaseClient,
  options: {
    userId: string;
    canAssign: boolean;
    canEdit: boolean;
    canReview: boolean;
  },
): Promise<TasksData> {
  const { userId, canAssign, canEdit, canReview } = options;
  let hasError = false;

  const run = async (
    enabled: boolean,
    build: () => PromiseLike<{
      data: unknown;
      count: number | null;
      error: unknown;
    }>,
  ): Promise<TaskList | null> => {
    if (!enabled) return null;
    const { data, count, error } = await build();
    if (error) {
      console.error("No se pudo cargar una lista de tareas:", error);
      hasError = true;
      return { total: 0, items: [] };
    }
    const items = (data as ContentRow[] | null) ?? [];
    return { total: count ?? items.length, items };
  };

  const [toAssign, toEdit, toReview, editorsRes] = await Promise.all([
    run(canAssign, () =>
      supabase
        .from("event_contents")
        .select(CONTENT_COLUMNS, { count: "exact" })
        .eq("needs_editing", true)
        .is("assigned_editor", null)
        .order("created_at", { ascending: false })
        .limit(LIST_LIMIT),
    ),
    run(canEdit, () =>
      supabase
        .from("event_contents")
        .select(CONTENT_COLUMNS, { count: "exact" })
        .eq("needs_editing", true)
        .eq("assigned_editor", userId)
        .eq("edited", false)
        .order("updated_at", { ascending: false })
        .limit(LIST_LIMIT),
    ),
    run(canReview, () =>
      supabase
        .from("event_contents")
        .select(CONTENT_COLUMNS, { count: "exact" })
        .eq("needs_editing", true)
        .eq("edited", true)
        .eq("accepted", false)
        .order("updated_at", { ascending: false })
        .limit(LIST_LIMIT),
    ),
    canAssign
      ? supabase.rpc("list_editors").returns<EditorOption[]>()
      : Promise.resolve({ data: [] as EditorOption[], error: null }),
  ]);

  if (editorsRes.error) {
    console.error("No se pudo cargar la lista de editores:", editorsRes.error);
    hasError = true;
  }

  return {
    toAssign,
    toEdit,
    toReview,
    editors: Array.isArray(editorsRes.data) ? (editorsRes.data as EditorOption[]) : [],
    hasError,
  };
}