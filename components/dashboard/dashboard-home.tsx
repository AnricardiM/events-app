"use client";

import { useWorkspaceProfile } from "@/components/layout/workspace-shell";
import type { DashboardData } from "@/lib/services/dashboard";
import {
  ContentListPanel,
  NextEventCard,
  Notice,
  ProgressPanel,
  StatCard,
} from "./dashboard-widgets";

export function DashboardHome({ data }: { data: DashboardData }) {
  const fullName = useWorkspaceProfile();
  const firstName = fullName.trim().split(" ")[0];
  const has = (role: DashboardData["roles"][number]) =>
    data.roles.includes(role);

  const { withoutEditor, toApprove, toEdit, progress, nextEvent } = data;

  // Solo admin y programmer tienen acceso al cronograma del evento. Para el
  // resto, las tarjetas de evento y de bloques son informativas (sin enlace).
  const scheduleHref =
    data.canViewSchedule && nextEvent
      ? `/eventos/${nextEvent.id}/cronograma`
      : null;

  const coverage =
    progress && progress.eventSeconds > 0
      ? Math.round((progress.contentSeconds / progress.eventSeconds) * 100)
      : 0;

  const showCoverage = data.canViewSchedule && progress;
  const showBlocks = has("enter") && progress;

  return (
    <div className="mx-auto grid w-full max-w-[1060px] gap-6">
      <div>
        <h1 className="text-[clamp(24px,3vw,32px)] font-bold tracking-tight text-text">
          {firstName ? `Hola, ${firstName}` : "Bienvenido"}
        </h1>
        <p className="mt-2 text-sm text-text-muted">
          Esto es lo que necesita tu atención hoy.
        </p>
      </div>

      {data.hasError && (
        <div className="rounded-xl border border-danger bg-danger-soft px-4 py-3 text-sm text-danger">
          Algunos datos no se pudieron cargar. Intenta recargar la página.
        </div>
      )}

      <NextEventCard
        event={nextEvent}
        href={scheduleHref}
        timezone={data.timezone}
      />

      {data.roles.length === 0 && (
        <Notice>
          Todavía no tienes un rol asignado. Pide a un administrador que te
          asigne uno para ver tu panel.
        </Notice>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {withoutEditor && (
          <StatCard
            detail="Necesitan edición y esperan un editor"
            href="/tareas#sin-editor"
            label="Sin editor"
            tone="primary"
            value={String(withoutEditor.total)}
          />
        )}
        {toApprove && (
          <StatCard
            detail="Editados, pendientes de aprobar o rechazar"
            href="/tareas#por-aprobar"
            label="Por aprobar"
            tone="gold"
            value={String(toApprove.total)}
          />
        )}
        {toEdit && (
          <StatCard
            detail="Asignados a ti, sin marcar como editados"
            href="/tareas#por-editar"
            label="Por editar"
            tone="gold"
            value={String(toEdit.total)}
          />
        )}
        {showCoverage && (
          <StatCard
            detail="Contenido sobre la duración del evento"
            href={scheduleHref}
            label="Cronograma del evento"
            tone="primary"
            value={`${coverage}%`}
          />
        )}
        {showBlocks && (
          <StatCard
            detail="Bloques con su duración cubierta"
            href={scheduleHref}
            label="Bloques completos"
            tone="success"
            value={`${progress.completeBlocks}/${progress.blocks.length}`}
          />
        )}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-2">
        {withoutEditor && (
          <ContentListPanel
            emptyText="No hay contenido esperando editor."
            href="/tareas#sin-editor"
            title="Últimos sin editor"
            widget={withoutEditor}
          />
        )}
        {toApprove && (
          <ContentListPanel
            emptyText="No hay contenido esperando aprobación."
            href="/tareas#por-aprobar"
            title="Editados por aprobar"
            widget={toApprove}
          />
        )}
        {toEdit && (
          <ContentListPanel
            emptyText="No tienes contenido por editar."
            href="/tareas#por-editar"
            title="Mis últimos por editar"
            widget={toEdit}
          />
        )}
        {progress && (showCoverage || showBlocks) && (
          <ProgressPanel
            href={scheduleHref}
            progress={progress}
            showEvent={data.canViewSchedule}
          />
        )}
      </div>
    </div>
  );
}