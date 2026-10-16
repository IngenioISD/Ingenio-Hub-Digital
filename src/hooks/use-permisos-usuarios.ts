import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosUsuarios = { puedeVer: boolean; puedeEditar: boolean; cargando: boolean };

const SIN_PERMISOS = { puedeVer: false, puedeEditar: false };

/** Permisos del rol actual sobre el módulo usuarios (rol_permisos). */
export function usePermisosUsuarios(): PermisosUsuarios {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();
  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "usuarios", usuarioCliente?.cliente_id, usuarioCliente?.rol_id],
    enabled: habilitado,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: fila } = await supabase
        .from("rol_permisos")
        .select("puede_ver, puede_editar")
        .eq("modulo", "usuarios")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("rol_id", usuarioCliente!.rol_id)
        .maybeSingle();
      return { puedeVer: Boolean(fila?.puede_ver), puedeEditar: Boolean(fila?.puede_editar) };
    },
  });

  const cargando = cargandoAuth || (habilitado && isLoading) || (!habilitado && !usuarioCliente);
  return { ...(data ?? SIN_PERMISOS), cargando: Boolean(cargando) };
}
