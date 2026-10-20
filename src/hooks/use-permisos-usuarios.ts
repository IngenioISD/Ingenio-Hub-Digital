import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosUsuarios = { puedeVer: boolean; puedeEditar: boolean; puedeCrear: boolean; cargando: boolean };

const SIN_PERMISOS = { puedeVer: false, puedeEditar: false, puedeCrear: false };

type FilaMisPermisos = {
  puede_ver: boolean | null;
  puede_editar: boolean | null;
  puede_crear: boolean | null;
};

/**
 * Permisos del rol aplicado a la persona sobre el módulo usuarios.
 * El rol aplicado lo resuelve la función mis_permisos: el de la excepción
 * si la persona la tiene en este módulo, y si no su rol base.
 */
export function usePermisosUsuarios(): PermisosUsuarios {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();
  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "usuarios", usuarioCliente?.cliente_id],
    enabled: habilitado,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: filas } = await supabase.rpc("mis_permisos", {
        p_modulo: "usuarios",
      } as never);
      const fila = (filas as FilaMisPermisos[] | null)?.[0] ?? null;
      return { puedeVer: Boolean(fila?.puede_ver), puedeEditar: Boolean(fila?.puede_editar), puedeCrear: Boolean(fila?.puede_crear) };
    },
  });

  const cargando = cargandoAuth || (habilitado && isLoading) || (!habilitado && !usuarioCliente);
  return { ...(data ?? SIN_PERMISOS), cargando: Boolean(cargando) };
}
