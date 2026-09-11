import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type PermisosActas = {
  puedeEditar: boolean;
  puedeEliminar: boolean;
};

const SIN_PERMISOS: PermisosActas = { puedeEditar: false, puedeEliminar: false };

/**
 * Permisos del rol actual sobre el módulo actas_reunion.
 *
 * Regla:
 * 1. ¿El rol tiene permiso general de editar/eliminar? Si no, bloqueado.
 * 2. ¿Es el propio creador del acta (comparando personal.id con acta.creado_por_id)? Si sí, permitido.
 * 3. Si es ajena, ¿existe una fila en rol_jerarquia donde el rol actual es superior
 *    al rol del creador para el módulo actas_reunion? Solo entonces se heredan esos permisos.
 */
export function usePermisosActas(creadoPorId?: string | null): PermisosActas {
  const { usuarioCliente } = useAuth();

  const { data } = useQuery<PermisosActas>({
    queryKey: [
      "permisos",
      "actas_reunion",
      usuarioCliente?.cliente_id,
      usuarioCliente?.rol_id,
      creadoPorId,
    ],
    enabled: !!usuarioCliente?.cliente_id && !!usuarioCliente?.rol_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      // Paso 1: permiso general del rol sobre actas_reunion.
      const { data: filaGeneral } = await supabase
        .from("rol_permisos")
        .select("puede_editar, puede_eliminar")
        .eq("modulo", "actas_reunion")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("rol_id", usuarioCliente!.rol_id)
        .maybeSingle();

      const permisoGeneral: PermisosActas = {
        puedeEditar: Boolean(filaGeneral?.puede_editar),
        puedeEliminar: Boolean(filaGeneral?.puede_eliminar),
      };

      if (!permisoGeneral.puedeEditar && !permisoGeneral.puedeEliminar) return SIN_PERMISOS;
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

      // Paso 3: acta ajena -> comprobar jerarquía sobre el rol de quien la creó.
      const { data: creador } = await supabase
        .from("personal")
        .select("email")
        .eq("id", creadoPorId)
        .maybeSingle();
      if (!creador?.email) return SIN_PERMISOS;

      const { data: rolCreador } = await supabase
        .from("usuarios_cliente")
        .select("rol_id")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("email", creador.email)
        .maybeSingle();
      if (!rolCreador?.rol_id) return SIN_PERMISOS;

      const { data: jerarquia } = await supabase
        .from("rol_jerarquia")
        .select("puede_editar, puede_eliminar")
        .eq("cliente_id", usuarioCliente!.cliente_id)
        .eq("modulo", "actas_reunion")
        .eq("rol_superior", usuarioCliente!.rol_id)
        .eq("rol_inferior", rolCreador.rol_id)
        .maybeSingle();

      return {
        puedeEditar: Boolean(jerarquia?.puede_editar),
        puedeEliminar: Boolean(jerarquia?.puede_eliminar),
      };
    },
  });

  return data ?? SIN_PERMISOS;
}
