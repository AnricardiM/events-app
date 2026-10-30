"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import type { FormEvent } from "react";
import { createManagedUser, updateManagedUser } from "@/app/actions/users";
import {
  appRoles,
  getRoleConflict,
  roleLabels,
  validateRoleSet,
  type AppRole,
} from "@/lib/models/roles";
import type { ManagedProfile } from "@/lib/services/profiles";

type Notice = { message: string; type: "success" | "error" };

const labelClass =
  "grid gap-[7px] text-xs font-semibold text-text-muted";

const inputClass =
  "min-h-[42px] w-full rounded-lg border border-border bg-surface px-[11px] text-[13px] font-normal text-text placeholder:text-text-subtle focus-visible:border-primary read-only:bg-surface-muted read-only:text-text-subtle disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-text-subtle";

const noteClass =
  "rounded-lg bg-surface-muted px-3 py-[11px] text-[11px] leading-relaxed text-text-muted";

export function UserFormDialog({
  onClose,
  onPartialFailure,
  onSuccess,
  user,
}: {
  onClose: () => void;
  onPartialFailure: (message: string) => void;
  onSuccess: (message: string) => void;
  user: ManagedProfile | null;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedRoles, setSelectedRoles] = useState<AppRole[]>(
    user?.roles ?? [],
  );

  function toggleRole(role: AppRole, checked: boolean) {
    setSelectedRoles((current) =>
      checked ? [...current, role] : current.filter((item) => item !== role),
    );
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) {
      dialog.showModal();
    }
  }, []);

  // No se puede cerrar mientras se guarda, para no perder el resultado.
  function requestClose() {
    if (!isPending) onClose();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);

    // Misma validación que el servidor, para dar el error sin viaje de red.
    const rolesError = validateRoleSet(selectedRoles);
    if (rolesError) {
      setNotice({ message: rolesError, type: "error" });
      return;
    }

    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = user
        ? await updateManagedUser(user.id, formData)
        : await createManagedUser(formData);

      setNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
      if (result.changed && !result.success) {
        onPartialFailure(result.message);
      }
      if (result.success) onSuccess(result.message);
    });
  }

  return (
    <dialog
      aria-labelledby="user-form-title"
      // m-auto es necesario: el reset de Tailwind quita el margin que centra el <dialog>.
      className="m-auto max-h-[min(90vh,780px)] w-[min(calc(100%-32px),560px)] overflow-auto overscroll-contain rounded-2xl border border-border bg-surface p-0 text-text shadow-[0_18px_70px_rgb(12_12_35/24%)] backdrop:bg-navy-950/50 backdrop:backdrop-blur-[2px]"
      onCancel={(event) => {
        event.preventDefault();
        requestClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) requestClose();
      }}
      onClose={onClose}
      ref={dialogRef}
    >
      <div className="p-[26px] max-sm:p-5">
        <div className="mb-[22px] flex items-start justify-between gap-4">
          <div>
            <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
              {user ? "PERFIL DE USUARIO" : "NUEVO PERFIL"}
            </p>
            <h2
              className="text-[22px] font-bold text-text"
              id="user-form-title"
            >
              {user ? "Editar usuario" : "Crear usuario"}
            </h2>
          </div>
          <button
            aria-label="Cerrar formulario"
            className="grid size-[34px] flex-none cursor-pointer place-items-center rounded-lg bg-primary-soft text-[23px] leading-none text-text-muted hover:text-primary"
            onClick={requestClose}
            type="button"
          >
            ×
          </button>
        </div>

        <form className="grid gap-[17px]" onSubmit={handleSubmit}>
          <label className={labelClass}>
            Nombre completo
            <input
              autoComplete="name"
              className={inputClass}
              defaultValue={user?.full_name ?? ""}
              disabled={isPending}
              name={user ? undefined : "full_name"}
              placeholder="Nombre y apellido"
              readOnly={Boolean(user)}
              required={!user}
            />
          </label>
          <label className={labelClass}>
            Correo electrónico
            <input
              autoComplete="email"
              className={inputClass}
              defaultValue={user?.email ?? ""}
              disabled={isPending}
              name={user ? undefined : "email"}
              placeholder="usuario@correo.com"
              readOnly={Boolean(user)}
              required={!user}
              type="email"
            />
          </label>

          {!user && (
            <>
              <label className={labelClass}>
                Contraseña inicial
                <input
                  autoComplete="new-password"
                  className={inputClass}
                  disabled={isPending}
                  maxLength={128}
                  minLength={8}
                  name="password"
                  placeholder="Mínimo 8 caracteres"
                  required
                  type="password"
                />
              </label>
              <p className={noteClass} role="note">
                La cuenta se crea confirmada sin enviar verificación de correo.
                Comparte la contraseña inicial con la persona por un canal
                seguro.
              </p>
            </>
          )}

          <fieldset className="m-0 min-w-0 border-0 p-0">
            <legend className="mb-[9px] text-xs font-semibold text-text-muted">
              Roles
            </legend>
            <div className="grid grid-cols-2 gap-2 max-[420px]:grid-cols-1">
              {appRoles.map((role) => {
                const checked = selectedRoles.includes(role);
                const conflict = checked
                  ? null
                  : getRoleConflict(role, selectedRoles);

                return (
                  <label
                    className="flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-border px-2.5 text-xs text-text-muted has-checked:border-primary has-checked:bg-primary-soft has-checked:text-primary-soft-text has-disabled:cursor-not-allowed has-disabled:opacity-60"
                    key={role}
                    title={conflict ?? undefined}
                  >
                    <input
                      checked={checked}
                      className="accent-primary"
                      disabled={isPending || conflict !== null}
                      name="roles"
                      onChange={(event) =>
                        toggleRole(role, event.target.checked)
                      }
                      type="checkbox"
                      value={role}
                    />
                    <span>{roleLabels[role]}</span>
                  </label>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] leading-normal text-text-subtle">
              Asigna al menos un rol al guardar. Editor es exclusivo y no se
              combina con otros roles; Administrador no se combina con
              Programador.
            </p>
          </fieldset>

          <label className="flex items-center gap-[9px] text-xs font-semibold text-text-muted">
            <input
              className="accent-primary"
              defaultChecked={user?.is_active ?? false}
              disabled={isPending}
              name="is_active"
              type="checkbox"
              value="true"
            />
            <span>Usuario activo</span>
          </label>

          {user && (
            <p className={noteClass} role="note">
              El nombre y correo se muestran solo para consulta: las políticas
              actuales no permiten modificarlos desde este módulo.
            </p>
          )}

          {notice && (
            <p
              aria-live="polite"
              className={`rounded-[7px] px-[11px] py-[9px] text-[11px] leading-normal ${
                notice.type === "success"
                  ? "bg-success-soft text-success"
                  : "bg-danger-soft text-danger"
              }`}
              role={notice.type === "success" ? "status" : "alert"}
            >
              {notice.message}
            </p>
          )}

          <div className="flex justify-end gap-[9px]">
            <button
              className="min-h-10 cursor-pointer rounded-lg border border-border bg-surface px-[15px] text-xs font-semibold text-text-muted hover:border-border-strong hover:text-text disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              onClick={requestClose}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="min-h-10 cursor-pointer rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isPending}
              type="submit"
            >
              {isPending
                ? "Guardando..."
                : user
                  ? "Guardar roles y estado"
                  : "Crear usuario"}
            </button>
          </div>
        </form>
      </div>
    </dialog>
  );
}