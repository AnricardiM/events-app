// lib/models/roles.ts
// Fuente única de verdad de los roles para TypeScript (UI y Server Actions).
// Sin "use server" ni "use client": es código puro, importable desde ambos lados.
// La base de datos sigue siendo la autoridad final: estas reglas la reflejan
// para dar errores claros y deshabilitar opciones inválidas en el formulario.

export const appRoles = [
  "admin",
  "revisor",
  "editor",
  "programador",
  "ingresador",
] as const;

export type AppRole = (typeof appRoles)[number];

export const roleLabels: Record<AppRole, string> = {
  admin: "Administrador",
  revisor: "Revisor",
  editor: "Editor",
  programador: "Programador",
  ingresador: "Ingresador",
};

/** Roles que no se pueden combinar con ningún otro. */
const exclusiveRoles: readonly AppRole[] = ["editor"];

/** Pares de roles incompatibles entre sí. */
const incompatiblePairs: readonly (readonly [AppRole, AppRole])[] = [
  ["admin", "programador"],
];

const roleSet: ReadonlySet<string> = new Set(appRoles);

export function isAppRole(value: unknown): value is AppRole {
  return typeof value === "string" && roleSet.has(value);
}

/** Valida un conjunto completo de roles. Devuelve el mensaje de error o null. */
export function validateRoleSet(roles: readonly AppRole[]): string | null {
  if (roles.length === 0) return "Asigna al menos un rol al usuario.";

  for (const role of exclusiveRoles) {
    if (roles.includes(role) && roles.length > 1) {
      return `El rol ${roleLabels[role]} no se puede combinar con otros roles.`;
    }
  }

  for (const [a, b] of incompatiblePairs) {
    if (roles.includes(a) && roles.includes(b)) {
      return `Los roles ${roleLabels[a]} y ${roleLabels[b]} son incompatibles.`;
    }
  }

  return null;
}

/**
 * Indica por qué `role` no se puede agregar a la selección actual
 * (devuelve null si se puede). Sirve para deshabilitar checkboxes en la UI.
 * Un rol ya seleccionado nunca se bloquea: siempre se puede quitar.
 */
export function getRoleConflict(
  role: AppRole,
  selected: readonly AppRole[],
): string | null {
  const others = selected.filter((current) => current !== role);
  if (others.length === 0) return null;

  if (exclusiveRoles.includes(role)) {
    return `${roleLabels[role]} no se combina con otros roles.`;
  }

  const exclusiveInSelection = others.find((other) =>
    exclusiveRoles.includes(other),
  );
  if (exclusiveInSelection) {
    return `${roleLabels[exclusiveInSelection]} es exclusivo.`;
  }

  for (const [a, b] of incompatiblePairs) {
    if (role === a && others.includes(b)) {
      return `Incompatible con ${roleLabels[b]}.`;
    }
    if (role === b && others.includes(a)) {
      return `Incompatible con ${roleLabels[a]}.`;
    }
  }

  return null;
}

export async function getUserRoles(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId);

  if (error) return { data: [] as AppRole[], error };

  return {
    data: (data ?? []).map((row) => row.role).filter(isAppRole),
    error: null,
  };
}