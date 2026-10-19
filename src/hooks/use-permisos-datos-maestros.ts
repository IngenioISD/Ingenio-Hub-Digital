import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosDatosMaestros = {
  puedeVer: boolean;
  puedeCrear: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  cargando: boolean;
};

const SIN_PERMISOS = { puedeVer: false, puedeCrear: false, puedeEditar: false, puedeEliminar: false };

type FilaMisPermisos = {
  puede_ver: boolean | null;
  puede_crear: boolean | null;
  puede_editar: boolean | null;
  puede_eliminar: boolean | null;
};

/**
 * Permisos del rol aplicado a la persona sobre el módulo datos_maestros.
 * El rol aplicado lo resuelve la función mis_permisos: el de la excepción
 * si la persona la tiene en este módulo, y si no su rol base.
 *
 * A diferencia de Actas, aquí los permisos son planos: dependen solo del rol
 * aplicado, sin distinguir quién creó cada registro ni mirar rol_jerarquia.
 * Hoy solo administracion y director_estudios tienen CRUD; el resto de roles,
 * solo lectura. Cuando exista la pantalla de gestión de roles, será
 * Administración quien reparta CRUD a otros roles — este hook no cambia
 * entonces, sigue leyendo mis_permisos tal cual.
 */
export function usePermisosDatosMaestros(): PermisosDatosMaestros {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();

  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "datos_maestros", usuarioCliente?.cliente_id],
    enabled: habilitado,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: filas } = await supabase.rpc("mis_permisos", {
        p_modulo: "datos_maestros",
      } as never);
      const fila = (filas as FilaMisPermisos[] | null)?.[0] ?? null;

      return {
        puedeVer: Boolean(fila?.puede_ver),
        puedeCrear: Boolean(fila?.puede_crear),
        puedeEditar: Boolean(fila?.puede_editar),
        puedeEliminar: Boolean(fila?.puede_eliminar),
      };
    },
  });

  const cargando = cargandoAuth || (habilitado && isLoading) || (!habilitado && !usuarioCliente);

  return { ...(data ?? SIN_PERMISOS), cargando: Boolean(cargando) };
}
