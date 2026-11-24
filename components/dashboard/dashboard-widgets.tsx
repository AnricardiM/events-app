import Link from "next/link";
import type { ReactNode } from "react";
import { categoryLabels } from "@/lib/models/content";
import type {
  BlockProgressItem,
  ContentWidget,
  EventProgress,
  NextEventInfo,
} from "@/lib/services/dashboard";
import { fillLabels, formatDuration } from "@/lib/utils/schedule";
import type { FillState } from "@/lib/utils/schedule";

type Tone = "primary" | "gold" | "success";

const toneClasses: Record<Tone, string> = {
  primary: "bg-navy-50 text-primary",
  gold: "bg-gold-100 text-gold-800",
  success: "bg-success-soft text-success",
};

const fillBadge: Record<FillState, string> = {
  empty: "bg-surface-muted text-text-subtle ring-1 ring-border",
  incomplete: "bg-gold-100 text-gold-800",
  complete: "bg-success-soft text-success",
  over: "bg-danger-soft text-danger",
};

const fillBar: Record<FillState, string> = {
  empty: "bg-primary",
  incomplete: "bg-primary",
  complete: "bg-success",
  over: "bg-danger",
};

const cardBase =
  "rounded-[14px] border border-border bg-surface shadow-[0_3px_14px_rgb(25_25_58/3%)]";

const linkCard = `${cardBase} block transition hover:border-navy-300 hover:shadow-[0_6px_20px_rgb(25_25_58/8%)] focus-visible:outline-2 focus-visible:outline-primary`;

function Arrow() {
  return (
    <svg
      aria-hidden="true"
      className="size-4 shrink-0"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

// Envuelve el contenido en un enlace si hay destino; si no, en un bloque
// informativo (para los roles que no tienen acceso a esa pantalla).
function MaybeLink({
  children,
  className,
  href,
  linkClassName,
}: {
  children: ReactNode;
  className: string;
  href: string | null;
  linkClassName: string;
}) {
  if (!href) return <div className={className}>{children}</div>;
  return (
    <Link className={`${linkClassName} ${className}`} href={href}>
      {children}
    </Link>
  );
}

// Tarjeta numérica. Con `href` funciona como botón (toda el área es un enlace).
export function StatCard({
  detail,
  href,
  label,
  tone,
  value,
}: {
  detail?: string;
  href: string | null;
  label: string;
  tone: Tone;
  value: string;
}) {
  return (
    <MaybeLink
      className="flex items-center gap-4 p-5"
      href={href}
      linkClassName={linkCard}
    >
      <span
        className={`grid size-12 shrink-0 place-items-center rounded-xl text-xl font-bold ${toneClasses[tone]}`}
      >
        {value}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-text">{label}</span>
        {detail && (
          <span className="mt-0.5 block text-xs text-text-muted">{detail}</span>
        )}
      </span>
      {href && (
        <span className="text-text-muted">
          <Arrow />
        </span>
      )}
    </MaybeLink>
  );
}

export function NextEventCard({
  event,
  href,
  timezone,
}: {
  event: NextEventInfo | null;
  href: string | null;
  timezone: string;
}) {
  if (!event) {
    return (
      <div className={`${cardBase} p-5 text-sm text-text-muted`}>
        No hay eventos próximos.
      </div>
    );
  }

  const format = new Intl.DateTimeFormat("es", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: timezone,
  });
  const when =
    event.phase === "ongoing"
      ? "En curso"
      : event.daysUntil <= 1
        ? "Mañana o antes"
        : `En ${event.daysUntil} días`;

  return (
    <MaybeLink
      className="flex items-center gap-4 p-5"
      href={href}
      linkClassName={linkCard}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[11px] font-bold uppercase tracking-wider text-text-subtle">
          Evento más cercano · {event.is_online ? "Online" : "Presencial"}
        </span>
        <span className="mt-1 block text-lg font-bold text-text">
          {event.name}
        </span>
        <span className="mt-0.5 block text-xs text-text-muted">
          {format.format(new Date(event.starts_at))}
        </span>
      </span>
      <span
        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${
          event.phase === "ongoing"
            ? "bg-success-soft text-success"
            : "bg-gold-100 text-gold-800"
        }`}
      >
        {when}
      </span>
      {href && (
        <span className="text-text-muted">
          <Arrow />
        </span>
      )}
    </MaybeLink>
  );
}

export function ContentListPanel({
  emptyText,
  href,
  title,
  widget,
}: {
  emptyText: string;
  /** Sección de Mis tareas a la que lleva el panel (por ejemplo "/tareas#por-aprobar"). */
  href: string;
  title: string;
  widget: ContentWidget;
}) {
  return (
    <section className={cardBase}>
      <header className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold text-text">{title}</h2>
        <Link
          className="text-xs font-semibold text-primary hover:underline"
          href={href}
        >
          Ver todos ({widget.total})
        </Link>
      </header>
      {widget.items.length === 0 ? (
        <p className="px-5 py-6 text-sm text-text-muted">{emptyText}</p>
      ) : (
        <ul>
          {widget.items.map((item) => (
            <li
              className="border-t border-border first:border-t-0"
              key={item.id}
            >
              <Link
                className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted"
                href={href}
              >
                <span className="shrink-0 rounded-md bg-navy-50 px-2 py-1 text-[11px] font-bold text-primary">
                  {item.code}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-text">
                    {item.file_name}
                  </span>
                  <span className="block truncate text-xs text-text-muted">
                    {[
                      item.events?.name,
                      item.event_blocks?.name,
                      categoryLabels[item.content_category],
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-text-muted">
                  {formatDuration(item.duration_seconds)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function Meter({
  label,
  percent,
  state,
}: {
  label: string;
  percent: number;
  state: FillState;
}) {
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.min(percent, 100)}
      className="h-2 w-full overflow-hidden rounded-full bg-surface-muted"
      role="progressbar"
    >
      <div
        className={`h-full rounded-full ${fillBar[state]}`}
        style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
      />
    </div>
  );
}

function BlockRow({
  block,
  href,
}: {
  block: BlockProgressItem;
  href: string | null;
}) {
  return (
    <li className="border-t border-border first:border-t-0">
      <MaybeLink
        className="block px-5 py-3"
        href={href}
        linkClassName="hover:bg-surface-muted"
      >
        <span className="mb-2 flex items-center justify-between gap-3">
          <span className="min-w-0 truncate text-sm font-medium text-text">
            {block.name}
          </span>
          <span
            className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${fillBadge[block.state]}`}
          >
            {fillLabels[block.state]}
          </span>
        </span>
        <Meter label={block.name} percent={block.percent} state={block.state} />
        <span className="mt-1.5 block text-xs text-text-muted">
          {formatDuration(block.usedSeconds)} de{" "}
          {formatDuration(block.blockSeconds)} ({block.percent}%)
        </span>
      </MaybeLink>
    </li>
  );
}

