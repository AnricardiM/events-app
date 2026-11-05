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
type ApprovedFilter = "all" | "approved" | "pending";

const primaryButton =
  "inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:bg-primary-hover";
const fieldControl =
  "h-[42px] w-full rounded-lg border border-border bg-surface text-[13px] text-text focus-visible:border-primary";

const actionBase =
  "inline-flex cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-[7px] border border-border bg-surface text-[11px] text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55";
// Botón solo con icono: cuadrado (44px en móvil, 32px en escritorio).
const iconButton = `${actionBase} size-8 max-md:size-11`;
// Botón con icono y texto: en móvil se reparten el ancho de la fila.
const labelButton = `${actionBase} min-h-8 px-2.5 max-md:min-h-11 max-md:flex-1 max-md:px-3 max-md:text-sm`;

// En escritorio: celdas de tabla con borde y padding.
// En móvil (max-md): cada fila es una tarjeta y las celdas se acomodan en una grilla.
const cell =
  "min-w-0 align-middle text-xs md:border-t md:border-border md:px-4 md:py-3 md:first:pl-[22px] md:last:pr-[22px] max-md:text-sm";

const headerLabels = [
  "Código",
  "Archivo",
  "Tipo",
  "Formato",
  "Bloque",
  "Duración",
  "Editor",
  "Edición",
  "Aprobado",
];

// Etiqueta de campo: solo se ve en móvil, porque ahí no hay encabezados de tabla.
function MobileLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-subtle max-md:text-xs md:hidden">
      {children}
    </span>
  );
}

