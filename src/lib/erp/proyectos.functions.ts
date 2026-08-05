import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { readProyectosCliente } from "./proyectos.server";

export const getProyectosListado = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(({ context }) => readProyectosCliente(context.supabase, context.userId));
