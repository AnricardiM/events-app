import Link from "next/link";

// Marca compartida por el login y la barra superior del workspace.
export function Brand({ href }: { href: string }) {
  return (
    <Link
      aria-label="Events, inicio"
      className="inline-flex w-fit items-center gap-2.5 text-xl font-bold tracking-[-0.04em] text-text no-underline max-[520px]:gap-[7px] max-[520px]:text-lg"
      href={href}
    >
      <span
        aria-hidden="true"
        className="grid size-[34px] place-items-center rounded-[11px] bg-primary font-serif text-2xl italic leading-none text-on-primary max-[520px]:size-[31px] max-[520px]:text-[22px]"
      >
        e
      </span>
      <span>events</span>
    </Link>
  );
}