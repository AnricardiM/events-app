"use client";

import { stats, tasks } from "../general/data";
import { useWorkspaceProfile } from "../layout/workspace-shell";
import { StatCard } from "../ui/stat-card";
import { TaskList } from "../ui/task-list";

export function DashboardHome() {
  const fullName = useWorkspaceProfile().trim();

  return (
    <div className="mx-auto w-full max-w-[1060px]">
      <section
        aria-labelledby="dashboard-title"
        className="mb-[30px] max-sm:mb-[22px]"
      >
        <h1
          className="mb-[9px] text-[clamp(27px,3vw,34px)] font-bold tracking-tight text-text"
          id="dashboard-title"
        >
          {fullName ? `¡Hola, ${fullName}!` : "¡Hola!"}
        </h1>
        <p className="text-sm leading-relaxed text-text-muted">
          Aquí tienes el resumen de tu trabajo.
        </p>
      </section>

      <section
        aria-label="Resumen de actividad"
        className="mb-6 grid grid-cols-2 gap-[18px] max-md:grid-cols-1 max-md:gap-3"
      >
        {stats.map((stat) => (
          <StatCard key={stat.id} {...stat} />
        ))}
      </section>

      <TaskList tasks={tasks} />
    </div>
  );
}