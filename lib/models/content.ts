export const contentCategories = ["ofrenda", "introduccion", "directores", "especial"] as const;
export const contentMedia = ["audio", "video"] as const;
export const contentSources = ["telegram", "drive", "whatsapp"] as const;

export type ContentCategory = (typeof contentCategories)[number];
export type ContentMedia = (typeof contentMedia)[number];
export type ContentSource = (typeof contentSources)[number];

export const categoryLabels: Record<ContentCategory, string> = {
  ofrenda: "Ofrenda",
  introduccion: "Introducción",
  directores: "Directores",
  especial: "Especial",
};
export const mediaLabels: Record<ContentMedia, string> = {
  audio: "Audio",
  video: "Video",
};
export const sourceLabels: Record<ContentSource, string> = {
  telegram: "Telegram",
  drive: "Drive",
  whatsapp: "WhatsApp",
};

export function isOneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

// 125 segundos -> "2:05"
export function formatClock(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}