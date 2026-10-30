"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { saveContent } from "@/app/actions/contents";
import {
  categoryLabels,
  contentCategories,
  contentMedia,
  contentSources,
  mediaLabels,
  sourceLabels,
} from "@/lib/models/content";
import type { BlockOption, ContentRow, EventOption } from "@/lib/services/contents";

const labelClass = "grid gap-[7px] text-xs font-semibold text-text-muted";
const inputClass =
  "min-h-[42px] w-full rounded-lg border border-border bg-surface px-[11px] text-[13px] font-normal text-text placeholder:text-text-subtle focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle";
const noteClass =
  "rounded-lg bg-surface-muted px-3 py-[11px] text-[11px] leading-relaxed text-text-muted";

export function ContentFormDialog({
  blocks,
  content,
  events,
  onClose,
  onSuccess,
}: {
  blocks: BlockOption[];
  content: ContentRow | null;
  events: EventOption[];
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [eventId, setEventId] = useState(content?.event_id ?? "");
  const [blockId, setBlockId] = useState(content?.block_id ?? "");

  const eventBlocks = useMemo(
    () => blocks.filter((block) => block.event_id === eventId),
    [blocks, eventId],
  );

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function requestClose() {
    if (!isPending) onClose();
  }

  function handleEventChange(value: string) {
    setEventId(value);
    setBlockId(""); // el bloque anterior pertenece a otro evento
  }

  function handleSubmit(submitEvent: FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setError(null);
    const formData = new FormData(submitEvent.currentTarget);

    startTransition(async () => {
      const result = await saveContent(content?.id ?? null, formData);
      if (result.success) onSuccess(result.message);
      else setError(result.message);
    });
  }

  const minutes = content ? Math.floor(content.duration_seconds / 60) : 0;
  const seconds = content ? content.duration_seconds % 60 : 0;

  return (
    <dialog
      aria-labelledby="content-form-title"
      className="m-auto max-h-[min(90vh,820px)] w-[min(calc(100%-32px),600px)] overflow-auto overscroll-contain rounded-2xl border border-border bg-surface p-0 text-text shadow-[0_18px_70px_rgb(12_12_35/24%)] backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
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
              {content ? content.code : "NUEVO CONTENIDO"}
            </p>
            <h2 className="text-[22px] font-bold text-text" id="content-form-title">
              {content ? "Editar contenido" : "Registrar contenido"}
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
          <div className="grid grid-cols-2 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Evento
              <select
                className={inputClass}
                disabled={isPending}
                name="event_id"
                onChange={(event) => handleEventChange(event.target.value)}
                required
                value={eventId}
              >
                <option disabled value="">Selecciona un evento...</option>
                {events.map((event) => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Bloque
              <select
                className={inputClass}
                disabled={isPending || !eventId}
                name="block_id"
                onChange={(event) => setBlockId(event.target.value)}
                required
                value={blockId}
              >
                <option disabled value="">
                  {!eventId
                    ? "Primero elige un evento"
                    : eventBlocks.length === 0
                      ? "Este evento no tiene bloques"
                      : "Selecciona un bloque..."}
                </option>
                {eventBlocks.map((block) => (
                  <option key={block.id} value={block.id}>{block.name}</option>
                ))}
              </select>
            </label>
          </div>

          <label className={labelClass}>
            Nombre del archivo
            <input
              className={inputClass}
              defaultValue={content?.file_name ?? ""}
              disabled={isPending}
              maxLength={200}
              name="file_name"
              required
            />
          </label>

          <div className="grid grid-cols-2 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Tipo de contenido
              <select
                className={inputClass}
                defaultValue={content?.content_category ?? ""}
                disabled={isPending}
                name="content_category"
                required
              >
                <option disabled value="">Selecciona...</option>
                {contentCategories.map((value) => (
                  <option key={value} value={value}>{categoryLabels[value]}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Persona que entrega el archivo
              <input
                className={inputClass}
                defaultValue={content?.delivered_by ?? ""}
                disabled={isPending}
                maxLength={120}
                name="delivered_by"
                required
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Tipo de archivo
              <select
                className={inputClass}
                defaultValue={content?.media_type ?? ""}
                disabled={isPending}
                name="media_type"
                required
              >
                <option disabled value="">Selecciona...</option>
                {contentMedia.map((value) => (
                  <option key={value} value={value}>{mediaLabels[value]}</option>
                ))}
              </select>
            </label>
            <label className={labelClass}>
              Dónde está
              <select
                className={inputClass}
                defaultValue={content?.source ?? ""}
                disabled={isPending}
                name="source"
                required
              >
                <option disabled value="">Selecciona...</option>
                {contentSources.map((value) => (
                  <option key={value} value={value}>{sourceLabels[value]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-3 gap-[17px] max-sm:grid-cols-1">
            <label className={labelClass}>
              Duración (minutos)
              <input
                className={inputClass}
                defaultValue={minutes}
                disabled={isPending}
                min={0}
                name="duration_minutes"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={labelClass}>
              Segundos
              <input
                className={inputClass}
                defaultValue={seconds}
                disabled={isPending}
                max={59}
                min={0}
                name="duration_seconds"
                required
                step={1}
                type="number"
              />
            </label>
            <label className={labelClass}>
              Cantidad de archivos
              <input
                className={inputClass}
                defaultValue={content?.files_count ?? 1}
                disabled={isPending}
                max={999}
                min={1}
                name="files_count"
                required
                step={1}
                type="number"
              />
            </label>
          </div>

          <p className={noteClass} role="note">
            {content
              ? "El código se mantiene mientras no cambies el bloque; si lo cambias, se genera uno nuevo con el prefijo del nuevo bloque."
              : "El código se asigna automáticamente al guardar (iniciales del bloque y número correlativo)."}{" "}
            El editor, la marca de editado y la aceptación se gestionan desde el listado.
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
              {isPending ? "Guardando..." : content ? "Guardar cambios" : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}