import { type ReactNode } from "react";
import { SinAcceso } from "@/components/layout/SinAcceso";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";

/**
 * Control de acceso a las pantallas de Datos Maestros.
 * Solo se muestra el contenido si el permiso efectivo puede_ver es true para datos_maestros.
 * Mientras carga no se renderiza nada; sin permiso se muestra el aviso de acceso.
 */
export function GuardDatosMaestros({ children }: { children: ReactNode }) {
  const { puedeVer, cargando } = usePermisosDatosMaestros();
  if (cargando) return null;
  if (!puedeVer) return <SinAcceso elemento="Datos Maestros" />;
  return <>{children}</>;
}
