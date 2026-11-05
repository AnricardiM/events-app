"use client";

import { useMemo, useState, useTransition } from "react";
import { setManagedUserActive } from "@/app/actions/users";
import { appRoles, roleLabels, type AppRole } from "@/lib/models/roles";
import type { ManagedProfile } from "@/lib/services/profiles";
import { UserFormDialog } from "./user-form-dialog";
import { Icon } from "../ui/icon";

// Record<AppRole, ...> obliga a definir estilo para cada rol nuevo.
const roleStyles: Record<AppRole, string> = {
  admin: "bg-primary text-on-primary",
  revisor: "bg-navy-100 text-navy-800",
  editor: "bg-gold-100 text-gold-800",
  programador: "bg-navy-50 text-navy-700 ring-1 ring-navy-200",
  ingresador: "bg-gold-50 text-gold-700 ring-1 ring-gold-200",
};

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "medium" });

type Notice = { message: string; type: "success" | "error" };
type StatusFilter = "all" | "active" | "inactive";

const primaryButton =
  "inline-flex min-h-[42px] cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:bg-primary-hover";

const fieldControl =
  "h-[42px] w-full rounded-lg border border-border bg-surface text-[13px] text-text focus-visible:border-primary";

// En móvil los botones de fila son cuadrados de 40px (solo icono).
const rowButton =
  "inline-flex min-h-[30px] cursor-pointer items-center justify-center whitespace-nowrap rounded-[7px] border border-border bg-surface px-[9px] text-[11px] text-text-muted hover:enabled:border-navy-300 hover:enabled:text-primary disabled:cursor-not-allowed disabled:opacity-55 max-md:size-10 max-md:min-h-0 max-md:px-0";

const cell =
  "min-w-0 align-middle text-xs md:border-t md:border-border md:px-4 md:py-3 md:first:pl-[22px] md:last:pr-[22px]";

