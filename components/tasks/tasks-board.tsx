"use client";

import { useState, useTransition } from "react";
import type { ReactNode } from "react";
import {
  assignContentEditor,
  setContentAccepted,
  setContentEdited,
} from "@/app/actions/contents";
import {
  categoryLabels,
  formatClock,
  mediaLabels,
  sourceLabels,
} from "@/lib/models/content";
import type { ContentRow, EditorOption } from "@/lib/services/contents";
import type { TaskList, TasksData } from "@/lib/services/tasks";
import { RejectDialog } from "../contents/reject-dialog";
import { Icon } from "../ui/icon";

type Notice = { message: string; type: "success" | "error" };
type ActionResult = { success: boolean; message: string };

const actionButton =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-border bg-surface px-3 text-xs font-semibold text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55 max-md:min-h-11 max-md:flex-1 max-md:text-sm";
const primaryAction =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-primary px-3 text-xs font-semibold text-on-primary hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-55 max-md:min-h-11 max-md:flex-1 max-md:text-sm";
const dangerAction =
  "inline-flex min-h-9 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-danger/30 bg-surface px-3 text-xs font-semibold text-danger hover:enabled:border-danger disabled:cursor-not-allowed disabled:opacity-55 max-md:min-h-11 max-md:flex-1 max-md:text-sm";

export function TasksBoard({ tasks }: { tasks: TasksData }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [rejecting, setRejecting] = useState<ContentRow | null>(null);

  const { toAssign, toEdit, toReview, editors } = tasks;
  const noSections = !toAssign && !toEdit && !toReview;

  function report(result: ActionResult) {
    setNotice({
      message: result.message,
      type: result.success ? "success" : "error",
    });
  }

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)] min-w-0 max-w-full">
      <div className="mx-auto w-full min-w-0 max-w-[980px]">
        <header className="mb-7">
          <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
            TAREAS
          </p>
          <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
            Mis tareas
          </h1>
          <p className="mt-2 text-xs text-text-muted max-md:text-sm">
            Lo que está esperando tu acción, de lo más reciente a lo más antiguo.
          </p>
        </header>

        {tasks.hasError && (
          <p
            className="mb-5 rounded-[7px] bg-danger-soft px-[11px] py-[9px] text-[11px] leading-normal text-danger max-md:text-xs"
            role="alert"
          >
            Algunas listas no se pudieron cargar. Recarga la página para
            intentarlo de nuevo.
          </p>
        )}

        {notice && (
          <p
            aria-live="polite"
            className={`mb-5 rounded-[7px] px-[11px] py-[9px] text-[11px] leading-normal max-md:text-xs ${
              notice.type === "error"
                ? "bg-danger-soft text-danger"
                : "bg-success-soft text-success"
            }`}
            role={notice.type === "error" ? "alert" : "status"}
          >
            {notice.message}
          </p>
        )}

        <div className="grid gap-6">
          {toAssign && (
            <TaskSection
              description="Contenido nuevo que necesita edición y todavía no tiene editor."
              id="sin-editor"
              list={toAssign}
              title="Asignar editor"
            >
              {toAssign.items.map((item) => (
                <TaskCard
                  actions={
                    <AssignEditor
                      content={item}
                      editors={editors}
                      onResult={report}
                    />
                  }
                  content={item}
                  key={item.id}
                />
              ))}
            </TaskSection>
          )}

          {toEdit && (
            <TaskSection
              description="Contenido asignado a ti. Cuando termines de editarlo, márcalo como editado."
              id="por-editar"
              list={toEdit}
              title="Por editar"
            >
              {toEdit.items.map((item) => (
                <TaskCard
                  actions={<MarkEdited content={item} onResult={report} />}
                  content={item}
                  key={item.id}
                />
              ))}
            </TaskSection>
          )}

          {toReview && (
            <TaskSection
              description="Contenido ya editado. Apruébalo o recházalo con un comentario."
              id="por-aprobar"
              list={toReview}
              title="Por aprobar"
            >
              {toReview.items.map((item) => (
                <TaskCard
                  actions={
                    <ReviewActions
                      content={item}
                      onReject={() => setRejecting(item)}
                      onResult={report}
                    />
                  }
                  content={item}
                  key={item.id}
                />
              ))}
            </TaskSection>
          )}

          {noSections && (
            <p className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
              Tu rol no tiene tareas en este módulo.
            </p>
          )}
        </div>
      </div>

      {rejecting && (
        <RejectDialog
          content={rejecting}
          onClose={() => setRejecting(null)}
          onSuccess={(message) => {
            setNotice({ message, type: "success" });
            setRejecting(null);
          }}
        />
      )}
    </section>
  );
}

function TaskSection({
  children,
  description,
  id,
  list,
  title,
}: {
  children: ReactNode;
  description: string;
  id: string;
  list: TaskList;
  title: string;
}) {
  const hidden = list.total - list.items.length;

  return (
    // scroll-mt para que el encabezado fijo no tape el título al llegar por enlace.
    <section
      aria-labelledby={`${id}-title`}
      className="min-w-0 scroll-mt-24 overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
      id={id}
    >
      <header className="flex items-start justify-between gap-4 border-b border-border px-[22px] py-4 max-sm:px-4">
        <div className="min-w-0">
          <h2
            className="text-[15px] font-semibold text-text max-md:text-base"
            id={`${id}-title`}
          >
            {title}
          </h2>
          <p className="mt-0.5 text-xs text-text-muted max-md:text-sm">
            {description}
          </p>
        </div>
        <span className="grid h-7 min-w-7 flex-none place-items-center rounded-full bg-primary-soft px-2 text-xs font-bold text-primary-soft-text">
          {list.total}
        </span>
      </header>

      {list.items.length === 0 ? (
        <p className="px-[22px] py-8 text-center text-sm text-text-muted max-sm:px-4">
          No hay tareas pendientes. ¡Todo al día!
        </p>
      ) : (
        <ul className="divide-y divide-border">{children}</ul>
      )}

      {hidden > 0 && (
        <p className="border-t border-border px-[22px] py-3 text-xs text-text-subtle max-sm:px-4">
          Se muestran las {list.items.length} más recientes de {list.total}.
        </p>
      )}
    </section>
  );
}

