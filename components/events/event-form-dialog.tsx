"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { saveEvent } from "@/app/actions/events";
import type { EventListItem } from "@/lib/services/events";
import { toLocalInputValue } from "@/lib/utils/dates";

type Notice = { message: string; type: "success" | "error" };

const labelClass = "grid gap-[7px] text-xs font-semibold text-text-muted";
const inputClass =
  "min-h-[42px] w-full rounded-lg border border-border bg-surface px-[11px] text-[13px] font-normal text-text placeholder:text-text-subtle focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle";
const noteClass =
  "rounded-lg bg-surface-muted px-3 py-[11px] text-[11px] leading-relaxed text-text-muted";

export function EventFormDialog({
  event,
  onClose,
  onSuccess,
  timezone,
}: {
  event: EventListItem | null;
  onClose: () => void;
  onSuccess: (message: string) => void;
  timezone: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function requestClose() {
    if (!isPending) onClose();
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setNotice(null);

    const formData = new FormData(submitEvent.currentTarget);
    const startsAt = String(formData.get("starts_at") ?? "");
    const endsAt = String(formData.get("ends_at") ?? "");

    // Misma validación que el servidor, para dar el error sin viaje de red.
    if (endsAt <= startsAt) {
      setNotice({
        message: "La fecha de fin debe ser posterior a la de inicio.",
        type: "error",
      });
      return;
    }

    startTransition(async () => {
      const result = await saveEvent(event?.id ?? null, formData);
      if (result.success) {
        onSuccess(result.message);
      } else {
        setNotice({ message: result.message, type: "error" });
      }
    });
  }

  return (
    <dialog
      aria-labelledby="event-form-title"
      className="m-auto max-h-[min(90vh,780px)] w-[min(calc(100%-32px),560px)] overflow-auto overscroll-contain rounded-2xl border border-border bg-surface p-0 text-text shadow-[0_18px_70px_rgb(12_12_35/24%)] backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
      onCancel={(cancelEvent) => {
        cancelEvent.preventDefault();
        requestClose();
      }}
      onClick={(clickEvent) => {
        if (clickEvent.target === dialogRef.current) requestClose();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="p-[26px] max-sm:p-5">
        <div className="mb-[22px] flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              {event ? "DATOS DEL EVENTO" : "NUEVO EVENTO"}
            </p>
            <h2 className="text-[22px] font-bold text-text" id="event-form-title">
              {event ? "Editar evento" : "Crear evento"}
            </h2>
          </div>
          <button
            aria-label="Cerrar formulario"
            className="grid size-[34px] flex-none cursor-pointer place-items-center rounded-lg bg-primary-soft text-[23px] leading-none text-text-muted hover:text-primary"
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="grid gap-[17px]" onSubmit={handleSubmit}>
          <label className={labelClass}>
            Nombre del evento
            <input
              className={inputClass}
              defaultValue={event?.name ?? ""}
              disabled={isPending}
              maxLength={150}
              name="name"
              placeholder="Ej.: Congreso anual 2026"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Inicio
              <input
                className={inputClass}
                defaultValue={event ? toLocalInputValue(event.starts_at, timezone) : ""}
                disabled={isPending}
                name="starts_at"
                required
                type="datetime-local"
              />
            </label>
            <label className={labelClass}>
              Fin
              <input
                className={inputClass}
                defaultValue={event ? toLocalInputValue(event.ends_at, timezone) : ""}
                disabled={isPending}
                name="ends_at"
                required
                type="datetime-local"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Fecha límite de registro
              <input
                className={inputClass}
                defaultValue={event?.registration_deadline ?? ""}
                disabled={isPending}
                name="registration_deadline"
                type="date"
              />
            </label>
            <label className={labelClass}>
              Fecha límite de edición
              <input
                className={inputClass}
                defaultValue={event?.editing_deadline ?? ""}
                disabled={isPending}
                name="editing_deadline"
                type="date"
              />
            </label>
          </div>

          <p className={noteClass} role="note">
            Las horas se interpretan en la zona horaria configurada en el
            sistema ({timezone}). Las fechas límite son opcionales.
          </p>

          {notice && (
            <p
              aria-live="polite"
              className="rounded-[7px] bg-danger-soft px-[11px] py-[9px] text-[11px] leading-normal text-danger"
              role="alert"
            >
              {notice.message}
            </p>
          )}

          <div className="flex justify-end gap-[9px]">
            <button
              className="min-h-10 cursor-pointer rounded-lg border border-border bg-surface px-[15px] text-xs font-semibold text-text-muted hover:border-border-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={requestClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-10 cursor-pointer rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Guardando..." : event ? "Guardar cambios" : "Crear evento"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}