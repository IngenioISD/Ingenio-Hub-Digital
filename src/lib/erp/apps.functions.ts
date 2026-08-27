import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppCliente = {
  id: string;
  clienteAppId: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  urlBase: string | null;
  activo: boolean;
};

/** Apps contratadas por el cliente actual, activas, cruzadas con catálogo. */
export const getClienteApps = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<AppCliente[]> => {
    const { supabase, claims } = context;
    const clienteId = (claims as { empresa_id?: string })?.empresa_id;
    if (!clienteId) return [];

    const { data: filas, error } = await supabase
      .from("cliente_apps")
      .select("id, cliente_id, app_id, activo, url_cliente, catalogo_apps(id, nombre, descripcion, icono, url_base)")
      .eq("cliente_id", clienteId)
      .eq("activo", true);

    if (error) throw error;
    if (!filas || filas.length === 0) return [];

    return filas.map((fila: unknown) => {
      const row = fila as {
        id: string;
        cliente_id: string;
        app_id: string;
        activo: boolean;
        url_cliente: string | null;
        catalogo_apps: {
          id: string;
          nombre: string;
          descripcion: string | null;
          icono: string | null;
          url_base: string | null;
        } | null;
      };

      const catalogo = row.catalogo_apps;
      return {
        id: catalogo?.id ?? row.app_id,
        clienteAppId: row.id,
        nombre: catalogo?.nombre ?? "App",
        descripcion: catalogo?.descripcion ?? null,
        icono: catalogo?.icono ?? "LayoutGrid",
        urlBase: row.url_cliente ?? catalogo?.url_base ?? null,
        activo: row.activo,
      };
    });
  });
