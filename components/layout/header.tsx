"use client";

import Image from "next/image";
import { logout } from "@/app/actions/auth";
import { Brand } from "../ui/brand";
import { Icon } from "../ui/icon";

const iconButton =
  "relative grid size-10 flex-none cursor-pointer place-items-center rounded-[10px] text-text-muted hover:bg-primary-soft hover:text-primary";

const avatarClass =
  "size-10 flex-none rounded-full border border-navy-900/10 object-cover max-[520px]:size-9";

export function Header({
  avatarUrl,
  fullName,
  initials,
  isSidebarOpen,
  onToggleSidebar,
}: {
  avatarUrl: string | null;
  fullName: string;
  initials: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}) {
  return (
    <header className="fixed inset-x-0 top-0 z-30 flex h-[var(--dashboard-header-height)] items-center justify-between gap-5 border-b border-border bg-surface px-7 max-md:px-3.5">
      <div className="flex items-center gap-[18px] max-md:gap-2.5">
        <button
          aria-controls="workspace-sidebar"
          aria-expanded={isSidebarOpen}
          aria-label={isSidebarOpen ? "Cerrar menú" : "Abrir menú"}
          className={iconButton}
          onClick={onToggleSidebar}
          type="button"
        >
          <Icon name="menu" />
        </button>
        <Brand href="/dashboard" />
      </div>

      <div className="flex items-center gap-[22px] max-md:gap-2 max-[520px]:gap-1">
        <button aria-label="Notificaciones" className={iconButton} type="button">
          <Icon className="size-[21px]" name="bell" />
          <span
            aria-hidden="true"
            className="absolute right-2 top-2 size-[7px] rounded-full border border-surface bg-danger"
          />
        </button>

        <div className="flex min-w-0 items-center gap-2.5">
          {avatarUrl ? (
            <Image
              alt={`Avatar de ${fullName}`}
              className={avatarClass}
              height={40}
              src={avatarUrl}
              unoptimized
              width={40}
            />
          ) : (
            <svg
              aria-label={`Avatar de ${fullName}`}
              className={avatarClass}
              role="img"
              viewBox="0 0 44 44"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle className="fill-primary-soft" cx="22" cy="22" r="22" />
              <text
                className="fill-primary text-sm font-bold"
                dominantBaseline="central"
                textAnchor="middle"
                x="22"
                y="22"
              >
                {initials}
              </text>
            </svg>
          )}
          <span className="max-w-[180px] truncate text-[13px] font-semibold text-text max-md:hidden">
            {fullName}
          </span>
        </div>

        {/* En móvil el cierre de sesión está dentro del menú lateral. */}
        <form action={logout} className="max-md:hidden">
          <button
            className="cursor-pointer whitespace-nowrap rounded-lg border border-border bg-surface px-3 py-[9px] text-xs text-text-muted hover:border-border-strong hover:text-primary"
            type="submit"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </header>
  );
}