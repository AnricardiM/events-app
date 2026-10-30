import { Icon, IconName } from "./icon";

export type StatTone = "primary" | "gold" | "danger" | "success";

// Clases completas y estáticas: Tailwind no detecta nombres armados con
// plantillas como `bg-${tone}`, por eso se usa un mapa.
const toneStyles: Record<StatTone, string> = {
  primary: "bg-primary-soft text-primary",
  gold: "bg-gold-100 text-gold-700",
  danger: "bg-danger-soft text-danger",
  success: "bg-success-soft text-success",
};

export function StatCard({
  icon,
  id,
  subtitle,
  title,
  tone,
  value,
}: {
  icon: IconName;
  id: string;
  subtitle: string;
  title: string;
  tone: StatTone;
  value: string;
}) {
  return (
    <article
      aria-labelledby={`stat-${id}`}
      className="min-h-[190px] rounded-[14px] border border-border bg-surface px-6 py-[22px] shadow-sm max-md:min-h-0 max-md:px-5 max-md:py-[18px]"
    >
      <span
        className={`grid size-[42px] place-items-center rounded-xl ${toneStyles[tone]}`}
      >
        <Icon name={icon} />
      </span>
      <p className="mb-1 mt-3.5 text-[29px] font-bold tracking-tight text-text max-sm:text-[26px]">
        {value}
      </p>
      <h2 className="text-sm font-semibold text-text" id={`stat-${id}`}>
        {title}
      </h2>
      <p className="mt-[5px] text-xs text-text-muted">{subtitle}</p>
    </article>
  );
}