// lib/sidebar-cookie.ts
// Nombre de la cookie que recuerda si el menú lateral está expandido en escritorio.
// Vive aparte porque lo usan el layout (servidor) y el shell (cliente);
// un archivo "use client" no puede exportar valores a un componente de servidor.
export const SIDEBAR_COOKIE = "workspace-sidebar-open";