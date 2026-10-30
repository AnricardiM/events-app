"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import type { ReactNode } from "react";
import type { VisibleNavItem } from "@/lib/navigation.ts";
import { SIDEBAR_COOKIE } from "@/lib/sidebar-cookie";
import { Header } from "./header";
import { Sidebar } from "./sidebar";

const WorkspaceProfileContext = createContext("");

// Mismo corte que `md` de Tailwind (768px), para que CSS y JS coincidan.
const MOBILE_QUERY = "(max-width: 767.98px)";

function subscribeToViewport(onChange: () => void) {
  const mediaQuery = window.matchMedia(MOBILE_QUERY);
  mediaQuery.addEventListener("change", onChange);
  return () => mediaQuery.removeEventListener("change", onChange);
}

function useIsMobile() {
  return useSyncExternalStore(
    subscribeToViewport,
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false,
  );
}

export function WorkspaceShell({
  avatarUrl,
  children,
  defaultSidebarOpen,
  fullName,
  initials,
  navigation,
  profileError,
}: {
  avatarUrl: string | null;
  children: ReactNode;
  defaultSidebarOpen: boolean;
  fullName: string;
  initials: string;
  navigation: VisibleNavItem[];
  profileError: boolean;
}) {
  // Escritorio: expandido/colapsado, recordado en una cookie que el servidor
  // lee antes de renderizar (no hay parpadeo ni localStorage).
  const [isSidebarOpen, setIsSidebarOpen] = useState(defaultSidebarOpen);
  // Móvil: el panel superpuesto siempre empieza cerrado y no se recuerda.
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const isMobile = useIsMobile();

  const drawerOpen = isMobile && isDrawerOpen;
  const menuOpen = isMobile ? drawerOpen : isSidebarOpen;

  useEffect(() => {
    if (!drawerOpen) return;

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsDrawerOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [drawerOpen]);

  function toggleMenu() {
    if (isMobile) {
      setIsDrawerOpen((open) => !open);
      return;
    }

    const next = !isSidebarOpen;
    setIsSidebarOpen(next);
    document.cookie = `${SIDEBAR_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`;
  }

  function closeDrawer() {
    setIsDrawerOpen(false);
  }

  return (
    <div
      className="group min-h-screen bg-background [--dashboard-header-height:72px] [--dashboard-sidebar-collapsed:76px] [--dashboard-sidebar-width:248px] max-[520px]:[--dashboard-header-height:64px]"
      data-drawer={drawerOpen ? "open" : "closed"}
      data-sidebar={isSidebarOpen ? "open" : "closed"}
    >
      <Header
        avatarUrl={avatarUrl}
        fullName={fullName}
        initials={initials}
        isSidebarOpen={menuOpen}
        onToggleSidebar={toggleMenu}
      />
      {drawerOpen && (
        <button
          aria-label="Cerrar menú"
          className="fixed inset-x-0 bottom-0 top-[var(--dashboard-header-height)] z-40 cursor-pointer border-0 bg-navy-950/45 md:hidden"
          onClick={closeDrawer}
          type="button"
        />
      )}
      <Sidebar items={navigation} onNavigate={closeDrawer} />
      <WorkspaceProfileContext.Provider value={fullName}>
        <main className="min-h-screen px-3.5 pb-9 pt-[calc(var(--dashboard-header-height)+30px)] min-[520px]:px-[18px] md:ml-[var(--dashboard-sidebar-width)] md:px-10 md:pb-14 md:pt-[calc(var(--dashboard-header-height)+44px)] md:transition-[margin-left] md:duration-300 md:group-data-[sidebar=closed]:ml-[var(--dashboard-sidebar-collapsed)]">
          {profileError && (
            <p
              className="mb-6 rounded-[7px] bg-primary-soft px-3 py-[11px] text-xs leading-normal text-primary"
              role="status"
            >
              No se pudo cargar tu perfil. Verifica la tabla profiles y sus
              políticas de acceso en Supabase.
            </p>
          )}
          {children}
        </main>
      </WorkspaceProfileContext.Provider>
    </div>
  );
}

export function useWorkspaceProfile() {
  return useContext(WorkspaceProfileContext);
}