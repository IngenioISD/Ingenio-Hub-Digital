import { obtenerMiPerfil } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { crearCachePerfil } from "./perfil-acceso-cache";

export async function obtenerDebeCambiarPassword(): Promise<boolean> {
  const { data, error } = await supabase.rpc("mi_debe_cambiar_password", {} as never);
  if (error || typeof data !== "boolean") throw new Error("No se pudo comprobar el acceso. Inténtalo de nuevo.");
  return data;
}

// Solo se consulta desde las rutas sin SSR; comparte perfil y marca por identidad.
export const perfilAccesoCache = crearCachePerfil(async () => {
  const perfil = await obtenerMiPerfil();
  if (!perfil) return null;
  return { perfil, debeCambiarPassword: await obtenerDebeCambiarPassword() };
});