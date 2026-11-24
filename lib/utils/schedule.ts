// Utilidades de cronograma compartidas entre Cronograma y Dashboard.

export type FillState = "empty" | "incomplete" | "complete" | "over";

export const fillLabels: Record<FillState, string> = {
  empty: "Sin contenido",
  incomplete: "Incompleto",
  complete: "Completo",
  over: "Excede",
};

// "Completo" = la suma de contenidos coincide con la duración del bloque,
// dentro de la tolerancia configurada en Administración.
export function getFillState(
  used: number,
  total: number,
  tolerance: number,
  count: number,
): FillState {
  if (count === 0) return "empty";
  const delta = used - total;
  if (Math.abs(delta) <= tolerance) return "complete";
  return delta > 0 ? "over" : "incomplete";
}

export function formatDuration(totalSeconds: number) {
  const sign = totalSeconds < 0 ? "-" : "";
  const minutes = Math.round(Math.abs(totalSeconds) / 60);
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${sign}${m} min`;
  return m === 0 ? `${sign}${h} h` : `${sign}${h} h ${m} min`;
}