import { connection } from "next/server";
import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getEventSchedule } from "@/lib/services/events";
import { getSettings } from "@/lib/services/app_settings";
import { ScheduleManagement } from "@/components/events/schedule-management";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CronogramaPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  if (!UUID_RE.test(eventId)) notFound();
  await connection();
  const supabase = await createClient(await cookies());
  const [
    { data: isActive, error: activeError },
    { data: canManage, error: manageError },
  ] = await Promise.all([
    supabase.rpc("is_active_user"),
    supabase.rpc("can_manage_events"),
  ]);

  if (activeError || manageError) {
    console.error("No se pudieron verificar los permisos:", { activeError, manageError });
    return (
      <section className="users-inline-message" role="alert">
        No se pudieron verificar tus permisos. Intenta nuevamente más tarde.
      </section>
    );
  }
  if (!isActive) redirect("/dashboard");

  const [schedule, { data: settings, error: settingsError }] =
    await Promise.all([getEventSchedule(supabase, eventId), getSettings(supabase)]);

  if (schedule.error || settingsError || !settings) {
    console.error("No se pudo cargar el cronograma:", {
      scheduleError: schedule.error,
      settingsError,
    });
    return (
      <section className="users-inline-message" role="alert">
        No se pudo cargar el cronograma. Inténtalo de nuevo más tarde.
      </section>
    );
  }
  if (!schedule.event) notFound();

  return (
 <ScheduleManagement
  blocks={schedule.blocks}
  canEdit={Boolean(canManage)}
  contents={schedule.contents}
  event={schedule.event}
  progress={schedule.progress}
  summary={schedule.summary}
  timezone={settings.display_timezone}
  toleranceSeconds={settings.duration_tolerance_seconds}
  />
  );
}