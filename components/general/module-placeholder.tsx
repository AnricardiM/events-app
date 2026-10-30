import Link from "next/link";

export function ModulePlaceholder({
  description,
  title,
}: {
  description: string;
  title: string;
}) {
  return (
    <section aria-labelledby="module-title" className="module-placeholder">
        <p className="eyebrow">EVENTS</p>
        <h1 id="module-title">{title}</h1>
        <p>{description}</p>
        <Link href="/dashboard">Volver al dashboard</Link>
    </section>
  );
}
