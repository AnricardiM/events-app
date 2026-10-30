const knownMessages = [
  "El usuario no es un editor activo",
  "Primero debe asignarse un editor",
  "Primero debe marcarse como editado",
"El bloque no pertenece al evento",
];

export function explainContentError(message: string) {
  const normalized = message.toLocaleLowerCase();

  const known = knownMessages.find((text) =>
    normalized.includes(text.toLocaleLowerCase()),
  );
  if (known) return `${known}.`;

  if (normalized.includes("contenido inexistente")) {
    return "El contenido ya no existe. Actualiza la lista e inténtalo de nuevo.";
  }
  if (normalized.includes("bloque inexistente")) {
    return "El bloque seleccionado ya no existe.";
  }
  if (normalized.includes("no autorizado")) {
    return "No tienes permisos para realizar esta operación.";
  }

  console.error("Error de Supabase en contenidos:", message);
  return "No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.";
}