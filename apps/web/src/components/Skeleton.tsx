// Loading placeholder (09 §7 "Datos: cargando"). Sized by the caller.
export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`skeleton ${className}`} />;
}