export function UsersManagement({ users }: { users: ManagedProfile[] }) {
  const [notice, setNotice] = useState<Notice | null>(null);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<AppRole | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [editingUser, setEditingUser] = useState<ManagedProfile | "new" | null>(
    null,
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        (user.full_name ?? "").toLowerCase().includes(normalizedQuery) ||
        user.email.toLowerCase().includes(normalizedQuery);
      const matchesRole =
        roleFilter === "all" || user.roles.includes(roleFilter);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? user.is_active : !user.is_active);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, statusFilter, users]);

  function resetFilters() {
    setQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)]">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-7 flex items-center justify-between gap-6 max-sm:flex-col max-sm:items-start max-sm:gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              ADMINISTRACIÓN
            </p>
            <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
              Gestión de usuarios
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-text-muted">
              Consulta los perfiles, roles y estados de acceso de tu equipo.
            </p>
          </div>
          <button
            aria-haspopup="dialog"
            className={`${primaryButton} max-sm:w-full`}
            onClick={() => setEditingUser("new")}
            type="button"
          >
            <span aria-hidden="true" className="text-[19px] leading-none">
              +
            </span>
            Crear usuario
          </button>
        </header>

        <section
          aria-label="Filtros de usuarios"
          className="mb-5 flex flex-wrap items-end gap-3.5 rounded-xl border border-border bg-surface p-4 max-sm:p-3"
        >
          <label className="relative min-w-[200px] flex-1 max-md:basis-full">
            <span
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 flex -translate-y-1/2 text-text-subtle"
            >
              <svg
                fill="none"
                height="18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.8"
                viewBox="0 0 24 24"
                width="18"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-4-4" />
              </svg>
            </span>
            <span className="sr-only">Buscar por nombre o correo</span>
            <input
              className={`${fieldControl} pl-[38px] pr-3 placeholder:text-text-subtle`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre o correo"
              type="search"
              value={query}
            />
          </label>

          {/* En pantallas muy angostas cada filtro ocupa su propia fila, para que el texto no se corte. */}
          <label className="grid min-w-[155px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1 max-md:text-xs max-sm:basis-full">
            <span>Rol</span>
            <select
              className={`${fieldControl} pl-[11px] pr-[30px]`}
              onChange={(event) =>
                setRoleFilter(event.target.value as AppRole | "all")
              }
              value={roleFilter}
            >
              <option value="all">Todos los roles</option>
              {appRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabels[role]}
                </option>
              ))}
            </select>
          </label>

          <label className="grid min-w-[155px] gap-1.5 text-[11px] font-semibold text-text-muted max-md:min-w-0 max-md:flex-1 max-md:text-xs max-sm:basis-full">
            <span>Estado</span>
            <select
              className={`${fieldControl} pl-[11px] pr-[30px]`}
              onChange={(event) =>
                setStatusFilter(event.target.value as StatusFilter)
              }
              value={statusFilter}
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </select>
          </label>
        </section>

        <section
          aria-label="Listado de usuarios"
          className="overflow-hidden rounded-2xl border border-border bg-surface shadow-sm"
        >
          {notice && <NoticeBanner className="mx-[18px] mt-3.5" notice={notice} />}

          <div className="flex min-h-[68px] items-center justify-between gap-4 border-b border-border px-[22px] max-sm:min-h-[60px] max-sm:px-4">
            <h2 className="text-[15px] font-semibold text-text max-md:text-base">
              Usuarios
            </h2>
            <p className="text-xs text-text-muted max-md:text-sm">
              {filteredUsers.length} de {users.length}{" "}
              {users.length === 1 ? "usuario" : "usuarios"}
            </p>
          </div>

          {users.length === 0 ? (
            <EmptyState
              icon={
                <svg
                  fill="none"
                  height="26"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                  viewBox="0 0 24 24"
                  width="26"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 8v6M23 11h-6" />
                </svg>
              }
              text="Cuando existan perfiles, aparecerán en esta lista."
              title="Aún no hay usuarios"
            />
          ) : filteredUsers.length === 0 ? (
            <EmptyState
              text="Prueba cambiando el texto o los filtros seleccionados."
              title="No encontramos coincidencias"
            >
              <button
                className={`${primaryButton} mt-3.5 min-h-[34px] px-3 text-[11px]`}
                onClick={resetFilters}
                type="button"
              >
                Limpiar filtros
              </button>
            </EmptyState>
          ) : (
            // Un solo render: tabla en desktop, tarjetas en móvil (max-md).
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left max-md:block">
                <thead className="max-md:sr-only">
                  <tr>
                    {["Usuario", "Rol", "Estado", "Alta"].map((label) => (
                      <th
                        className="h-11 bg-surface-muted px-4 text-left text-[10px] font-bold uppercase tracking-wider text-text-subtle first:pl-[22px]"
                        key={label}
                        scope="col"
                      >
                        {label}
                      </th>
                    ))}
                    <th
                      className="h-11 bg-surface-muted px-4 pr-[22px] text-left"
                      scope="col"
                    >
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="max-md:block">
                  {filteredUsers.map((user) => (
                    // Móvil: fila 1 = rol (izquierda) y estado (derecha);
                    // fila 2 = identidad (izquierda) y acciones (derecha).
                    // El orden visual se define con `order`, el DOM no cambia.
                    <tr
                      className="max-md:grid max-md:grid-cols-[minmax(0,1fr)_auto] max-md:items-center max-md:gap-x-3 max-md:gap-y-3.5 max-md:border-t max-md:border-border max-md:px-4 max-md:py-4"
                      key={user.id}
                    >
                      <td className={`${cell} max-md:order-2 max-md:col-start-1`}>
                        <UserIdentity user={user} />
                      </td>
                      <td className={`${cell} max-md:order-1 max-md:col-start-1`}>
                        <RoleBadges roles={user.roles} />
                      </td>
                      <td
                        className={`${cell} max-md:order-1 max-md:col-start-2 max-md:justify-self-end`}
                      >
                        <StatusBadge isActive={user.is_active} />
                      </td>
                      {/* La fecha de alta no se muestra en móvil. */}
                      <td
                        className={`${cell} whitespace-nowrap text-[11px] text-text-subtle max-md:hidden`}
                      >
                        {dateFormatter.format(new Date(user.created_at))}
                      </td>
                      <td className={`${cell} max-md:order-2 max-md:col-start-2`}>
                        <UserActions
                          isActive={user.is_active}
                          onManage={() => setEditingUser(user)}
                          onNotice={setNotice}
                          userEmail={user.email}
                          userId={user.id}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      {editingUser && (
        <UserFormDialog
          user={editingUser === "new" ? null : editingUser}
          onClose={() => setEditingUser(null)}
          onPartialFailure={(message) => {
            setNotice({ message, type: "error" });
            setEditingUser(null);
          }}
          onSuccess={(message) => {
            setNotice({ message, type: "success" });
            setEditingUser(null);
          }}
        />
      )}
    </section>
  );
}

function NoticeBanner({
  className = "",
  notice,
}: {
  className?: string;
  notice: Notice;
}) {
  const isError = notice.type === "error";

  return (
    <p
      aria-live="polite"
      className={`rounded-[7px] px-[11px] py-[9px] text-[11px] leading-normal max-md:text-xs ${
        isError ? "bg-danger-soft text-danger" : "bg-success-soft text-success"
      } ${className}`}
      role={isError ? "alert" : "status"}
    >
      {notice.message}
    </p>
  );
}

function EmptyState({
  children,
  icon,
  text,
  title,
}: {
  children?: React.ReactNode;
  icon?: React.ReactNode;
  text: string;
  title: string;
}) {
  return (
    <div className="grid min-h-[230px] content-center justify-items-center p-7 text-center">
      {icon && (
        <span
          aria-hidden="true"
          className="mb-3 grid size-[50px] place-items-center rounded-[14px] bg-primary-soft text-primary"
        >
          {icon}
        </span>
      )}
      <h3 className="text-sm font-semibold text-text">{title}</h3>
      <p className="mt-2 text-xs leading-relaxed text-text-muted max-md:text-sm">
        {text}
      </p>
      {children}
    </div>
  );
}

function UserIdentity({ user }: { user: ManagedProfile }) {
  const displayName = user.full_name?.trim() || "Sin nombre";

  return (
    <div className="flex min-w-[175px] items-center gap-3 max-md:min-w-0">
      <span
        aria-hidden="true"
        className="grid size-[38px] flex-none place-items-center rounded-full bg-primary-soft text-xs font-bold text-primary-soft-text"
      >
        {getInitials(displayName)}
      </span>
      <span className="grid min-w-0 gap-1">
        <strong className="max-w-[260px] truncate text-xs font-semibold text-text max-md:max-w-full max-md:text-sm">
          {displayName}
        </strong>
        <span className="max-w-[260px] truncate text-[11px] text-text-subtle max-md:max-w-full max-md:text-xs">
          {user.email}
        </span>
      </span>
    </div>
  );
}

function RoleBadges({ roles }: { roles: AppRole[] }) {
  if (roles.length === 0) {
    return (
      <span className="text-[11px] text-text-subtle max-md:text-xs">
        Sin rol asignado
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1.5">
      {roles.map((role) => (
        <span
          className={`inline-flex min-h-6 items-center whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold max-md:min-h-7 max-md:px-3 max-md:text-xs ${roleStyles[role]}`}
          key={role}
        >
          {roleLabels[role]}
        </span>
      ))}
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex min-h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-[9px] text-[10px] font-semibold max-md:min-h-7 max-md:px-3 max-md:text-xs ${
        isActive
          ? "bg-success-soft text-success"
          : "bg-surface-muted text-text-subtle ring-1 ring-border"
      }`}
    >
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {isActive ? "Activo" : "Inactivo"}
    </span>
  );
}


function UserActions({
  isActive,
  onManage,
  onNotice,
  userEmail,
  userId,
}: {
  isActive: boolean;
  onManage: () => void;
  onNotice: (notice: Notice) => void;
  userEmail: string;
  userId: string;
}) {
  const [isPending, startTransition] = useTransition();

  function handleStatusChange() {
    if (
      isActive &&
      !window.confirm(
        `¿Desactivar a ${userEmail}? No podrá iniciar sesión mientras esté inactivo.`,
      )
    ) {
      return;
    }

    startTransition(async () => {
      const result = await setManagedUserActive(userId, !isActive);
      onNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
      // Sin router.refresh(): la acción ya hace revalidatePath("/usuarios").
    });
  }

  const statusLabel = `${isActive ? "Desactivar" : "Activar"} a ${userEmail}`;

  return (
    <div
      aria-label="Acciones de usuario"
      className="flex justify-end gap-[7px] max-md:gap-2"
      role="group"
    >
      <button
        aria-label={`Administrar roles y estado de ${userEmail}`}
        className={rowButton}
        disabled={isPending}
        onClick={onManage}
        type="button"
      >
       <Icon name="edit" />
      </button>
      <button
        aria-label={statusLabel}
        className={`${rowButton} ${
          isActive
            ? "border-danger/30 text-danger hover:enabled:border-danger hover:enabled:text-danger"
            : ""
        }`}
        disabled={isPending}
        onClick={handleStatusChange}
        title={isActive ? "Desactivar" : "Activar"}
        type="button"
      >
        {/* Escritorio: texto. Móvil: solo icono, para ocupar menos espacio. */}
        <span className="max-md:hidden">
          {isPending ? "Procesando..." : isActive ? "Desactivar" : "Activar"}
        </span>
        <span className="md:hidden">
           <Icon name="power" />
        </span>
      </button>
    </div>
  );
}

function getInitials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean);
  const characters =
    words.length > 1
      ? [Array.from(words[0])[0], Array.from(words[words.length - 1])[0]]
      : [Array.from(words[0] ?? "")[0]];

  return characters.join("").toLocaleUpperCase() || "?";
}