export function ProgressPanel({
  href,
  progress,
  showEvent,
}: {
  /** Cronograma del evento; null para los roles sin acceso. */
  href: string | null;
  progress: EventProgress;
  showEvent: boolean;
}) {
  const eventPercent =
    progress.eventSeconds > 0
      ? Math.round((progress.contentSeconds / progress.eventSeconds) * 100)
      : 0;

  return (
    <section className={cardBase}>
      <header className="border-b border-border px-5 py-4">
        <h2 className="text-sm font-bold text-text">Progreso de bloques</h2>
        <p className="mt-0.5 text-xs text-text-muted">
          {progress.completeBlocks} de {progress.blocks.length} bloques
          completos · {progress.eventName}
        </p>
      </header>
      {showEvent && (
        <MaybeLink
          className="block px-5 py-4"
          href={href}
          linkClassName="hover:bg-surface-muted"
        >
          <span className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-text">
              Contenido sobre el evento
            </span>
            <span className="text-xs text-text-muted">{eventPercent}%</span>
          </span>
          <Meter
            label="Contenido sobre el evento"
            percent={eventPercent}
            state={eventPercent > 100 ? "over" : "incomplete"}
          />
          <span className="mt-1.5 block text-xs text-text-muted">
            Contenido {formatDuration(progress.contentSeconds)} · Bloques{" "}
            {formatDuration(progress.blocksSeconds)} · Evento{" "}
            {formatDuration(progress.eventSeconds)}
          </span>
        </MaybeLink>
      )}
      {progress.blocks.length === 0 ? (
        <p className="border-t border-border px-5 py-6 text-sm text-text-muted">
          Este evento todavía no tiene bloques.
        </p>
      ) : (
        <ul className={showEvent ? "border-t border-border" : ""}>
          {progress.blocks.map((block) => (
            <BlockRow block={block} href={href} key={block.id} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function Notice({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-text-muted">
      {children}
    </div>
  );
}