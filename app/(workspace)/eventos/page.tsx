import { connection } from "next/server";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { getEvents } from "@/lib/services/events";
import { getSettings } from "@/lib/services/app_settings";
import { EventsManagement } from "@/components/events/events-management";

export default async function EventosPage() {
   await connection();
  const supabase = await createClient(await cookies());
  const [
    { data: canManage, error: manageError },
    { data: isAdmin, error: adminError },
  ] = await Promise.all([
    supabase.rpc("can_manage_events"),
    supabase.rpc("is_event_admin"),
  ]);

  if (manageError || adminError) {
    console.error("No se pudieron verificar los permisos de eventos:", {
      manageError,
      adminError,
    });
    return (
      <section className="users-inline-message" role="alert">
        No se pudieron verificar tus permisos. Intenta nuevamente más tarde.
      </section>
    );
  }

  if (!canManage) redirect("/dashboard");

  const [
    { data: events, error: eventsError },
    { data: settings, error: settingsError },
  ] = await Promise.all([getEvents(supabase), getSettings(supabase)]);

  if (eventsError || settingsError || !events || !settings) {
    console.error("No se pudo cargar eventos:", { eventsError, settingsError });
    return (
      <section className="users-inline-message" role="alert">
        No se pudo cargar la lista de eventos. Revisa los permisos de lectura
        en Supabase e inténtalo de nuevo.
      </section>
    );
  }

  return (
    <EventsManagement
      canDelete={Boolean(isAdmin)}
      events={events}
      timezone={settings.display_timezone}
    />
  );
}