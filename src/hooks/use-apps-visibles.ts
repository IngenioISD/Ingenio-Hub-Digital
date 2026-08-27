import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AppVisible = {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string;
  urlBase: string | null;
};

/**
 * Apps visibles para el usuario logueado según su rol.
 *
 * Usa la vista apps_visibles_usuario de Supabase, que ya cruza
 * cliente_apps + catalogo_apps + rol_permisos y aplica RLS.
 */
export function useAppsVisibles(): AppVisible[] {
  const [apps, setApps] = useState<AppVisible[]>([]);

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const { data, error } = await supabase.from("apps_visibles_usuario").select("*");
      if (error || !data || cancelado) return;

      // La vista devuelve una fila por rol con acceso: hay que deduplicar por app.
      const unicas = new Map<string, AppVisible>();
      for (const fila of data) {
        const id = fila.app_id ?? "";
        if (!id || unicas.has(id)) continue;
        unicas.set(id, {
          id,
          nombre: fila.nombre ?? "App",
          descripcion: fila.descripcion ?? null,
          icono: fila.icono ?? "LayoutGrid",
          urlBase: fila.url_base ?? null,
        });
      }

      setApps([...unicas.values()]);

    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return apps;
}
