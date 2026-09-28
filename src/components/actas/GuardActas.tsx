import { useEffect, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";

import { useAuth } from "@/hooks/use-auth";
import { usePermisosActas } from "@/hooks/use-permisos-actas";

/**
 * Control de acceso a las pantallas de Actas de Reunión.
 * Solo se muestra el contenido si rol_permisos.puede_ver = true para actas_reunion.
 * Mientras se carga el permiso no se renderiza nada; si no hay permiso, redirige a Inicio.
 */
export function GuardActas({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { usuarioCliente } = useAuth();
  const { puedeVer, cargando } = usePermisosActas();

  const inicio = usuarioCliente?.portal === "digital" ? "/digital/inicio" : "/hub/inicio";

  useEffect(() => {
    if (!cargando && !puedeVer) {
      void navigate({ to: inicio, replace: true });
    }
  }, [cargando, puedeVer, inicio, navigate]);

  if (cargando || !puedeVer) return null;
  return <>{children}</>;
}
