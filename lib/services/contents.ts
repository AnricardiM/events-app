import type { SupabaseClient } from "@supabase/supabase-js";
import type { ContentCategory, ContentMedia, ContentSource } from "@/lib/models/content";

export type ContentRow = {
  id: string;
  code: string;
  file_name: string;
  content_category: ContentCategory;
  delivered_by: string;
  media_type: ContentMedia;
  source: ContentSource;
  event_id: string;
  block_id: string;
  assigned_editor: string | null;
  edited: boolean;
  duration_seconds: number;
  accepted: boolean;
  accepted_at: string | null;
  files_count: number;
  created_at: string;
  events: { id: string; name: string } | null;
  event_blocks: { id: string; name: string } | null;
};

export type EventOption = { id: string; name: string; starts_at: string };
export type BlockOption = { id: string; event_id: string; name: string; starts_at: string };
export type EditorOption = { id: string; full_name: string | null; is_active: boolean };

export async function getContentData(supabase: SupabaseClient) {
  const [contentsRes, eventsRes, blocksRes, editorsRes] = await Promise.all([
   supabase
  .from("event_contents")
  .select(
    "id, code, file_name, content_category, delivered_by, media_type, source, event_id, block_id, assigned_editor, edited, duration_seconds, accepted, accepted_at, files_count, created_at, events(id, name), event_blocks(id, name)",
  )
  .order("created_at", { ascending: false })
  .returns<ContentRow[]>(),
    supabase
      .from("events")
      .select("id, name, starts_at")
      .order("starts_at", { ascending: false })
      .returns<EventOption[]>(),
    supabase
      .from("event_blocks")
      .select("id, event_id, name, starts_at")
      .order("starts_at", { ascending: true })
      .returns<BlockOption[]>(),
    supabase.rpc("list_editors").returns<EditorOption[]>(),
  ]);

  const error =
    contentsRes.error ?? eventsRes.error ?? blocksRes.error ?? editorsRes.error;

  return {
    contents: contentsRes.data ?? [],
    events: eventsRes.data ?? [],
    blocks: blocksRes.data ?? [],
    editors: editorsRes.data ?? [],
    error,
  };
}