"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "@/app/actions/auth";
import type { VisibleNavItem } from "@/lib/navigation.ts";
import { Icon } from "../ui/icon";

const linkBase =
  "flex min-h-12 w-full items-center gap-3.5 overflow-hidden whitespace-nowrap rounded-[10px] px-3.5 text-left no-underline transition-colors hover:bg-primary-soft hover:text-primary md:group-data-[sidebar=closed]:justify-center md:group-data-[sidebar=closed]:px-0";

const linkIdle = "text-text-muted";
const linkActive = "bg-primary-soft font-semibold text-primary-soft-text";

function isActivePath(pathname: string, url: string) {
  return pathname === url || pathname.startsWith(`${url}/`);
}

export function Sidebar({
  items,
  onNavigate,
}: {
  items: VisibleNavItem[];
  onNavigate: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      aria-label="Menú principal"
      className="fixed bottom-0 left-0 top-[var(--dashboard-header-height)] z-20 overflow-y-auto overflow-x-hidden border-r border-border bg-surface px-3.5 py-6 transition-[width,transform,visibility] duration-300 max-md:invisible max-md:z-[45] max-md:w-[min(290px,84vw)] max-md:-translate-x-[105%] max-md:px-4 max-md:shadow-[8px_0_28px_rgb(10_10_30/10%)] max-md:group-data-[drawer=open]:visible max-md:group-data-[drawer=open]:translate-x-0 md:w-[var(--dashboard-sidebar-width)] md:group-data-[sidebar=closed]:w-[var(--dashboard-sidebar-collapsed)] md:group-data-[sidebar=closed]:px-3"
      id="workspace-sidebar"
    >
      <nav>
        <ul className="grid gap-2">
          {items.map((item) => {
            const isActive = isActivePath(pathname, item.url);

            return (
              <li key={item.id}>
                <Link
                  aria-current={isActive ? "page" : undefined}
                  className={`${linkBase} ${isActive ? linkActive : linkIdle}`}
                  href={item.url}
                  onClick={onNavigate}
                  title={item.label}
                >
                  <Icon className="size-[21px] flex-none" name={item.icon} />
                  <span className="overflow-hidden transition-opacity md:group-data-[sidebar=closed]:w-0 md:group-data-[sidebar=closed]:opacity-0">
                    {item.label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Solo móvil: en escritorio el botón está en la barra superior. */}
      <form action={logout} className="mt-6 border-t border-border pt-4 md:hidden">
        <button
          className={`${linkBase} ${linkIdle} cursor-pointer`}
          type="submit"
        >
          Cerrar sesión
        </button>
      </form>
    </aside>
  );
}