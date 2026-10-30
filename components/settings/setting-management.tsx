"use client";

import { useState, useTransition } from "react";
import type { FormEvent } from "react";
import { updateAppSettings } from "@/app/actions/settings";
import type { AppSettings } from "@/lib/services/app_settings";

type Notice = { message: string; type: "success" | "error" };

const labelClass = "grid gap-[7px] text-xs font-semibold text-text-muted";
const hintClass = "text-[11px] font-normal text-text-subtle";
const inputClass =
  "min-h-[42px] w-full rounded-lg border border-border bg-surface px-[11px] text-[13px] font-normal text-text focus-visible:border-primary disabled:cursor-not-allowed disabled:bg-surface-muted";

const timezones = Intl.supportedValuesOf("timeZone");

export function SettingManagement({ settings }: { settings: AppSettings }) {
  const [isPending, startTransition] = useTransition();
  const [notice, setNotice] = useState<Notice | null>(null);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await updateAppSettings(formData);
      setNotice({
        message: result.message,
        type: result.success ? "success" : "error",
      });
    });
  }

  return (
    <section className="min-h-[calc(100vh-var(--dashboard-header-height)-100px)]">
      <div className="mx-auto w-full max-w-[1180px]">
        <header className="mb-7">
          <p className="mb-2 text-[10px] font-bold tracking-[0.14em] text-primary">
            ADMINISTRACIÓN
          </p>
          <h1 className="text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text">
            Configuración básica
          </h1>
        </header>

        <section
          aria-label="Configuraciones del sistema"
          className="rounded-2xl border border-border bg-surface p-[26px] shadow-sm max-sm:p-5"
        >
          <form className="grid max-w-[560px] gap-[17px]" onSubmit={handleSubmit}>
            <label className={labelClass}>
              Tolerancia de duración (segundos)
              <input className={inputClass} defaultValue={settings.duration_tolerance_seconds}
                disabled={isPending} min={0} name="duration_tolerance_seconds"
                required step={1} type="number" />
            </label>

            <label className={labelClass}>
              Zona horaria de visualización
              <select className={inputClass} defaultValue={settings.display_timezone}
                disabled={isPending} name="display_timezone" required>
                {timezones.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </label>

            <label className={labelClass}>
              Porcentaje de aviso por sección (%)
              <input className={inputClass} defaultValue={settings.section_warning_percent}
                disabled={isPending} max={100} min={0} name="section_warning_percent"
                required type="number" />
            </label>

            <label className={labelClass}>
              Días de alerta de registro
              <input className={inputClass} defaultValue={settings.registration_alert_days}
                disabled={isPending} min={0} name="registration_alert_days"
                required type="number" />
            </label>

            <label className={labelClass}>
              Días de retención de eventos
              <input className={inputClass} defaultValue={settings.event_retention_days}
                disabled={isPending} min={1} name="event_retention_days"
                required type="number" />
            </label>

            <p className={hintClass}>
              Última actualización:{" "}
              {new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" })
                .format(new Date(settings.updated_at))}
            </p>

            {notice && (
              <p aria-live="polite" role={notice.type === "success" ? "status" : "alert"}
                className={`rounded-[7px] px-[11px] py-[9px] text-[11px] ${
                  notice.type === "success"
                    ? "bg-success-soft text-success"
                    : "bg-danger-soft text-danger"
                }`}>
                {notice.message}
              </p>
            )}

            <div className="flex justify-end">
              <button type="submit" disabled={isPending}
                className="min-h-10 cursor-pointer rounded-lg bg-primary px-4 text-[13px] font-semibold text-on-primary hover:enabled:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60">
                {isPending ? "Guardando..." : "Guardar cambios"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  );
}