"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { rejectContent } from "@/app/actions/contents";

const MAX_COMMENT = 1000;

// Diálogo para rechazar un contenido editado: el comentario es obligatorio y
// el editor lo verá en su lista de tareas. Se reutiliza en Recepción y Tareas.
export function RejectDialog({
  content,
  onClose,
  onSuccess,
}: {
  content: { id: string; code: string; file_name: string };
  onClose: () => void;
  onSuccess: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  function requestClose() {
    if (!isPending) onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (comment.trim().length < 3) {
      setError("Escribe un comentario para el editor.");
      return;
    }

    startTransition(async () => {
      const result = await rejectContent(content.id, comment);
      if (result.success) onSuccess(result.message);
      else setError(result.message);
    });
  }

  return (
    <dialog
      aria-labelledby="reject-form-title"
      className="m-auto max-h-[min(90vh,640px)] w-[min(calc(100%-32px),520px)] overflow-auto overscroll-contain rounded-2xl border border-border bg-surface p-0 text-text shadow-[0_18px_70px_rgb(12_12_35/24%)] backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
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
        <div className="mb-[18px] flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-danger">
              {content.code}
            </p>
            <h2 className="text-[22px] font-bold text-text" id="reject-form-title">
              Rechazar contenido
            </h2>
            <p className="mt-1 truncate text-xs text-text-muted">{content.file_name}</p>
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
          <label className="grid gap-[7px] text-xs font-semibold text-text-muted">
            ¿Qué debe corregir el editor?
            <textarea
              className="min-h-[120px] w-full resize-y rounded-lg border border-border bg-surface px-[11px] py-2.5 text-[13px] font-normal text-text placeholder:text-text-subtle focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted"
              disabled={isPending}
              maxLength={MAX_COMMENT}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Ej.: el audio queda cortado al final."
              required
              value={comment}
            />
            <span className="text-right text-[11px] font-normal text-text-subtle">
              {comment.length}/{MAX_COMMENT}
            </span>
          </label>

          <p className="rounded-lg bg-surface-muted px-3 py-[11px] text-[11px] leading-relaxed text-text-muted" role="note">
            Al rechazar, el contenido deja de figurar como editado y vuelve al
            editor con tu comentario.
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
              className="min-h-10 cursor-pointer rounded-lg bg-danger px-4 text-[13px] font-semibold text-white hover:enabled:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending ? "Rechazando..." : "Rechazar"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}