import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosPersonal = {
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  cargando: boolean;
};

const SIN_PERMISOS = { puedeVer: false, puedeCrear: false, puedeEditar: false };

/** Permisos del rol actual sobre el módulo personal (rol_permisos). */
export function usePermisosPersonal(): PermisosPersonal {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();
  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "personal", usuarioCliente?.cliente_id, usuarioCliente?.rol_id],
    enabled: habilitado,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: fila } = await supabase
        .from("rol_permisos")
        .select("puede_ver, puede_crear, puede_editar")
        .eq("modulo", "personal")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("rol_id", usuarioCliente!.rol_id)
        .maybeSingle();
      return {
        puedeVer: Boolean(fila?.puede_ver),
        puedeCrear: Boolean(fila?.puede_crear),
        puedeEditar: Boolean(fila?.puede_editar),
      };
    },
  });

  const cargando = cargandoAuth || (habilitado && isLoading) || (!habilitado && !usuarioCliente);
  return { ...(data ?? SIN_PERMISOS), cargando: Boolean(cargando) };
}
