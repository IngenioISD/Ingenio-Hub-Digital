import { createFileRoute, Outlet, redirect, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { obtenerMiPerfil, useAuth } from "@/hooks/use-auth";
import { crearCachePerfil } from "@/lib/erp/perfil-acceso-cache";

const perfilCache = crearCachePerfil(obtenerMiPerfil);

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      perfilCache.limpiar();
      throw redirect({ to: "/login" });
    }
    const perfil = await perfilCache.consultar(data.user.id);
    if (!perfil) throw redirect({ to: "/sin-acceso" });
    return { user: data.user };
  },
  component: LayoutAutenticado,
});

function LayoutAutenticado() {
  const navigate = useNavigate();
  const { usuarioCliente, isLoading } = useAuth();
  useEffect(() => {
    if (!isLoading && usuarioCliente === null) {
      perfilCache.limpiar();
      void navigate({ to: "/sin-acceso", replace: true });
    }
  }, [isLoading, usuarioCliente, navigate]);
  if (!isLoading && usuarioCliente === null) return null;
  return <Outlet />;
}