function StatusPill({
  active,
  activeLabel,
  inactiveLabel,
}: {
  active: boolean;
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <span
      className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold max-md:min-h-7 max-md:px-3 max-md:text-xs ${
        active
          ? "bg-success-soft text-success"
          : "bg-surface-muted text-text-subtle ring-1 ring-border"
      }`}
    >
      {active ? activeLabel : inactiveLabel}
    </span>
  );
}

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
  isAdmin,
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
}) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [approvedFilter, setApprovedFilter] = useState<ApprovedFilter>("all");
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

      const matchesEvent =
        eventFilter === "all" || content.event_id === eventFilter;

      const matchesApproved =
        approvedFilter === "all" ||
        (approvedFilter === "approved" ? content.accepted : !content.accepted);

      return matchesQuery && matchesEvent && matchesApproved;
    });
  }, [contents, query, eventFilter, approvedFilter]);

  function resetFilters() {
    setQuery("");
    setEventFilter("all");
    setApprovedFilter("all");
  }

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)] min-w-0 max-w-full">
      <div className="mx-auto w-full min-w-0 max-w-[1180px]">
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
              <span aria-hidden="true" className="text-[19px] leading-none">
                +
              </span>
              Registrar contenido
            </button>
          )}
        </header>

        <section
          aria-label="Filtros de contenidos"
          className="mb-5 flex flex-wrap items-end gap-3.5 rounded-xl border border-border bg-surface p-4 max-sm:p-3"
        >
          <label className="min-w-[200px] flex-1 max-md:min-w-0 max-md:basis-full">
            <span className="sr-only">Buscar por código, archivo o persona</span>
            <input
              className={`${fieldControl} px-3 placeholder:text-text-subtle`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por código, archivo o persona"
              type="search"
              value={query}
            />
          </label>

          {/* En pantallas angostas cada filtro ocupa su propia fila, para que el texto no se corte. */}
          <label className="grid min-w-[190px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1 max-md:text-xs max-sm:basis-full">
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

          <label className="grid min-w-[155px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1 max-md:text-xs max-sm:basis-full">
            <span>Aprobación</span>
            <select
              className={`${fieldControl} pl-[11px] pr-[30px]`}
              onChange={(event) =>
                setApprovedFilter(event.target.value as ApprovedFilter)
              }
              value={approvedFilter}
            >
              <option value="all">Todos</option>
              <option value="approved">Aprobados</option>
              <option value="pending">Pendientes</option>
            </select>
          </label>
        </section>

        <section
          aria-label="Listado de contenidos"
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

          <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border px-[22px] max-sm:px-4">
            <h2 className="text-[15px] font-semibold text-text max-md:text-base">
              Contenidos
            </h2>
            <p className="text-xs text-text-muted max-md:text-sm">
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
            <Empty
              text="Prueba cambiando el texto o los filtros."
              title="No encontramos coincidencias"
            >
              <button
                className={`${primaryButton} mt-3.5 min-h-[34px] px-3 text-[11px]`}
                onClick={resetFilters}
                type="button"
              >
                Limpiar filtros
              </button>
            </Empty>
          ) : (
            // Un solo render: tabla en escritorio, tarjetas en móvil (max-md).
            // El ancho mínimo de la tabla solo aplica desde md; en móvil no
            // existe, así que la página nunca se ensancha más que la pantalla.
            <div className="w-full max-w-full overflow-x-auto">
              <table className="w-full border-collapse text-left max-md:block md:min-w-[1180px]">
                <thead className="max-md:sr-only">
                  <tr>
                    {headerLabels.map((label) => (
                      <th
                        className="h-11 bg-surface-muted px-4 text-left text-[10px] font-bold uppercase tracking-wider text-text-subtle first:pl-[22px]"
                        key={label}
                        scope="col"
                      >
                        {label}
                      </th>
                    ))}
                    <th
                      className="h-11 bg-surface-muted px-4 pr-[22px]"
                      scope="col"
                    >
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="max-md:block">
                  {filtered.map((content) => {
                    // El botón «Editado» solo lo ve el editor asignado (o un admin)
                    // y desaparece cuando el contenido ya está editado.
                    const canMarkEdited =
                      !content.edited &&
                      Boolean(content.assigned_editor) &&
                      (isAdmin || content.assigned_editor === currentUserId);
                    const hasActions =
                      canRegister || canDelete || canMarkEdited || canAccept;

                    return (
                      // Móvil, de arriba hacia abajo (orden visual con `order`; el DOM no cambia):
                      //  1. Etiquetas (tipo, edición, aprobación) y código
                      //  2. Archivo y persona
                      //  3. Formato | Duración
                      //  4. Bloque | Editor
                      //  5. Botones: editar, editado, aprobado y eliminar
                      <tr
                        className="max-md:grid max-md:grid-cols-2 max-md:items-start max-md:gap-x-3 max-md:gap-y-3.5 max-md:border-t max-md:border-border max-md:px-4 max-md:py-4"
                        key={content.id}
                      >
                        <td
                          className={`${cell} whitespace-nowrap font-semibold text-text max-md:order-1 max-md:col-span-2`}
                        >
                          {/* Solo móvil: las etiquetas de estado van arriba. */}
                          <div className="mb-2 flex flex-wrap gap-1.5 md:hidden">
                            <span className="inline-flex min-h-7 items-center whitespace-nowrap rounded-full bg-primary-soft px-3 text-xs font-semibold text-primary-soft-text">
                              {categoryLabels[content.content_category]}
                            </span>
                            <StatusPill
                              active={content.edited}
                              activeLabel="Editado"
                              inactiveLabel="Sin editar"
                            />
                            <StatusPill
                              active={content.accepted}
                              activeLabel="Aprobado"
                              inactiveLabel="Sin aprobar"
                            />
                          </div>
                          <MobileLabel>Código</MobileLabel>
                          {content.code}
                        </td>

                        <td className={`${cell} max-md:order-2 max-md:col-span-2`}>
                          <strong className="block max-w-[220px] truncate text-xs font-semibold text-text max-md:max-w-full max-md:text-base">
                            {content.file_name}
                          </strong>
                          <span className="block max-w-[220px] truncate text-[11px] text-text-subtle max-md:max-w-full max-md:text-xs">
                            {content.delivered_by}
                          </span>
                        </td>

                        {/* El tipo ya se ve como etiqueta arriba en móvil. */}
                        <td className={`${cell} max-md:hidden`}>
                          {categoryLabels[content.content_category]}
                        </td>

                        <td
                          className={`${cell} text-text-muted max-md:order-3 max-md:col-start-1`}
                        >
                          <MobileLabel>Formato</MobileLabel>
                          {mediaLabels[content.media_type]} ·{" "}
                          {sourceLabels[content.source]}
                          <span className="block text-[11px] text-text-subtle max-md:text-xs">
                            {content.files_count}{" "}
                            {content.files_count === 1 ? "archivo" : "archivos"}
                          </span>
                        </td>

                        <td
                          className={`${cell} text-text-muted max-md:order-4 max-md:col-start-1`}
                        >
                          <MobileLabel>Bloque</MobileLabel>
                          {content.event_blocks?.name ?? "—"}
                          <span className="block text-[11px] text-text-subtle max-md:text-xs">
                            {content.events?.name ?? ""}
                          </span>
                        </td>

                        <td
                          className={`${cell} whitespace-nowrap text-text-muted max-md:order-3 max-md:col-start-2`}
                        >
                          <MobileLabel>Duración</MobileLabel>
                          {formatClock(content.duration_seconds)}
                        </td>

                        <td className={`${cell} max-md:order-4 max-md:col-start-2`}>
                          <MobileLabel>Editor</MobileLabel>
                          <EditorCell
                            canAssign={canAssign}
                            content={content}
                            editorNames={editorNames}
                            editors={editors}
                            onNotice={setNotice}
                          />
                        </td>

                        {/* Solo escritorio: en móvil estos estados son las etiquetas de arriba. */}
                        <td className={`${cell} max-md:hidden`}>
                          <StatusPill
                            active={content.edited}
                            activeLabel="Editado"
                            inactiveLabel="Sin editar"
                          />
                        </td>
                        <td className={`${cell} max-md:hidden`}>
                          <StatusPill
                            active={content.accepted}
                            activeLabel="Aprobado"
                            inactiveLabel="Sin aprobar"
                          />
                        </td>

                        <td
                          className={`${cell} md:whitespace-nowrap max-md:order-5 max-md:col-span-2 max-md:border-t max-md:border-border max-md:pt-3.5 ${
                            hasActions ? "" : "max-md:hidden"
                          }`}
                        >
                          <RowActions
                            canAccept={canAccept}
                            canDelete={canDelete}
                            canEdit={canRegister}
                            canMarkEdited={canMarkEdited}
                            content={content}
                            onEdit={() => setEditing(content)}
                            onNotice={setNotice}
                          />
                        </td>
                      </tr>
                    );
                  })}
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
      <p className="mt-2 text-xs text-text-muted max-md:text-sm">{text}</p>
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
      onNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
    });
  }

  return (
    <select
      aria-label={`Editor de ${content.code}`}
      className="h-[34px] w-full min-w-[150px] rounded-lg border border-border bg-surface px-2 text-xs text-text disabled:opacity-60 max-md:h-11 max-md:min-w-0 max-md:px-2.5"
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

// Orden de los botones: 1 editar (lápiz) · 2 editado (check) ·
// 3 aprobado (doble check) · 4 eliminar (papelera).
function RowActions({
  canAccept,
  canDelete,
  canEdit,
  canMarkEdited,
  content,
  onEdit,
  onNotice,
}: {
  canAccept: boolean;
  canDelete: boolean;
  canEdit: boolean;
  canMarkEdited: boolean;
  content: ContentRow;
  onEdit: () => void;
  onNotice: (notice: Notice) => void;
}) {
  const [isPending, startTransition] = useTransition();

  function run(action: () => Promise<{ success: boolean; message: string }>) {
    startTransition(async () => {
      const result = await action();
      onNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
    });
  }

  function handleDelete() {
    if (!window.confirm(`¿Eliminar el contenido ${content.code}?`)) return;
    run(() => deleteContent(content.id));
  }

  if (!canEdit && !canDelete && !canMarkEdited && !canAccept) return null;

  const approveBlocked = !content.accepted && !content.edited;
  
  return (
    <div
      aria-label="Acciones del contenido"
      className="flex items-center gap-2 md:justify-end"
      role="group"
    >
      {canEdit && (
        <button
          aria-label={`Editar ${content.code}`}
          className={iconButton}
          disabled={isPending}
          onClick={onEdit}
          title="Editar"
          type="button"
        >
          <Icon name="edit" />
        </button>
      )}

      {canMarkEdited && (
        <button
          aria-label={`Marcar ${content.code} como editado`}
          className={labelButton}
          disabled={isPending}
          onClick={() => run(() => setContentEdited(content.id, true))}
          type="button"
        >
          <Icon name="check" />
        </button>
      )}

      {canAccept && (
        <button
          aria-label={`Aprobar ${content.code}`}
          className={labelButton}
          disabled={isPending || approveBlocked}
          onClick={() => run(() => setContentAccepted(content.id, !content.accepted))}
          title={approveBlocked ? "Debe estar editado primero" : undefined}
          type="button"
        >
          <Icon name="double-check" />
        </button>      
      )}


        {canAccept && (       
        <button
          aria-label={`Rechazar ${content.code}`}
          className={labelButton}
          disabled={isPending || approveBlocked}
          onClick={() => run(() => setContentAccepted(content.id, !content.accepted))}
          title={approveBlocked ? "Debe estar editado primero" : undefined}
          type="button"
        >
          <Icon name="rejected" />
        </button>
      )}

      {canDelete && (
        <button
          aria-label={`Eliminar ${content.code}`}
          className={`${iconButton} border-danger/30 text-danger hover:enabled:border-danger hover:enabled:text-danger`}
          disabled={isPending}
          onClick={handleDelete}
          title="Eliminar"
          type="button"
        >
          <Icon name="trash" />
        </button>
      )}
    </div>
  );
}