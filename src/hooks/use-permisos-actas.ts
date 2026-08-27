import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosActas = {
  puedeEditar: boolean;
  puedeEliminar: boolean;
};

const SIN_PERMISOS: PermisosActas = { puedeEditar: false, puedeEliminar: false };

/** Permisos del rol actual sobre el módulo actas_reunion (editar y eliminar son independientes). */
export function usePermisosActas(): PermisosActas {
  const { usuarioCliente } = useAuth();

  const { data } = useQuery<PermisosActas>({
    queryKey: ["permisos", "actas_reunion", usuarioCliente?.cliente_id, usuarioCliente?.rol_id],
    enabled: !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: fila } = await supabase
        .from("rol_permisos")
        .select("puede_editar, puede_eliminar")
        .eq("modulo", "actas_reunion")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("rol_id", usuarioCliente!.rol_id)
        .maybeSingle();

      return {
        puedeEditar: Boolean(fila?.puede_editar),
        puedeEliminar: Boolean(fila?.puede_eliminar),
      };
    },
  });

  return data ?? SIN_PERMISOS;
}
