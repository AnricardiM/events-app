"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { deleteEvent } from "@/app/actions/events";
import type { EventListItem, EventStatus } from "@/lib/services/events";
import { EventFormDialog } from "./event-form-dialog";
import { Icon } from "../ui/icon";

type Notice = { message: string; type: "success" | "error" };
type StatusFilter = "all" | EventStatus;

const statusConfig: Record<EventStatus, { label: string; className: string }> = {
  ok: { label: "Cronograma ajustado", className: "bg-success-soft text-success" },
  over: { label: "Excede el evento", className: "bg-danger-soft text-danger" },
  under: {
    label: "Cronograma incompleto",
    className: "bg-surface-muted text-text-subtle ring-1 ring-border",
  },
};

const primaryButton =
  "inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:bg-primary-hover";

const fieldControl =
  "h-[42px] w-full rounded-lg border border-border bg-surface text-[13px] text-text focus-visible:border-primary";

const rowButton =
  "inline-flex min-h-[30px] cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] border border-border bg-surface px-[9px] text-[11px] text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55";
// Botón solo con icono: cuadrado de 44px en móvil.
const iconMobile = "max-md:size-11 max-md:min-h-0 max-md:px-0";
// Botón con icono y texto: en móvil ocupa el espacio libre de la fila.
const labelMobile = "max-md:min-h-11 max-md:flex-1 max-md:px-3 max-md:text-sm";

const cell =
  "min-w-0 align-middle text-xs md:border-t md:border-border md:px-4 md:py-3 md:first:pl-[22px] md:last:pr-[22px]";

