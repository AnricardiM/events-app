// lib/navigation.ts
// Configuración del menú principal. Es solo UX: ocultar un ítem NO protege la ruta.
// Cada página y cada Server Action deben seguir validando permisos en el servidor.

import type { IconName } from "@/components/ui/icon";
import type { AppRole } from "@/lib/models/roles";

export type NavItem = {
  id: string;
  label: string;
  icon: IconName;
  url: string;
  /** Si se omite, el ítem lo ve cualquier usuario activo. */
  roles?: readonly AppRole[];
};

/** Lo que recibe la UI: sin `roles`, ya filtrado para este usuario. */
export type VisibleNavItem = Omit<NavItem, "roles">;

const navigation: readonly NavItem[] = [
  { id: "inicio", label: "Inicio", icon: "home", url: "/dashboard" },
  { id: "tareas", label: "Mis tareas", icon: "clipboard", url: "/tareas" },
  { id: "usuarios", label: "Usuarios", icon: "user", url: "/usuarios", roles: ["admin"] },
  { id: "eventos", label: "Eventos", icon: "calendar", url: "/eventos" },
  { id: "contenidos", label: "Recepcion", icon: "inbox", url: "/contenidos" },
  { id: "administracion", label: "Administración", icon: "settings", url: "/administracion" },
  
];

export function getVisibleNavigation(
  userRoles: readonly AppRole[],
): VisibleNavItem[] {
  return navigation
    .filter(
      ({ roles }) => !roles || roles.some((role) => userRoles.includes(role)),
    )
    .map(({ id, label, icon, url }) => ({ id, label, icon, url }));
}