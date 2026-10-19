import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosActas = {
  puedeVer: boolean;
  puedeEditar: boolean;
  puedeEliminar: boolean;
  cargando: boolean;
};

const SIN_PERMISOS = { puedeVer: false, puedeEditar: false, puedeEliminar: false };

type FilaMisPermisos = {
  rol_aplicado: string;
  puede_ver: boolean | null;
  puede_editar: boolean | null;
  puede_eliminar: boolean | null;
};

/**
 * Permisos del rol aplicado a la persona sobre el módulo actas_reunion.
 * El rol aplicado lo resuelve la función mis_permisos: el de la excepción
 * si la persona la tiene en este módulo, y si no su rol base.
 *
 * Regla:
 * 1. ¿El rol aplicado tiene permiso general de ver/editar/eliminar? Si no, bloqueado.
 * 2. ¿Es el propio creador del acta (comparando personal.id con acta.creado_por_id)? Si sí, permitido.
 * 3. Si es ajena, ¿existe una fila en rol_jerarquia donde el rol aplicado es superior
 *    al rol del creador para el módulo actas_reunion? Solo entonces se heredan esos permisos.
 */
export function usePermisosActas(creadoPorId?: string | null): PermisosActas {
  const { usuarioCliente, isLoading: cargandoAuth } = useAuth();

  const habilitado = !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id;

  const { data, isLoading } = useQuery({
    queryKey: ["permisos", "actas_reunion", usuarioCliente?.cliente_id, creadoPorId],
    enabled: habilitado,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      // Paso 1: permiso general del rol aplicado sobre actas_reunion (mis_permisos).
      const { data: filasPermisos } = await supabase.rpc("mis_permisos", {
        p_modulo: "actas_reunion",
      } as never);
      const filaGeneral = (filasPermisos as FilaMisPermisos[] | null)?.[0] ?? null;

      const puedeVer = Boolean(filaGeneral?.puede_ver);
      const permisoGeneral = {
        puedeVer,
        puedeEditar: Boolean(filaGeneral?.puede_editar),
        puedeEliminar: Boolean(filaGeneral?.puede_eliminar),
      };

      if (!permisoGeneral.puedeEditar && !permisoGeneral.puedeEliminar) {
        return { ...SIN_PERMISOS, puedeVer };
      }
      if (!creadoPorId) return permisoGeneral; // ej. formulario nuevo: aún no hay creador.

      // Paso 2: ¿es el propio creador del acta?
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email ?? "";
      const { data: yo } = await supabase
        .from("personal")
        .select("id")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("email", email)
        .maybeSingle();

      if (yo?.id && yo.id === creadoPorId) return permisoGeneral;

      // Paso 3: acta ajena -> rol del creador vía RPC (seguro cuando usuarios_cliente esté cerrada).
      const { data: rolCreador } = await supabase.rpc("rol_del_creador", {
        p_personal_id: creadoPorId,
      } as never);
      if (!rolCreador) return { ...SIN_PERMISOS, puedeVer };

      const { data: jerarquia } = await supabase
        .from("rol_jerarquia")
        .select("puede_editar, puede_eliminar")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("modulo", "actas_reunion")
        .eq("rol_superior", filaGeneral?.rol_aplicado ?? "")
        .eq("rol_inferior", rolCreador)
        .maybeSingle();

      return {
        puedeVer,
        puedeEditar: Boolean(jerarquia?.puede_editar),
        puedeEliminar: Boolean(jerarquia?.puede_eliminar),
      };
    },
  });

  const cargando = cargandoAuth || (habilitado && isLoading) || (!habilitado && !usuarioCliente);

  return { ...(data ?? SIN_PERMISOS), cargando: Boolean(cargando) };
}