// Tarjeta de una tarea: datos del contenido arriba y acciones al final.
function TaskCard({
  actions,
  content,
}: {
  actions: ReactNode;
  content: ContentRow;
}) {
  const rejected = !content.edited && content.rejection_comment;

  return (
    <li className="grid gap-3 px-[22px] py-4 max-sm:px-4">
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="inline-flex min-h-6 items-center rounded-md bg-navy-50 px-2 text-[11px] font-bold text-primary max-md:min-h-7 max-md:text-xs">
          {content.code}
        </span>
        <span className="inline-flex min-h-6 items-center rounded-full bg-primary-soft px-2.5 text-[10px] font-semibold text-primary-soft-text max-md:min-h-7 max-md:text-xs">
          {categoryLabels[content.content_category]}
        </span>
        <span className="inline-flex min-h-6 items-center rounded-full bg-surface-muted px-2.5 text-[10px] font-semibold text-text-subtle ring-1 ring-border max-md:min-h-7 max-md:text-xs">
          {mediaLabels[content.media_type]} · {sourceLabels[content.source]}
        </span>
        {rejected && (
          <span className="inline-flex min-h-6 items-center rounded-full bg-danger-soft px-2.5 text-[10px] font-semibold text-danger max-md:min-h-7 max-md:text-xs">
            Rechazado
          </span>
        )}
      </div>

      <div className="min-w-0">
        <strong className="block break-words text-sm font-semibold text-text max-md:text-base">
          {content.file_name}
        </strong>
        <span className="mt-0.5 block text-xs text-text-muted max-md:text-sm">
          {[content.events?.name, content.event_blocks?.name]
            .filter(Boolean)
            .join(" · ") || "Sin evento"}
        </span>
        <span className="mt-0.5 block text-[11px] text-text-subtle max-md:text-xs">
          Entrega: {content.delivered_by} · {formatClock(content.duration_seconds)} ·{" "}
          {content.files_count} {content.files_count === 1 ? "archivo" : "archivos"}
        </span>
      </div>

      {rejected && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-xs leading-relaxed text-danger max-md:text-sm">
          <strong className="font-semibold">Comentario del revisor:</strong>{" "}
          {content.rejection_comment}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    </li>
  );
}

// Ejecuta una acción de servidor mostrando el estado "pendiente" en el botón.
function useTaskAction(onResult: (result: ActionResult) => void) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<ActionResult>) {
    startTransition(async () => {
      onResult(await action());
    });
  }

  return { isPending, run };
}

function AssignEditor({
  content,
  editors,
  onResult,
}: {
  content: ContentRow;
  editors: EditorOption[];
  onResult: (result: ActionResult) => void;
}) {
  const { isPending, run } = useTaskAction(onResult);
  const activeEditors = editors.filter((editor) => editor.is_active);

  if (activeEditors.length === 0) {
    return (
      <p className="text-xs text-text-subtle max-md:text-sm">
        No hay editores activos. Crea o activa un usuario con el rol Editor.
      </p>
    );
  }

  return (
    <label className="grid w-full gap-1.5 text-[11px] font-semibold text-text-muted sm:max-w-[320px] max-md:text-xs">
      Asignar a
      <select
        aria-label={`Asignar editor a ${content.code}`}
        className="h-10 w-full rounded-lg border border-border bg-surface px-2.5 text-[13px] font-normal text-text disabled:opacity-60 max-md:h-11"
        disabled={isPending}
        onChange={(event) => {
          const editorId = event.target.value;
          if (editorId) run(() => assignContentEditor(content.id, editorId));
        }}
        value=""
      >
        <option value="">{isPending ? "Asignando..." : "Elige un editor..."}</option>
        {activeEditors.map((editor) => (
          <option key={editor.id} value={editor.id}>
            {editor.full_name?.trim() || "Sin nombre"}
          </option>
        ))}
      </select>
    </label>
  );
}

function MarkEdited({
  content,
  onResult,
}: {
  content: ContentRow;
  onResult: (result: ActionResult) => void;
}) {
  const { isPending, run } = useTaskAction(onResult);

  return (
    <button
      aria-label={`Marcar ${content.code} como editado`}
      className={primaryAction}
      disabled={isPending}
      onClick={() => run(() => setContentEdited(content.id, true))}
      type="button"
    >
      <Icon name="check" />
      {isPending ? "Guardando..." : "Marcar editado"}
    </button>
  );
}

function ReviewActions({
  content,
  onReject,
  onResult,
}: {
  content: ContentRow;
  onReject: () => void;
  onResult: (result: ActionResult) => void;
}) {
  const { isPending, run } = useTaskAction(onResult);

  return (
    <>
      <button
        aria-label={`Aprobar ${content.code}`}
        className={primaryAction}
        disabled={isPending}
        onClick={() => run(() => setContentAccepted(content.id, true))}
        type="button"
      >
        <Icon name="double-check" />
        {isPending ? "Guardando..." : "Aprobado"}
      </button>
      <button
        aria-label={`Rechazar ${content.code}`}
        className={dangerAction}
        disabled={isPending}
        onClick={onReject}
        type="button"
      >
        <Icon name="rejected" />
        Rechazado
      </button>
    </>
  );
}