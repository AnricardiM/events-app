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
import { MobileLabel } from "../ui/mobile-label";

type Notice = { message: string; type: "success" | "error" };

const primaryButton =
  "inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:bg-primary-hover";

// En móvil los botones de fila son cuadrados de 40px (solo icono).
const rowButton =
  "inline-flex min-h-[30px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[7px] border border-border bg-surface px-[9px] text-[11px] text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55 max-md:size-10 max-md:min-h-0 max-md:px-0";

const cell =
  "min-w-0 align-middle text-xs md:border-t md:border-border md:px-4 md:py-3 md:first:pl-[22px] md:last:pr-[22px] max-md:text-sm";

export function formatDuration(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  const minutes = Math.round(Math.abs(totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${sign}${m} min`;
  return m === 0 ? `${sign}${h} h` : `${sign}${h} h ${m} min`;
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

function describeFill(
  blockSeconds: number,
  progress: BlockProgress | undefined,
  tolerance: number,
) {
  const used = Number(progress?.contents_seconds ?? 0);
  const count = progress?.contents_count ?? 0;
  return {
    used,
    count,
    state: getFillState(used, blockSeconds, tolerance, count),
    remaining: blockSeconds - used,
    percent: blockSeconds > 0 ? Math.round((used / blockSeconds) * 100) : 0,
  };
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

  const completeBlocks = blocks.filter(
    (block) =>
      describeFill(
        block.block_seconds,
        progressByBlock.get(block.block_id),
        toleranceSeconds,
      ).state === "complete",
  ).length;

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)] min-w-0 max-w-full">
      <div className="mx-auto w-full min-w-0 max-w-[1180px]">
        <header className="mb-7 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <Link
              className="mb-3 inline-block text-[11px] text-text-muted hover:text-primary max-md:text-sm"
              href="/eventos"
            >
              ← Volver a eventos
            </Link>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              CRONOGRAMA
            </p>
            <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
              {event.name}
            </h1>
            <p className="mt-2 text-xs text-text-muted max-md:text-sm">
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
              <span aria-hidden="true" className="text-[19px] leading-none">
                +
              </span>
              Agregar bloque
            </button>
          )}
        </header>

        <section
          aria-label="Listado de bloques"
          className="min-w-0 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          {notice && (
            <p
              aria-live="polite"
              className={`mx-[18px] mt-3.5 rounded-[7px] px-[11px] py-[9px] text-[11px] leading-normal max-md:text-xs ${
                notice.type === "error"
                  ? "bg-danger-soft text-danger"
                  : "bg-success-soft text-success"
              }`}
              role={notice.type === "error" ? "alert" : "status"}
            >
              {notice.message}
            </p>
          )}

          <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border px-[22px] max-sm:flex-col max-sm:items-start max-sm:gap-1 max-sm:px-4 max-sm:py-3">
            <h2 className="text-[15px] font-semibold text-text max-md:text-base">
              Bloques
            </h2>
            <div className="grid gap-0.5 text-right text-xs text-text-muted max-md:text-sm max-sm:text-left">
              <p>
                {completeBlocks} de {blocks.length}{" "}
                {blocks.length === 1 ? "bloque completo" : "bloques completos"} ·{" "}
                {formatClock(totalContentSeconds)} de {formatClock(totalBlockSeconds)}
              </p>
              {summary && (
                <p className="text-[11px] text-text-subtle max-md:text-xs">
                  Bloques: {formatDuration(summary.blocks_seconds)} de{" "}
                  {formatDuration(summary.event_seconds)} del evento
                </p>
              )}
            </div>
          </div>

          {blocks.length === 0 ? (
            <div className="grid min-h-[200px] content-center justify-items-center p-7 text-center">
              <h3 className="text-sm font-semibold text-text">Aún no hay bloques</h3>
              <p className="mt-2 text-xs text-text-muted max-md:text-sm">
                {canEdit
                  ? "Agrega el primer bloque con el botón «Agregar bloque»."
                  : "El cronograma de este evento todavía no tiene bloques."}
              </p>
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
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
                  {blocks.map((block) => {
                    const blockProgress = progressByBlock.get(block.block_id);
                    const blockContents = contentsByBlock.get(block.block_id) ?? [];
                    const fill = describeFill(
                      block.block_seconds,
                      blockProgress,
                      toleranceSeconds,
                    );

                    return (
                      // Móvil, de arriba hacia abajo (orden visual con `order`; el DOM no cambia):
                      //  1. Estado del bloque y nombre (izquierda) + acciones (derecha)
                      //  2. Horario y duración
                      //  3. Avance del contenido y lista de contenidos
                      <tr
                        className="max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-start max-md:gap-x-3 max-md:gap-y-3.5 max-md:border-t max-md:border-border max-md:px-4 max-md:py-4"
                        key={block.block_id}
                      >
                        <td className={`${cell} max-md:order-1 max-md:col-start-1`}>
                          {/* Solo móvil: el estado del bloque va arriba, como etiqueta. */}
                          <div className="mb-2 md:hidden">
                            <FillSummary fill={fill} />
                          </div>
                          <strong className="text-xs font-semibold text-text max-md:text-base">
                            {block.block_name}
                          </strong>
                          {/* Escritorio: la lista va bajo el nombre. En móvil va al final. */}
                          <div className="max-md:hidden">
                            <ContentsList items={blockContents} />
                          </div>
                        </td>

                        <td
                          className={`${cell} whitespace-nowrap text-text-muted max-md:order-2 max-md:col-start-1`}
                        >
                          <MobileLabel>Horario</MobileLabel>
                          {timeOnly.format(new Date(block.starts_at))} –{" "}
                          {timeOnly.format(new Date(block.ends_at))}
                        </td>

                        <td
                          className={`${cell} whitespace-nowrap text-text-muted max-md:order-2 max-md:col-start-2`}
                        >
                          <MobileLabel>Duración</MobileLabel>
                          {formatDuration(block.block_seconds)}
                        </td>

                        <td className={`${cell} max-md:order-3 max-md:col-span-2`}>
                          <ContentProgress
                            blockSeconds={block.block_seconds}
                            fill={fill}
                            progress={blockProgress}
                          />
                          <div className="md:hidden">
                            <ContentsList items={blockContents} />
                          </div>
                        </td>

                        {canEdit && (
                          <td className={`${cell} max-md:order-1 max-md:col-start-2`}>
                            <BlockActions
                              block={block}
                              eventId={event.id}
                              onEdit={() => setEditingBlock(block)}
                              onNotice={setNotice}
                            />
                          </td>
                        )}
                      </tr>
                    );
                  })}
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

function ContentsList({ items }: { items: BlockContent[] }) {
  if (items.length === 0) return null;

  return (
    <details className="mt-1.5 max-md:mt-3">
      <summary className="cursor-pointer text-[11px] text-text-muted hover:text-primary max-md:text-sm">
        Ver contenidos ({items.length})
      </summary>
      <ul className="mt-2 grid gap-1.5">
        {items.map((item) => (
          <li
            className="flex items-center justify-between gap-3 rounded-md bg-surface-muted px-2.5 py-1.5 text-[11px] text-text-muted max-md:flex-col max-md:items-start max-md:gap-1 max-md:px-3 max-md:py-2 max-md:text-xs"
            key={item.id}
          >
            <span className="min-w-0 max-w-full truncate">
              <strong className="text-text">{item.code}</strong> · {item.file_name} ·{" "}
              {categoryLabels[item.content_category]}
            </span>
            <span className="flex flex-none items-center gap-2">
              {formatClock(item.duration_seconds)}
              <span className={item.accepted ? "text-success" : "text-text-subtle"}>
                {item.accepted
                  ? "Aceptado"
                  : item.edited
                    ? "Editado"
                    : item.assigned_editor
                      ? "Con editor"
                      : "Sin editor"}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </details>
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
    <div
      aria-label="Acciones del bloque"
      className="flex justify-end gap-[7px] max-md:gap-2"
      role="group"
    >
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
        aria-label={`Eliminar bloque ${block.block_name}`}
        className={`${rowButton} border-danger/30 text-danger hover:enabled:border-danger hover:enabled:text-danger`}
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
    </div>
  );
}

type Fill = ReturnType<typeof describeFill>;

// Etiqueta de estado + cuánto falta o sobra.
function FillSummary({ fill }: { fill: Fill }) {
  const config = fillConfig[fill.state];

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span
        className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold max-md:min-h-7 max-md:px-3 max-md:text-xs ${config.badge}`}
      >
        {config.label}
      </span>
      {fill.state === "incomplete" && (
        <span className="text-[11px] text-text-muted max-md:text-xs">
          faltan {formatClock(fill.remaining)}
        </span>
      )}
      {fill.state === "over" && (
        <span className="text-[11px] text-danger max-md:text-xs">
          sobran {formatClock(-fill.remaining)}
        </span>
      )}
    </div>
  );
}

