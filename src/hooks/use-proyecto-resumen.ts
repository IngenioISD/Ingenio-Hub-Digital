import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type ProyectoResumen = { nombre: string; estado: string };

export function useProyectoResumen(id: string): ProyectoResumen | null {
  const [proyecto, setProyecto] = useState<ProyectoResumen | null>(null);

  useEffect(() => {
    let cancelado = false;
    void (async () => {
      const { data } = await supabase
        .from("proyectos")
        .select("nombre, estado")
        .eq("id", id)
        .maybeSingle();
      if (!cancelado && data) setProyecto({ nombre: data.nombre, estado: data.estado });
    })();
    return () => {
      cancelado = true;
    };
  }, [id]);

  return proyecto;
}
