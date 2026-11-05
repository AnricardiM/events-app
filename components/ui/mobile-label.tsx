// Etiqueta de campo: solo se ve en móvil, porque ahí no hay encabezados de tabla.
export function MobileLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-text-subtle max-md:text-xs md:hidden">
      {children}
    </span>
  );
}