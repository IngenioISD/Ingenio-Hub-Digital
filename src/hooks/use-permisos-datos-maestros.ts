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

/**
 * Permisos del rol actual sobre el módulo datos_maestros.
 *
 * A diferencia de Actas, aquí los permisos son planos: dependen solo del rol
 * del usuario (rol_permisos), sin distinguir quién creó cada registro ni
 * mirar rol_jerarquia. Hoy solo administracion y director_estudios tienen
 * CRUD; el resto de roles, solo lectura. Cuando exista la pantalla de
 * gestión de roles, será Administración quien reparta CRUD a otros roles
 * — este hook no cambia entonces, sigue leyendo rol_permisos tal cual.
 */
export function usePermisosDatosMaestros(): PermisosDatosMaestros {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();

  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "datos_maestros", usuarioCliente?.cliente_id, usuarioCliente?.rol_id],
    enabled: habilitado,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: fila } = await supabase
        .from("rol_permisos")
        .select("puede_ver, puede_crear, puede_editar, puede_eliminar")
        .eq("modulo", "datos_maestros")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("rol_id", usuarioCliente!.rol_id)
        .maybeSingle();

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
