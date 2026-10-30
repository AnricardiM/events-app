const knownMessages = [
  "La fecha de fin debe ser posterior a la de inicio",
  "La fecha límite de registro debe ser anterior al inicio del evento",
  "La fecha límite de edición debe ser anterior al inicio del evento",
  "La fecha límite de edición debe ser posterior a la de registro",
  "Hay bloques fuera del nuevo rango de fechas del evento",
  "El bloque queda fuera del rango del evento",
  "El bloque se solapa con otro bloque",
  "La duración debe ser mayor a cero",
  "El bloque tiene contenidos registrados",
];

export function explainEventError(message: string) {
  const normalized = message.toLocaleLowerCase();

  const known = knownMessages.find((text) =>
    normalized.includes(text.toLocaleLowerCase()),
  );
  if (known) return `${known}.`;

  if (normalized.includes("evento inexistente")) {
    return "El evento ya no existe. Actualiza la lista e inténtalo de nuevo.";
  }
  if (normalized.includes("bloque inexistente")) {
    return "El bloque ya no existe. Actualiza la página e inténtalo de nuevo.";
  }
  if (normalized.includes("no autorizado")) {
    return "No tienes permisos para realizar esta operación.";
  }

  console.error("Error de Supabase en eventos:", message);
  return "No se pudo completar la operación. Revisa los datos e inténtalo de nuevo.";
}