import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type UsuarioCliente = {
  id: string;
  user_id: string;
  cliente_id: string;
  rol_id: string;
  portal: string;
  nombre: string | null;
  apellidos: string | null;
  acceso_total_proyectos: boolean;
};

/**
 * Usuario logueado + su ficha en usuarios_cliente (cliente_id, rol_id, etc.).
 * Fuente única de identidad para las apps internas de Ingenio Digital.
 */
export function useAuth() {
  const query = useQuery<UsuarioCliente | null>({
    queryKey: ["auth", "usuario-cliente"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return null;

      const { data } = await supabase
        .from("usuarios_cliente")
        .select(
          "id, user_id, cliente_id, rol_id, portal, nombre, apellidos, apellido1, apellido2, acceso_total_proyectos",
        )
        .eq("user_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      if (!data) return null;

      const apellidos =
        data.apellidos ?? [data.apellido1, data.apellido2].filter(Boolean).join(" ") ?? null;

      return {
        id: data.id,
        user_id: data.user_id,
        cliente_id: data.cliente_id,
        rol_id: data.rol_id,
        portal: data.portal,
        nombre: data.nombre ?? null,
        apellidos: apellidos || null,
        acceso_total_proyectos: Boolean(data.acceso_total_proyectos),
      };
    },
  });

  return {
    usuarioCliente: query.data ?? null,
    isLoading: query.isLoading,
  };
}
