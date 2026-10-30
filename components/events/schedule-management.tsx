"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { deleteBlock } from "@/app/actions/schedule";
import { categoryLabels, formatClock } from "@/lib/models/content";
import type {
  BlockContent,
  BlockProgress,
  BlockSummary,
  ScheduleEvent,
  ScheduleSummary,
} from "@/lib/services/events";
import { BlockFormDialog } from "./block-form-dialog";
import { Icon } from "../ui/icon";

type Notice = { message: string; type: "success" | "error" };

const primaryButton =
  "inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:bg-primary-hover";

const rowButton =
  "min-h-[30px] cursor-pointer whitespace-nowrap rounded-[7px] border border-border bg-surface px-[9px] text-[11px] text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55";

const cell =
  "align-middle text-xs md:border-t md:border-border md:px-4 md:py-3 md:first:pl-[22px] md:last:pr-[22px]";

export function formatDuration(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  const minutes = Math.round(Math.abs(totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${sign}${m} min`;
  return m === 0 ? `${sign}${h} h` : `${sign}${h} h ${m} min`;
}

export function ScheduleManagement({
  blocks,
  canEdit,
  contents,
  event,
  progress,
  summary,
  timezone,
  toleranceSeconds,
}: {
  blocks: BlockSummary[];
  canEdit: boolean;
  contents: BlockContent[];
  event: ScheduleEvent;
  progress: BlockProgress[];
  summary: ScheduleSummary | null;
  timezone: string;
  toleranceSeconds: number;
}) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [editingBlock, setEditingBlock] = useState<BlockSummary | "new" | null>(null);

  const dateTime = new Intl.DateTimeFormat("es", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: timezone,
  });
  const timeOnly = new Intl.DateTimeFormat("es", {
    timeStyle: "short",
    timeZone: timezone,
  });

  const progressByBlock = new Map(progress.map((item) => [item.block_id, item]));
  const contentsByBlock = new Map<string, BlockContent[]>();
  for (const item of contents) {
    const list = contentsByBlock.get(item.block_id) ?? [];
    list.push(item);
    contentsByBlock.set(item.block_id, list);
  }
  const totalContentSeconds = progress.reduce(
    (sum, item) => sum + Number(item.contents_seconds),
    0,
  );
  const totalBlockSeconds = blocks.reduce((sum, item) => sum + item.block_seconds, 0);

  const completeBlocks = blocks.filter((block) => {
    const item = progressByBlock.get(block.block_id);
    return (
      getFillState(
        Number(item?.contents_seconds ?? 0),
        block.block_seconds,
        toleranceSeconds,
        item?.contents_count ?? 0,
      ) === "complete"
    );
  }).length;

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)]">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-7 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <Link className="mb-3 inline-block text-[11px] text-text-muted hover:text-primary" href="/eventos">
              ← Volver a eventos
            </Link>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              CRONOGRAMA
            </p>
            <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
              {event.name}
            </h1>
            <p className="mt-2 text-xs text-text-muted">
              {dateTime.format(new Date(event.starts_at))} —{" "}
              {dateTime.format(new Date(event.ends_at))}
            </p>
          </div>
          {canEdit && (
            <button
              aria-haspopup="dialog"
              className={`${primaryButton} max-sm:w-full`}
              onClick={() => setEditingBlock("new")}
              type="button"
            >
              <span aria-hidden="true" className="text-[19px] leading-none">+</span>
              Agregar bloque
            </button>
          )}
        </header>

        <section
          aria-label="Listado de bloques"
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          {notice && (
            <p
              aria-live="polite"
              className={`mx-[18px] mt-3.5 rounded-[7px] px-[11px] py-[9px] text-[11px] leading-normal ${
                notice.type === "error"
                  ? "bg-danger-soft text-danger"
                  : "bg-success-soft text-success"
              }`}
              role={notice.type === "error" ? "alert" : "status"}
            >
              {notice.message}
            </p>
          )}

          <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border px-[22px] max-sm:flex-col max-sm:items-start max-sm:py-3 max-sm:px-4">
            <h2 className="text-[15px] font-semibold text-text">Bloques</h2>
            <div className="grid gap-0.5 text-right text-xs text-text-muted max-sm:text-left">
              <p>
                {completeBlocks} de {blocks.length}{" "}
                {blocks.length === 1 ? "bloque completo" : "bloques completos"} ·{" "}
                {formatClock(totalContentSeconds)} de {formatClock(totalBlockSeconds)}
              </p>
              {summary && (
                <p className="text-[11px] text-text-subtle">
                  Bloques: {formatDuration(summary.blocks_seconds)} de{" "}
                  {formatDuration(summary.event_seconds)} del evento
                </p>
              )}
            </div>
          </div>

          {blocks.length === 0 ? (
            <div className="grid min-h-[200px] content-center justify-items-center p-7 text-center">
              <h3 className="text-sm font-semibold text-text">Aún no hay bloques</h3>
              <p className="mt-2 text-xs text-text-muted">
                {canEdit
                  ? "Agrega el primer bloque con el botón «Agregar bloque»."
                  : "El cronograma de este evento todavía no tiene bloques."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left max-md:block">
                <thead className="max-md:sr-only">
                  <tr>
                    {["Bloque", "Horario", "Duración", "Contenido"].map((label) => (
                      <th
                        className="h-11 bg-surface-muted px-4 text-left text-[10px] font-bold uppercase tracking-wider text-text-subtle first:pl-[22px]"
                        key={label}
                        scope="col"
                      >
                        {label}
                      </th>
                    ))}
                    {canEdit && (
                      <th className="h-11 bg-surface-muted px-4 pr-[22px]" scope="col">
                        <span className="sr-only">Acciones</span>
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="max-md:block">
                  {blocks.map((block) => (
                    <tr
                      className="max-md:grid max-md:gap-y-2 max-md:border-t max-md:border-border max-md:px-4 max-md:py-4"
                      key={block.block_id}
                    >
                      <td className={cell}>
                        <strong className="text-xs font-semibold text-text">{block.block_name}</strong>
                        {(contentsByBlock.get(block.block_id)?.length ?? 0) > 0 && (
                          <details className="mt-1.5">
                            <summary className="cursor-pointer text-[11px] text-text-muted hover:text-primary">
                              Ver contenidos
                            </summary>
                            <ul className="mt-2 grid gap-1.5">
                              {contentsByBlock.get(block.block_id)!.map((item) => (
                                <li
                                  className="flex items-center justify-between gap-3 rounded-md bg-surface-muted px-2.5 py-1.5 text-[11px] text-text-muted"
                                  key={item.id}
                                >
                                  <span className="min-w-0 truncate">
                                    <strong className="text-text">{item.code}</strong> · {item.file_name} ·{" "}
                                    {categoryLabels[item.content_category]}
                                  </span>
                                  <span className="flex flex-none items-center gap-2">
                                    {formatClock(item.duration_seconds)}
                                    <span className={item.accepted ? "text-success" : "text-text-subtle"}>
                                     {item.accepted ? "Aceptado" : item.edited ? "Editado" : item.assigned_editor ? "Con editor" : "Sin editor"}
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </details>
                        )}
                      </td>
                      <td className={`${cell} whitespace-nowrap text-text-muted`}>
                        {timeOnly.format(new Date(block.starts_at))} –{" "}
                        {timeOnly.format(new Date(block.ends_at))}
                      </td>
                      <td className={`${cell} whitespace-nowrap text-text-muted`}>
                        {formatDuration(block.block_seconds)}
                      </td>
                      <td className={cell}>
                        <ContentProgress
                          blockSeconds={block.block_seconds}
                          progress={progressByBlock.get(block.block_id)}
                          toleranceSeconds={toleranceSeconds}
                        />
                      </td>
                      {canEdit && (
                        <td className={cell}>
                          <BlockActions
                            block={block}
                            eventId={event.id}
                            onEdit={() => setEditingBlock(block)}
                            onNotice={setNotice}
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editingBlock && (
        <BlockFormDialog
          block={editingBlock === "new" ? null : editingBlock}
          blocks={blocks}
          event={event}
          onClose={() => setEditingBlock(null)}
          onSuccess={(message) => {
            setNotice({ message, type: "success" });
            setEditingBlock(null);
          }}
          timezone={timezone}
        />
      )}
    </section>
  );
}

function BlockActions({
  block,
  eventId,
  onEdit,
  onNotice,
}: {
  block: BlockSummary;
  eventId: string;
  onEdit: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (
      !window.confirm(
        `¿Eliminar el bloque «${block.block_name}»? Se borrarán también sus secciones.`,
      )
    ) {
      return;
    }
    startTransition(async () => {
      const result = await deleteBlock(eventId, block.block_id);
      onNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
    });
  }

  return (
    <div className="flex justify-end gap-[7px] max-md:justify-start" role="group" aria-label="Acciones del bloque">
      <button
        aria-label={`Editar bloque ${block.block_name}`}
        className={rowButton}
        disabled={isPending}
        onClick={onEdit}
        type="button"
      >
        <Icon name="edit" />
      </button>
      <button
        className={`${rowButton} border-danger/30 text-danger hover:enabled:border-danger hover:enabled:text-danger`}
        disabled={isPending}
        onClick={handleDelete}
        type="button"
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  );
}

type FillState = "empty" | "incomplete" | "complete" | "over";

const fillConfig: Record<FillState, { label: string; badge: string; bar: string }> = {
  empty: {
    label: "Sin contenido",
    badge: "bg-surface-muted text-text-subtle ring-1 ring-border",
    bar: "bg-primary",
  },
  incomplete: {
    label: "Incompleto",
    badge: "bg-gold-100 text-gold-800",
    bar: "bg-primary",
  },
  complete: {
    label: "Completo",
    badge: "bg-success-soft text-success",
    bar: "bg-success",
  },
  over: {
    label: "Excede",
    badge: "bg-danger-soft text-danger",
    bar: "bg-danger",
  },
};

function getFillState(
  used: number,
  total: number,
  tolerance: number,
  count: number,
): FillState {
  if (count === 0) return "empty";
  const delta = used - total;
  if (Math.abs(delta) <= tolerance) return "complete";
  return delta > 0 ? "over" : "incomplete";
}

function ContentProgress({
  blockSeconds,
  progress,
  toleranceSeconds,
}: {
  blockSeconds: number;
  progress: BlockProgress | undefined;
  toleranceSeconds: number;
}) {
  const used = Number(progress?.contents_seconds ?? 0);
  const count = progress?.contents_count ?? 0;
  const percent = blockSeconds > 0 ? Math.round((used / blockSeconds) * 100) : 0;
  const state = getFillState(used, blockSeconds, toleranceSeconds, count);
  const config = fillConfig[state];
  const remaining = blockSeconds - used;

  return (
    <div className="grid min-w-[200px] gap-1.5">
      <div className="flex items-center gap-2">
        <span
          className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold ${config.badge}`}
        >
          {config.label}
        </span>
        {state === "incomplete" && (
          <span className="text-[11px] text-text-muted">
            faltan {formatClock(remaining)}
          </span>
        )}
        {state === "over" && (
          <span className="text-[11px] text-danger">
            sobran {formatClock(-remaining)}
          </span>
        )}
      </div>

      <div
        aria-label={`Contenido registrado: ${percent}% del bloque`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.min(percent, 100)}
        className="h-2 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border"
        role="progressbar"
      >
        <div
          className={`h-full ${config.bar}`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>

      <p className="text-[11px] text-text-muted">
        {formatClock(used)} de {formatClock(blockSeconds)} ({percent}%)
      </p>
      {count > 0 && (
        <p className="text-[11px] text-text-subtle">
          {count} {count === 1 ? "contenido" : "contenidos"} ·{" "}
          {progress?.assigned_count ?? 0} con editor ·{" "}
          {progress?.accepted_count ?? 0} aceptados
        </p>
      )}
    </div>
  );
}