function ContentProgress({
  blockSeconds,
  fill,
  progress,
}: {
  blockSeconds: number;
  fill: Fill;
  progress: BlockProgress | undefined;
}) {
  const config = fillConfig[fill.state];

  return (
    <div className="grid min-w-[200px] gap-1.5 max-md:min-w-0">
      {/* En móvil el estado ya aparece como etiqueta arriba. */}
      <div className="max-md:hidden">
        <FillSummary fill={fill} />
      </div>

      <div
        aria-label={`Contenido registrado: ${fill.percent}% del bloque`}
        aria-valuemax={100}
        aria-valuemin={0}
        aria-valuenow={Math.min(fill.percent, 100)}
        className="h-2 overflow-hidden rounded-full bg-surface-muted ring-1 ring-border max-md:h-2.5"
        role="progressbar"
      >
        <div
          className={`h-full ${config.bar}`}
          style={{ width: `${Math.min(fill.percent, 100)}%` }}
        />
      </div>

      <p className="text-[11px] text-text-muted max-md:text-sm">
        {formatClock(fill.used)} de {formatClock(blockSeconds)} ({fill.percent}%)
      </p>
      {fill.count > 0 && (
        <p className="text-[11px] text-text-subtle max-md:text-xs">
          {fill.count} {fill.count === 1 ? "contenido" : "contenidos"} ·{" "}
          {progress?.assigned_count ?? 0} con editor ·{" "}
          {progress?.accepted_count ?? 0} aceptados
        </p>
      )}
    </div>
  );
}