import type { SupabaseClient } from "@supabase/supabase-js";

export type EventStatus = "ok" | "over" | "under";

export type EventRow = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
  registration_deadline: string | null; // "YYYY-MM-DD"
  editing_deadline: string | null;
  purge_at: string;
  schedule_modified_at: string | null;
};

export type EventListItem = EventRow & { status: EventStatus };

export async function getEvents(supabase: SupabaseClient) {
  const [eventsRes, summaryRes] = await Promise.all([
    supabase
      .from("events")
      .select(
        "id, name, starts_at, ends_at, registration_deadline, editing_deadline, purge_at, schedule_modified_at",
      )
      .order("starts_at", { ascending: false }),
    supabase.from("event_summary").select("event_id, status"),
  ]);

  const error = eventsRes.error ?? summaryRes.error;
  if (error) return { data: null, error };

  const statusById = new Map<string, EventStatus>(
    (summaryRes.data ?? []).map((row) => [row.event_id, row.status]),
  );

  const data: EventListItem[] = (eventsRes.data as EventRow[]).map((event) => ({
    ...event,
    status: statusById.get(event.id) ?? "under",
  }));

  return { data, error: null };
}

export type BlockSummary = {
  block_id: string;
  block_name: string;
  starts_at: string;
  ends_at: string;
  block_seconds: number;
  sections_seconds: number;
  delta_seconds: number;
  status: EventStatus;
};

export type ScheduleEvent = {
  id: string;
  name: string;
  starts_at: string;
  ends_at: string;
};

export type ScheduleSummary = {
  event_seconds: number;
  blocks_seconds: number;
  delta_seconds: number;
  status: EventStatus;
};

export type BlockProgress = {
  block_id: string;
  contents_count: number;
  contents_seconds: number;
  assigned_count: number;
  accepted_count: number;
};

export type BlockContent = {
  id: string;
  code: string;
  file_name: string;
  content_category: "ofrenda" | "introduccion" | "directores" | "especial";
  duration_seconds: number;
  accepted: boolean;
  assigned_editor: string | null;
  block_id: string;
  edited: boolean;
};

export async function getEventSchedule(
  supabase: SupabaseClient,
  eventId: string,
) {
  const [eventRes, blocksRes, summaryRes, progressRes, contentsRes] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, name, starts_at, ends_at")
        .eq("id", eventId)
        .maybeSingle<ScheduleEvent>(),
      supabase
        .from("event_block_summary")
        .select(
          "block_id, block_name, starts_at, ends_at, block_seconds, sections_seconds, delta_seconds, status",
        )
        .eq("event_id", eventId)
        .order("starts_at", { ascending: true })
        .returns<BlockSummary[]>(),
      supabase
        .from("event_summary")
        .select("event_seconds, blocks_seconds, delta_seconds, status")
        .eq("event_id", eventId)
        .maybeSingle<ScheduleSummary>(),
      supabase
        .from("event_block_content_summary")
        .select(
          "block_id, contents_count, contents_seconds, assigned_count, accepted_count",
        )
        .eq("event_id", eventId)
        .returns<BlockProgress[]>(),
       supabase
        .from("event_contents")
        .select(
          "id, code, file_name, content_category, duration_seconds, accepted, edited, assigned_editor, block_id",
        )
        .eq("event_id", eventId)
        .order("code", { ascending: true })
        .returns<BlockContent[]>(),
    ]);

  const error =
    eventRes.error ??
    blocksRes.error ??
    summaryRes.error ??
    progressRes.error ??
    contentsRes.error;

  return {
    event: eventRes.data,
    blocks: blocksRes.data ?? [],
    summary: summaryRes.data,
    progress: progressRes.data ?? [],
    contents: contentsRes.data ?? [],
    error,
  };
}