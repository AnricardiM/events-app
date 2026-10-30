"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { saveBlock } from "@/app/actions/schedule";
import type { BlockSummary, ScheduleEvent } from "@/lib/services/events";
import { toLocalInputValue } from "@/lib/utils/dates";

const labelClass = "grid gap-[7px] text-xs font-semibold text-text-muted";
const inputClass =
  "min-h-[42px] w-full rounded-lg border border-border bg-surface px-[11px] text-[13px] font-normal text-text placeholder:text-text-subtle focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle";
const noteClass =
  "rounded-lg bg-surface-muted px-3 py-[11px] text-[11px] leading-relaxed text-text-muted";

export function BlockFormDialog({
  block,
  blocks,
  event,
  onClose,
  onSuccess,
  timezone,
}: {
  block: BlockSummary | null;
  blocks: BlockSummary[];
  event: ScheduleEvent;
  onClose: () => void;
  onSuccess: (message: string) => void;
  timezone: string;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function requestClose() {
    if (!isPending) onClose();
  }

  const eventStart = toLocalInputValue(event.starts_at, timezone);
  const eventEnd = toLocalInputValue(event.ends_at, timezone);

  // Sugerencia de inicio: el fin del último bloque, o el inicio del evento.
  const lastEnd = blocks.length > 0 ? blocks[blocks.length - 1].ends_at : null;
  const suggestedStart = block
    ? toLocalInputValue(block.starts_at, timezone)
    : lastEnd
      ? toLocalInputValue(lastEnd, timezone)
      : eventStart;
  const defaultDuration = block ? Math.round(block.block_seconds / 60) : 60;

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError(null);
    const formData = new FormData(submitEvent.currentTarget);

    startTransition(async () => {
      const result = await saveBlock(event.id, block?.block_id ?? null, formData);
      if (result.success) onSuccess(result.message);
      else setError(result.message);
    });
  }

  return (
    <dialog
      aria-labelledby="block-form-title"
      className="m-auto max-h-[min(90vh,780px)] w-[min(calc(100%-32px),520px)] overflow-auto overscroll-contain rounded-2xl border border-border bg-surface p-0 text-text shadow-[0_18px_70px_rgb(12_12_35/24%)] backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
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
              {block ? "DATOS DEL BLOQUE" : "NUEVO BLOQUE"}
            </p>
            <h2 className="text-[22px] font-bold text-text" id="block-form-title">
              {block ? "Editar bloque" : "Agregar bloque"}
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
            Nombre del bloque
            <input
              className={inputClass}
              defaultValue={block?.block_name ?? ""}
              disabled={isPending}
              maxLength={150}
              name="name"
              placeholder="Ej.: Apertura"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Inicio
              <input
                className={inputClass}
                defaultValue={suggestedStart}
                disabled={isPending}
                max={eventEnd}
                min={eventStart}
                name="starts_at"
                required
                type="datetime-local"
              />
            </label>
            <label className={labelClass}>
              Duración (minutos)
              <input
                className={inputClass}
                defaultValue={defaultDuration}
                disabled={isPending}
                max={1440}
                min={1}
                name="duration_minutes"
                required
                step={1}
                type="number"
              />
            </label>
          </div>

          <p className={noteClass} role="note">
            El bloque debe quedar dentro del evento y no solaparse con otros
            bloques. Las horas se interpretan en la zona horaria {timezone}.
          </p>

          {error && (
            <p
              aria-live="polite"
              className="rounded-[7px] bg-danger-soft px-[11px] py-[9px] text-[11px] leading-normal text-danger"
              role="alert"
            >
              {error}
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
              {isPending ? "Guardando..." : block ? "Guardar cambios" : "Agregar bloque"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}