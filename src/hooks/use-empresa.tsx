import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type Empresa = {
  nombre: string;
  logo_url: string | null;
};

/**
 * Nombre y logo de la empresa (cliente) del usuario logueado.
 * El cliente_id llega de useAuth(); aquí sólo se cargan los datos de marca.
 */
export function useEmpresa() {
  const { usuarioCliente } = useAuth();

  return useQuery<Empresa>({
    queryKey: ["empresa", usuarioCliente?.cliente_id],
    enabled: !!usuarioCliente?.cliente_id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data: cliente } = await supabase
        .from("clientes")
        .select("logo_url, clientes_datos(nombre_empresa)")
        .eq("id", usuarioCliente!.cliente_id)
        .maybeSingle();

      const datos = cliente?.clientes_datos as
        | { nombre_empresa: string | null }
        | { nombre_empresa: string | null }[]
        | null
        | undefined;
      const nombre = Array.isArray(datos)
        ? (datos[0]?.nombre_empresa ?? "")
        : (datos?.nombre_empresa ?? "");

      return {
        nombre,
        logo_url: cliente?.logo_url ?? null,
      };
    },
  });
}
