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

export type MiPerfilFila = {
  usuario_id: string;
  user_id: string;
  cliente_id: string;
  rol_id: string;
  portal: string;
  acceso_total_proyectos: boolean | null;
  nombre: string | null;
  apellidos: string | null;
  puesto: string | null;
  rol_nombre: string | null;
};

/** Llama a la función mi_perfil (solo devuelve los datos del propio usuario). */
export async function obtenerMiPerfil(): Promise<MiPerfilFila | null> {
  const { data } = await (supabase.rpc as unknown as (
    fn: string,
  ) => Promise<{ data: MiPerfilFila[] | null }>)("mi_perfil");
  return data?.[0] ?? null;
}

/**
 * Usuario logueado + su perfil (cliente_id, rol_id, etc.) vía mi_perfil.
 * Fuente única de identidad para las apps internas de Ingenio Digital.
 */
export function useAuth() {
  const query = useQuery<UsuarioCliente | null>({
    queryKey: ["auth", "usuario-cliente"],
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return null;

      const p = await obtenerMiPerfil();
      if (!p) return null;

      return {
        id: p.usuario_id,
        user_id: p.user_id,
        cliente_id: p.cliente_id,
        rol_id: p.rol_id,
        portal: p.portal,
        nombre: p.nombre ?? null,
        apellidos: p.apellidos || null,
        acceso_total_proyectos: Boolean(p.acceso_total_proyectos),
      };
    },
  });

  return {
    usuarioCliente: query.data ?? null,
    isLoading: query.isLoading,
  };
}
