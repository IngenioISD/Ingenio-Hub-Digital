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

type FilaMisPermisos = {
  puede_ver: boolean | null;
  puede_crear: boolean | null;
  puede_editar: boolean | null;
};

/**
 * Permisos del rol aplicado a la persona sobre el módulo personal.
 * El rol aplicado lo resuelve la función mis_permisos: el de la excepción
 * si la persona la tiene en este módulo, y si no su rol base.
 */
export function usePermisosPersonal(): PermisosPersonal {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();
  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "personal", usuarioCliente?.cliente_id],
    enabled: habilitado,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: filas } = await supabase.rpc("mis_permisos", {
        p_modulo: "personal",
      } as never);
      const fila = (filas as FilaMisPermisos[] | null)?.[0] ?? null;
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
