import { IconName } from "../ui/icon";

export const navigation: {
  id: string;
  label: string;
  icon: IconName;
  url: string;
}[] = [
  { id: "inicio", label: "Inicio", icon: "home", url: "/dashboard" },
  { id: "ingresos", label: "Ingresos", icon: "inbox", url: "/ingresos" },
  { id: "tareas", label: "Mis tareas", icon: "clipboard", url: "/tareas" },
  { id: "cronograma", label: "Cronograma", icon: "calendar", url: "/cronograma" },
  { id: "administracion", label: "Administración", icon: "settings", url: "/administracion" },
  { id: "usuarios", label: "Usuarios", icon: "user", url: "/usuarios" },
];

export const stats: {
  id: string;
  value: string;
  title: string;
  subtitle: string;
  icon: IconName;
  tone: "primary" | "gold" | "danger" | "success";
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
    tone: "gold",
  },
  {
    id: "cronograma",
    value: "12",
    title: "En cronograma",
    subtitle: "Registros programados",
    icon: "calendar",
    tone: "gold",
  },
];

export const tasks = [
  { id: "revisar-registros", title: "Revisar nuevos registros", subtitle: "Asignado hoy" },
  { id: "confirmar-agenda", title: "Confirmar agenda semanal", subtitle: "Vence mañana" },
  { id: "actualizar-evento", title: "Actualizar detalles del evento", subtitle: "Asignado ayer" },
];
