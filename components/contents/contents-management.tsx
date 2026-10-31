"use client";

import { useMemo, useState, useTransition } from "react";
import {
  assignContentEditor,
  deleteContent,
  setContentAccepted,
  setContentEdited,
} from "@/app/actions/contents";
import {
  categoryLabels,
  formatClock,
  mediaLabels,
  sourceLabels,
} from "@/lib/models/content";
import type {
  BlockOption,
  ContentRow,
  EditorOption,
  EventOption,
} from "@/lib/services/contents";
import { ContentFormDialog } from "./content-form-dialog";
import { Icon } from "../ui/icon";

type Notice = { message: string; type: "success" | "error" };
type AcceptedFilter = "all" | "accepted" | "pending";

const primaryButton =
  "inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:bg-primary-hover";
const fieldControl =
  "h-[42px] w-full rounded-lg border border-border bg-surface text-[13px] text-text focus-visible:border-primary";
const rowButton =
  "min-h-[30px] cursor-pointer whitespace-nowrap rounded-[7px] border border-border bg-surface px-[9px] text-[11px] text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55";
const cell = "align-middle border-t border-border px-4 py-3 text-xs first:pl-[22px] last:pr-[22px]";

export function ContentsManagement({
  blocks,
  canAccept,
  canAssign,
  canDelete,
  canRegister,
  contents,
  currentUserId,
  editors,
  events,
  isAdmin
}: {
  blocks: BlockOption[];
  canAccept: boolean;
  canAssign: boolean;
  canDelete: boolean;
  canRegister: boolean;
  contents: ContentRow[];
  currentUserId: string | null;
  editors: EditorOption[];
  events: EventOption[];
  isAdmin: boolean;
}) 
{
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [acceptedFilter, setAcceptedFilter] = useState<AcceptedFilter>("all");
  const [editing, setEditing] = useState<ContentRow | "new" | null>(null);

  const editorNames = useMemo(
    () =>
      new Map(
        editors.map((editor) => [
          editor.id,
          `${editor.full_name?.trim() || "Sin nombre"}${editor.is_active ? "" : " (inactivo)"}`,
        ]),
      ),
    [editors],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return contents.filter((content) => {
      const matchesQuery =
        !q ||
        content.code.toLowerCase().includes(q) ||
        content.file_name.toLowerCase().includes(q) ||
        content.delivered_by.toLowerCase().includes(q);
      
      const matchesEvent = eventFilter === "all" || content.event_id === eventFilter;

      const matchesAccepted =
        acceptedFilter === "all" ||
        (acceptedFilter === "accepted" ? content.accepted : !content.accepted);
    
      return matchesQuery && matchesEvent && matchesAccepted;
    });
  }, [contents, query, eventFilter, acceptedFilter]);

  function resetFilters() {
    setQuery("");
    setEventFilter("all");
    setAcceptedFilter("all");
  }

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)]">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-7 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              CONTENIDOS
            </p>
            <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
              Registro de contenido
            </h1>
          </div>
          {canRegister && (
            <button
              aria-haspopup="dialog"
              className={`${primaryButton} max-sm:w-full`}
              onClick={() => setEditing("new")}
              type="button"
            >
              <span aria-hidden="true" className="text-[19px] leading-none">+</span>
              Registrar contenido
            </button>
          )}
        </header>

        <section
          aria-label="Filtros de contenidos"
          className="mb-5 flex flex-wrap items-end gap-3.5 rounded-xl border border-border bg-surface p-4 max-sm:p-3"
        >
          <label className="min-w-[200px] flex-1 max-md:basis-full">
            <span className="sr-only">Buscar por código, archivo o persona</span>
            <input
              className={`${fieldControl} px-3 placeholder:text-text-subtle`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código, archivo o persona"
              type="search"
              value={query}
            />
          </label>

          <label className="grid min-w-[190px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1">
            <span>Evento</span>
            <select
              className={`${fieldControl} pl-[11px] pr-[30px]`}
              onChange={(event) => setEventFilter(event.target.value)}
              value={eventFilter}
            >
              <option value="all">Todos los eventos</option>
              {events.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-[155px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1">
            <span>Aceptación</span>
            <select
              className={`${fieldControl} pl-[11px] pr-[30px]`}
              onChange={(event) => setAcceptedFilter(event.target.value as AcceptedFilter)}
              value={acceptedFilter}
            >
              <option value="all">Todos</option>
              <option value="accepted">Aceptados</option>
              <option value="pending">Pendientes</option>
            </select>
          </label>
        </section>

        <section
          aria-label="Listado de contenidos"
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

          <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border px-[22px] max-sm:px-4">
            <h2 className="text-[15px] font-semibold text-text">Contenidos</h2>
            <p className="text-xs text-text-muted">
              {filtered.length} de {contents.length}
            </p>
          </div>

          {contents.length === 0 ? (
            <Empty
              text={
                canRegister
                  ? "Registra el primero con el botón «Registrar contenido»."
                  : "Todavía no se registró ningún contenido."
              }
              title="Aún no hay contenidos"
            />
          ) : filtered.length === 0 ? (
            <Empty text="Prueba cambiando el texto o los filtros." title="No encontramos coincidencias">
              <button
                className={`${primaryButton} mt-3.5 min-h-[34px] px-3 text-[11px]`}
                onClick={resetFilters}
                type="button"
              >
                Limpiar filtros
              </button>
            </Empty>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1080px] border-collapse text-left">
                <thead>
                  <tr>
                   {["Código", "Archivo", "Tipo", "Formato", "Bloque", "Duración", "Editor", "Edición", "Aceptado"].map(
                      (label) => (
                        <th
                          className="h-11 bg-surface-muted px-4 text-left text-[10px] font-bold uppercase tracking-wider text-text-subtle first:pl-[22px]"
                          key={label}
                          scope="col"
                        >
                          {label}
                        </th>
                      ),
                    )}
                    <th className="h-11 bg-surface-muted px-4 pr-[22px]" scope="col">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((content) => (
                    <tr key={content.id}>
                      <td className={`${cell} whitespace-nowrap font-semibold text-text`}>
                        {content.code}
                      </td>
                      <td className={cell}>
                        <strong className="block max-w-[220px] truncate text-xs font-semibold text-text">
                          {content.file_name}
                        </strong>
                        <span className="block max-w-[220px] truncate text-[11px] text-text-subtle">
                          {content.delivered_by}
                        </span>
                      </td>
                      <td className={cell}>{categoryLabels[content.content_category]}</td>
                      <td className={`${cell} text-text-muted`}>
                        {mediaLabels[content.media_type]} · {sourceLabels[content.source]}
                        <span className="block text-[11px] text-text-subtle">
                          {content.files_count}{" "}
                          {content.files_count === 1 ? "archivo" : "archivos"}
                        </span>
                      </td>
                      <td className={`${cell} text-text-muted`}>
                      {content.event_blocks?.name ?? "—"}
                      <span className="block text-[11px] text-text-subtle">
                        {content.events?.name ?? ""}
                      </span>
                     </td>
                      <td className={`${cell} whitespace-nowrap text-text-muted`}>
                        {formatClock(content.duration_seconds)}
                      </td>
                      <td className={cell}>
                        <EditorCell
                          canAssign={canAssign}
                          content={content}
                          editorNames={editorNames}
                          editors={editors}
                          onNotice={setNotice}
                        />
                      </td>
                      <td className={cell}>
                        <EditedCell
                          canToggle={isAdmin || content.assigned_editor === currentUserId}
                          content={content}
                          onNotice={setNotice}
                        />
                      </td>
                      <td className={cell}>
                        <AcceptedCell canAccept={canAccept} content={content} onNotice={setNotice} />
                      </td>
                      <td className={cell}>
                        <RowActions
                          canDelete={canDelete}
                          canEdit={canRegister}
                          content={content}
                          onEdit={() => setEditing(content)}
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

      {editing && (
        <ContentFormDialog
          blocks={blocks}
          content={editing === "new" ? null : editing}
          events={events}
          onClose={() => setEditing(null)}
          onSuccess={(message) => {
            setNotice({ message, type: "success" });
            setEditing(null);
          }}
        />
      )}
    </section>
  );
}

function Empty({
  children,
  text,
  title,
}: {
  children?: React.ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="grid min-h-[200px] content-center justify-items-center p-7 text-center">
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-2 text-xs text-text-muted">{text}</p>
      {children}
    </div>
  );
}

function EditorCell({
  canAssign,
  content,
  editorNames,
  editors,
  onNotice,
}: {
  canAssign: boolean;
  content: ContentRow;
  editorNames: Map<string, string>;
  editors: EditorOption[];
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  if (!canAssign) {
    return content.assigned_editor ? (
      <span>{editorNames.get(content.assigned_editor) ?? "Editor"}</span>
    ) : (
      <span className="text-text-subtle">Sin asignar</span>
    );
  }

  function handleChange(value: string) {
    startTransition(async () => {
      const result = await assignContentEditor(content.id, value || null);
      onNotice({ message: result.message, type: result.success ? "success" : "error" });
    });
  }

  return (
    <select
      aria-label={`Editor de ${content.code}`}
      className="h-[34px] w-full min-w-[150px] rounded-lg border border-border bg-surface px-2 text-xs text-text disabled:opacity-60"
      disabled={isPending}
      onChange={(event) => handleChange(event.target.value)}
      value={content.assigned_editor ?? ""}
    >
      <option value="">Sin asignar</option>
      {editors.map((editor) => (
        <option disabled={!editor.is_active} key={editor.id} value={editor.id}>
          {editorNames.get(editor.id)}
        </option>
      ))}
    </select>
  );
}

function AcceptedCell({
  canAccept,
  content,
  onNotice,
}: {
  canAccept: boolean;
  content: ContentRow;
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setContentAccepted(content.id, !content.accepted);
      onNotice({ message: result.message, type: result.success ? "success" : "error" });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold ${
          content.accepted
            ? "bg-success-soft text-success"
            : "bg-surface-muted text-text-subtle ring-1 ring-border"
        }`}
      >
        {content.accepted ? "Aceptado" : "Pendiente"}
      </span>
      {canAccept && (
        <button
          className={rowButton}
          disabled={isPending || (!content.accepted && !content.edited)}
          title={!content.accepted && !content.edited ? "Debe estar editado primero" : undefined}
          onClick={toggle}          
          type="button"
        >
          {isPending ? "..." : content.accepted ? "Quitar" : "Aceptar"}
        </button>
      )}
    </div>
  );
}

function RowActions({
  canDelete,
  canEdit,
  content,
  onEdit,
  onNotice,
}: {
  canDelete: boolean;
  canEdit: boolean;
  content: ContentRow;
  onEdit: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`¿Eliminar el contenido ${content.code}?`)) return;
    startTransition(async () => {
      const result = await deleteContent(content.id);
      onNotice({ message: result.message, type: result.success ? "success" : "error" });
    });
  }

  if (!canEdit && !canDelete) return null;

  return (
    <div className="flex justify-end gap-[7px]" role="group" aria-label="Acciones del contenido">
      {canEdit && (
        <button
          aria-label={`Editar ${content.code}`}
          className={rowButton}
          disabled={isPending}
          onClick={onEdit}
          type="button"
        >
          <Icon name="edit" />
        </button>
      )}
      {canDelete && (
        <button
          className={`${rowButton} border-danger/30 text-danger hover:enabled:border-danger hover:enabled:text-danger`}
          disabled={isPending}
          onClick={handleDelete}
          type="button"
        >
          {isPending ? "..." : "Eliminar"}
        </button>
      )}
    </div>
  );
}
function EditedCell({
  canToggle,
  content,
  onNotice,
}: {
  canToggle: boolean;
  content: ContentRow;
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      const result = await setContentEdited(content.id, !content.edited);
      onNotice({ message: result.message, type: result.success ? "success" : "error" });
    });
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold ${
          content.edited
            ? "bg-success-soft text-success"
            : "bg-surface-muted text-text-subtle ring-1 ring-border"
        }`}
      >
        {content.edited ? "Editado" : "Pendiente"}
      </span>
      {canToggle && content.assigned_editor && (
        <button className={rowButton} disabled={isPending} onClick={toggle} type="button">
          {isPending ? "..." : content.edited ? "Quitar" : "Marcar editado"}
        </button>
      )}
    </div>
  );
}