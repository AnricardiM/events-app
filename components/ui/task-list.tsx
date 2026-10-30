import { useId } from "react";

export type Task = {
  id: string;
  title: string;
  subtitle: string;
};

export function TaskList({
  tasks,
  title = "Mis tareas pendientes",
}: {
  tasks: Task[];
  title?: string;
}) {
  // useId evita ids duplicados si el componente se usa más de una vez.
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="rounded-[14px] border border-border bg-surface p-6 shadow-sm max-md:px-[18px] max-md:py-5"
    >
      <h2 className="mb-2 text-base font-bold text-text" id={titleId}>
        {title}
      </h2>

      {tasks.length === 0 ? (
        <p className="py-6 text-center text-xs text-text-muted">
          No tienes tareas pendientes.
        </p>
      ) : (
        <ul>
          {tasks.map((task) => (
            <li
              className="flex min-h-[73px] items-center gap-3.5 border-b border-border last:border-b-0"
              key={task.id}
            >
              <span
                aria-hidden="true"
                className="size-[9px] flex-none rounded-full bg-gold"
              />
              <div className="min-w-0 flex-1">
                <h3 className="truncate text-[13px] font-semibold text-text">
                  {task.title}
                </h3>
                <p className="mt-[5px] truncate text-xs text-text-muted">
                  {task.subtitle}
                </p>
              </div>
              <span aria-hidden="true" className="text-[19px] text-text-subtle">
                &gt;
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}