// Convierte un timestamptz ISO al formato que espera <input type="datetime-local">,
// expresado en la zona horaria configurada (no la del navegador).
export function toLocalInputValue(iso: string, timeZone: string) {
  return new Date(iso)
    .toLocaleString("sv-SE", { timeZone }) // "2026-10-29 14:00:00"
    .replace(" ", "T")
    .slice(0, 16);
}