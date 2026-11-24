import type { SupabaseClient } from "@supabase/supabase-js";
import type { AppRole } from "@/lib/models/roles";
import { getFillState } from "@/lib/utils/schedule";
import type { FillState } from "@/lib/utils/schedule";
import { getEventSchedule } from "./events";
import type { EventStatus } from "./events";

const CONTENT_COLUMNS =
  "id, code, file_name, media_type, content_category, duration_seconds, events(id, name), event_blocks(id, name)";
const LIST_SIZE = 5;

export type DashboardContent = {
  id: string;
  code: string;
  file_name: string;
  media_type: string;
  content_category: "ofrenda" | "introduccion" | "directores" | "especial";
  duration_seconds: number;
  events: { id: string; name: string } | null;
  event_blocks: { id: string; name: string } | null;
};

export type ContentWidget = { total: number; items: DashboardContent[] };

export type NextEventInfo = {
  id: string;
  name: string;
  is_online: boolean;
  starts_at: string;
  ends_at: string;
  phase: "ongoing" | "upcoming";
  daysUntil: number;
};

export type BlockProgressItem = {
  id: string;
  name: string;
  blockSeconds: number;
  usedSeconds: number;
  count: number;
  state: FillState;
  percent: number;
};

export type EventProgress = {
  eventId: string;
  eventName: string;
  eventSeconds: number;
  blocksSeconds: number;
  contentSeconds: number;
  scheduleStatus: EventStatus | null;
  blocks: BlockProgressItem[];
  completeBlocks: number;
};

export type DashboardData = {
  roles: AppRole[];
  timezone: string;
  /** admin y programmer: pueden abrir el cronograma del evento. */
  canViewSchedule: boolean;
  nextEvent: NextEventInfo | null;
  progress: EventProgress | null;
  /** admin y programmer: necesitan edición y no tienen editor. */
  withoutEditor: ContentWidget | null;
  /** admin y review: editados, pendientes de aprobar o rechazar. */
  toApprove: ContentWidget | null;
  /** edit: asignados al usuario y sin marcar como editados. */
  toEdit: ContentWidget | null;
  hasError: boolean;
};

type RawContent = Omit<DashboardContent, "events" | "event_blocks"> & {
  events: DashboardContent["events"] | DashboardContent["events"][];
  event_blocks:
    | DashboardContent["event_blocks"]
    | DashboardContent["event_blocks"][];
};

// Supabase puede tipar las relaciones como arreglo; las normalizamos a objeto.
function one<T>(value: T | T[] | null): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function normalize(rows: RawContent[] | null): DashboardContent[] {
  return (rows ?? []).map((row) => ({
    ...row,
    events: one(row.events),
    event_blocks: one(row.event_blocks),
  }));
}

export async function getDashboardData(
  supabase: SupabaseClient,
  options: {
    userId: string;
    roles: AppRole[];
    timezone: string;
    toleranceSeconds: number;
  },
): Promise<DashboardData> {
  const { userId, roles, timezone, toleranceSeconds } = options;
  const has = (role: AppRole) => roles.includes(role);
  const canViewSchedule = has("admin") || has("programmer");
  let hasError = false;

  // Evento más cercano: el que está en curso o el próximo que empiece.
  const nowIso = new Date().toISOString();
  const nextEventQuery = supabase
    .from("events")
    .select("id, name, is_online, starts_at, ends_at")
    .gte("ends_at", nowIso)
    .order("starts_at", { ascending: true })
    .limit(1)
    .maybeSingle<{
      id: string;
      name: string;
      is_online: boolean;
      starts_at: string;
      ends_at: string;
    }>();

  const widget = async (
    enabled: boolean,
    build: () => PromiseLike<{
      data: unknown;
      count: number | null;
      error: unknown;
    }>,
  ): Promise<ContentWidget | null> => {
    if (!enabled) return null;
    const { data, count, error } = await build();
    if (error) {
      console.error("No se pudo cargar un panel del dashboard:", error);
      hasError = true;
      return { total: 0, items: [] };
    }
    const items = normalize(data as RawContent[] | null);
    return { total: count ?? items.length, items };
  };

  const [nextEventResult, withoutEditor, toApprove, toEdit] = await Promise.all([
    nextEventQuery,
    widget(has("admin") || has("programmer"), () =>
      supabase
        .from("event_contents")
        .select(CONTENT_COLUMNS, { count: "exact" })
        .eq("needs_editing", true)
        .is("assigned_editor", null)
        .order("created_at", { ascending: false })
        .limit(LIST_SIZE),
    ),
    widget(has("admin") || has("review"), () =>
      supabase
        .from("event_contents")
        .select(CONTENT_COLUMNS, { count: "exact" })
        .eq("needs_editing", true)
        .eq("edited", true)
        .eq("accepted", false)
        .order("updated_at", { ascending: false })
        .limit(LIST_SIZE),
    ),
    widget(has("edit"), () =>
      supabase
        .from("event_contents")
        .select(CONTENT_COLUMNS, { count: "exact" })
        .eq("needs_editing", true)
        .eq("assigned_editor", userId)
        .eq("edited", false)
        .order("updated_at", { ascending: false })
        .limit(LIST_SIZE),
    ),
  ]);

  if (nextEventResult.error) {
    console.error("No se pudo cargar el evento más cercano:", nextEventResult.error);
    hasError = true;
  }

  let nextEvent: NextEventInfo | null = null;
  const raw = nextEventResult.data;
  if (raw) {
    const start = new Date(raw.starts_at).getTime();
    const ongoing = start <= Date.now();
    nextEvent = {
      ...raw,
      phase: ongoing ? "ongoing" : "upcoming",
      daysUntil: ongoing ? 0 : Math.ceil((start - Date.now()) / 86_400_000),
    };
  }

  // Progreso de bloques y evento: admin, programmer y enter.
  let progress: EventProgress | null = null;
  if (nextEvent && (canViewSchedule || has("enter"))) {
    const schedule = await getEventSchedule(supabase, nextEvent.id);
    if (schedule.error || !schedule.event) {
      console.error("No se pudo cargar el cronograma:", schedule.error);
      hasError = true;
    } else {
      const byBlock = new Map(schedule.progress.map((p) => [p.block_id, p]));
      const blocks = schedule.blocks.map((block) => {
        const p = byBlock.get(block.block_id);
        const used = Number(p?.contents_seconds ?? 0);
        const count = p?.contents_count ?? 0;
        return {
          id: block.block_id,
          name: block.block_name,
          blockSeconds: block.block_seconds,
          usedSeconds: used,
          count,
          state: getFillState(used, block.block_seconds, toleranceSeconds, count),
          percent:
            block.block_seconds > 0
              ? Math.round((used / block.block_seconds) * 100)
              : 0,
        };
      });
      progress = {
        eventId: schedule.event.id,
        eventName: schedule.event.name,
        eventSeconds: schedule.summary?.event_seconds ?? 0,
        blocksSeconds: schedule.summary?.blocks_seconds ?? 0,
        contentSeconds: blocks.reduce((sum, b) => sum + b.usedSeconds, 0),
        scheduleStatus: schedule.summary?.status ?? null,
        blocks,
        completeBlocks: blocks.filter((b) => b.state === "complete").length,
      };
    }
  }

  return {
    roles,
    timezone,
    canViewSchedule,
    nextEvent,
    progress,
    withoutEditor,
    toApprove,
    toEdit,
    hasError,
  };
}