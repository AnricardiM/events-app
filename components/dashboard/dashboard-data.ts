// components/dashboard/dashboard-data.ts
// Datos de ejemplo del dashboard (reemplazar por consultas reales).

import type { IconName } from "../ui/icon";
import type { StatTone } from "../ui/stat-card";
import type { Task } from "../ui/task-list";

export const stats: {
  id: string;
  value: string;
  title: string;
  subtitle: string;
  icon: IconName;
  tone: StatTone;
}[] = [
  {
    id: "ingresos",
    value: "08",
    title: "Nuevos ingresos",
    subtitle: "Por revisar",
    icon: "inbox",
    tone: "primary",
  },
  {
    id: "tareas",
    value: "04",
    title: "Mis tareas",
    subtitle: "Pendientes",
    icon: "clipboard",
    tone: "gold",
  },
  {
    id: "correcciones",
    value: "02",
    title: "Correcciones",
    subtitle: "Requieren atención",
    icon: "alert",
    tone: "danger",
  },
  {
    id: "cronograma",
    value: "12",
    title: "En cronograma",
    subtitle: "Registros programados",
    icon: "calendar",
    tone: "success",
  },
];

export const tasks: Task[] = [
  {
    id: "revisar-registros",
    title: "Revisar nuevos registros",
    subtitle: "Asignado hoy",
  },
  {
    id: "confirmar-agenda",
    title: "Confirmar agenda semanal",
    subtitle: "Vence mañana",
  },
  {
    id: "actualizar-evento",
    title: "Actualizar detalles del evento",
    subtitle: "Asignado ayer",
  },
];