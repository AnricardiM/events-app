"use client";

import { useActionState } from "react";
import { login, type LoginState } from "@/app/actions/auth";

const initialState: LoginState = {};

const labelClass = "mt-2 text-xs font-semibold text-text";

const inputClass =
  "min-h-[49px] w-full rounded-lg border border-border bg-surface px-3.5 text-[13px] text-text placeholder:text-text-subtle focus-visible:border-primary";

export default function LoginForm() {
  const [state, formAction, isPending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-2.5">
      <label className={labelClass} htmlFor="email">
        Correo electrónico
      </label>
      <input
        autoComplete="email"
        className={inputClass}
        id="email"
        name="email"
        placeholder="tu@correo.com"
        required
        type="email"
      />

      <label className={labelClass} htmlFor="password">
        Contraseña
      </label>
      <input
        autoComplete="current-password"
        className={inputClass}
        id="password"
        name="password"
        placeholder="Ingresa tu contraseña"
        required
        type="password"
      />

      {state.error && (
        <p
          aria-live="polite"
          className="mt-2.5 rounded-[7px] bg-danger-soft px-3 py-[11px] text-xs leading-normal text-danger"
          role="alert"
        >
          {state.error}
        </p>
      )}

      <button
        className="mt-3.5 flex min-h-[50px] cursor-pointer items-center justify-center gap-2.5 rounded-lg bg-primary text-[13px] font-semibold text-on-primary transition hover:enabled:-translate-y-px hover:enabled:bg-primary-hover disabled:cursor-wait disabled:opacity-75"
        disabled={isPending}
        type="submit"
      >
        {isPending ? "Ingresando..." : "Iniciar sesión"}
        {!isPending && <span aria-hidden="true">→</span>}
      </button>
    </form>
  );
}