export function EventsManagement({
  canDelete,
  events,
  timezone,
}: {
  canDelete: boolean;
  events: EventListItem[];
  timezone: string;
}) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingEvent, setEditingEvent] = useState<EventListItem | "new" | null>(
    null,
  );

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter(
      (event) =>
        (!normalizedQuery || event.name.toLowerCase().includes(normalizedQuery)) &&
        (statusFilter === "all" || event.status === statusFilter),
    );
  }, [events, query, statusFilter]);

  function resetFilters() {
    setQuery("");
    setStatusFilter("all");
  }

  const dateTimeFormatter = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  });
  // Las fechas "solo día" se formatean en UTC para que no se corran un día.
  const dateFormatter = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeZone: "UTC",
  });

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)]">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-7 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              ADMINISTRACIÓN
            </p>
            <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
              Gestión de eventos
            </h1>
          </div>
          <button
            aria-haspopup="dialog"
            className={`${primaryButton} max-sm:w-full`}
            onClick={() => setEditingEvent("new")}
            type="button"
          >
            <span aria-hidden="true" className="text-[19px] leading-none">
              +
            </span>
            Crear evento
          </button>
        </header>

        <section
          aria-label="Filtros de eventos"
          className="mb-5 flex flex-wrap items-end gap-3.5 rounded-xl border border-border bg-surface p-4 max-sm:p-3"
        >
          <label className="relative min-w-[200px] flex-1 max-md:basis-full">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-text-subtle"
            >
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
            <span className="sr-only">Buscar por nombre</span>
            <input
              className={`${fieldControl} pl-[38px] pr-3 placeholder:text-text-subtle`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre"
              type="search"
              value={query}
            />
          </label>

          <label className="grid min-w-[190px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1 max-md:text-xs max-sm:basis-full">
            <span>Cronograma</span>
            <select
              className={`${fieldControl} pl-[11px] pr-[30px]`}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              value={statusFilter}
            >
              <option value="all">Todos</option>
              {(Object.keys(statusConfig) as EventStatus[]).map((status) => (
                <option key={status} value={status}>
                  {statusConfig[status].label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section
          aria-label="Listado de eventos"
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          {notice && <NoticeBanner className="mx-[18px] mt-3.5" notice={notice} />}

          <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border px-[22px] max-sm:min-h-[60px] max-sm:px-4">
            <h2 className="text-[15px] font-semibold text-text max-md:text-base">
              Eventos
            </h2>
            <p className="text-xs text-text-muted max-md:text-sm">
              {filteredEvents.length} de {events.length}{" "}
              {events.length === 1 ? "evento" : "eventos"}
            </p>
          </div>

          {events.length === 0 ? (
            <EmptyState
              text="Crea el primer evento con el botón «Crear evento»."
              title="Aún no hay eventos"
            />
          ) : filteredEvents.length === 0 ? (
            <EmptyState
              text="Prueba cambiando el texto o los filtros seleccionados."
              title="No encontramos coincidencias"
            >
              <button
                className={`${primaryButton} mt-3.5 min-h-[34px] px-3 text-[11px]`}
                onClick={resetFilters}
                type="button"
              >
                Limpiar filtros
              </button>
            </EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left max-md:block">
                <thead className="max-md:sr-only">
                  <tr>
                    {["Evento", "Período", "Cronograma"].map((label) => (
                      <th
                        className="h-11 bg-surface-muted px-4 text-left text-[10px] font-bold uppercase tracking-wider text-text-subtle first:pl-[22px]"
                        key={label}
                        scope="col"
                      >
                        {label}
                      </th>
                    ))}
                    <th className="h-11 bg-surface-muted px-4 pr-[22px]" scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="max-md:block">
                  {filteredEvents.map((event) => (
                    // Móvil, de arriba hacia abajo (orden visual con `order`; el DOM no cambia):
                    //  1. Estado del cronograma (etiqueta)
                    //  2. Nombre y fechas límite
                    //  3. Período
                    //  4. Botones, en una fila al final
                    <tr
                      className="max-md:grid max-md:grid-cols-1 max-md:items-start max-md:gap-y-3 max-md:border-t max-md:border-border max-md:px-4 max-md:py-4"
                      key={event.id}
                    >
                      <td className={`${cell} max-md:order-2`}>
                        <strong className="block text-xs font-semibold text-text max-md:text-base">
                          {event.name}
                        </strong>
                        {(event.registration_deadline || event.editing_deadline) && (
                          <span className="mt-1 block text-[11px] leading-snug text-text-subtle max-md:text-xs">
                            {event.registration_deadline &&
                              `Registro hasta ${dateFormatter.format(new Date(event.registration_deadline))}`}
                            {event.registration_deadline &&
                              event.editing_deadline &&
                              " · "}
                            {event.editing_deadline &&
                              `Edición hasta ${dateFormatter.format(new Date(event.editing_deadline))}`}
                          </span>
                        )}
                      </td>
                      <td
                        className={`${cell} text-[11px] text-text-muted max-md:order-3 max-md:text-sm`}
                      >
                        <span className="text-text-subtle md:hidden">Inicio </span>
                        {dateTimeFormatter.format(new Date(event.starts_at))}
                        <span> </span>
                        <span className="text-text-subtle md:hidden">Fin </span>
                        {dateTimeFormatter.format(new Date(event.ends_at))}
                      </td>
                      <td className={`${cell} max-md:order-1`}>
                        <span
                          className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold max-md:min-h-7 max-md:px-3 max-md:text-xs ${statusConfig[event.status].className}`}
                        >
                          {statusConfig[event.status].label}
                        </span>
                      </td>
                      <td
                        className={`${cell} max-md:order-4 max-md:border-t max-md:border-border max-md:pt-3.5`}
                      >
                        <EventActions
                          canDelete={canDelete}
                          event={event}
                          onEdit={() => setEditingEvent(event)}
                          onNotice={setNotice}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editingEvent && (
        <EventFormDialog
          event={editingEvent === "new" ? null : editingEvent}
          onClose={() => setEditingEvent(null)}
          onSuccess={(message) => {
            setNotice({ message, type: "success" });
            setEditingEvent(null);
          }}
          timezone={timezone}
        />
      )}
    </section>
  );
}

// Móvil: editar (icono) · cronograma (icono + texto, ocupa el espacio libre) · eliminar (icono).
function EventActions({
  canDelete,
  event,
  onEdit,
  onNotice,
}: {
  canDelete: boolean;
  event: EventListItem;
  onEdit: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `¿Eliminar «${event.name}»? Se borrarán también todos sus bloques y secciones.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await deleteEvent(event.id);
      onNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
    });
  }

  return (
    <div
      aria-label="Acciones del evento"
      className="flex items-center gap-2 md:justify-end md:gap-[7px]"
      role="group"
    >
      <button
        aria-label={`Editar datos de ${event.name}`}
        className={`${rowButton} ${iconMobile}`}
        disabled={isPending}
        onClick={onEdit}
        title="Editar"
        type="button"
      >
        <Icon name="edit" />
      </button>
      <Link
        aria-label={`Ver cronograma de ${event.name}`}
        className={`${rowButton} ${labelMobile}`}
        href={`/eventos/${event.id}/cronograma`}
      >
        <span aria-hidden="true" className="md:hidden">
          <Icon name="calendar" />
        </span>
        Cronograma
      </Link>
      {canDelete && (
        <button
          aria-label={`Eliminar ${event.name}`}
          className={`${rowButton} ${iconMobile} border-danger/30 text-danger hover:enabled:border-danger hover:enabled:text-danger`}
          disabled={isPending}
          onClick={handleDelete}
          title="Eliminar"
          type="button"
        >
          {/* Escritorio: texto. Móvil: solo icono. */}
          <span className="max-md:hidden">
            {isPending ? "Eliminando..." : "Eliminar"}
          </span>
          <span className="md:hidden">
            <Icon name="trash" />
          </span>
        </button>
      )}
    </div>
  );
}

function NoticeBanner({
  className = "",
  notice,
}: {
  className?: string;
  notice: Notice;
}) {
  const isError = notice.type === "error";

  return (
    <p
      aria-live="polite"
      className={`rounded-[7px] px-[11px] py-[9px] text-[11px] leading-normal max-md:text-xs ${
        isError ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
      } ${className}`}
      role={isError ? "alert" : "status"}
    >
      {notice.message}
    </p>
  );
}

function EmptyState({
  children,
  icon,
  text,
  title,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="grid min-h-[230px] content-center justify-items-center p-7 text-center">
      {icon && (
        <span
          aria-hidden="true"
          className="mb-3 grid size-[50px] place-items-center rounded-[14px] bg-primary-soft text-primary"
        >
          {icon}
        </span>
      )}
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-text-muted max-md:text-sm">
        {text}
      </p>
      {children}
    </div>
  );
}