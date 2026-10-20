import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/sin-acceso")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
  },
  head: () => ({ meta: [
    { title: "Acceso no activo · Ingenio HUB" },
    { name: "description", content: "Consulta el estado de tu acceso a Ingenio HUB." },
    { property: "og:title", content: "Acceso no activo · Ingenio HUB" },
    { property: "og:description", content: "Consulta el estado de tu acceso a Ingenio HUB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SinAccesoPage,
});

function SinAccesoPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [cerrando, setCerrando] = useState(false);

  async function cerrarSesion() {
    setCerrando(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      await navigate({ to: "/login", replace: true });
    } finally {
      setCerrando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "var(--bg-surface)", fontFamily: "var(--font-family)" }}>
      <div className="w-full max-w-[400px] space-y-6 text-center">
        <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>Tu acceso a Ingenio HUB no está activo</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>Contacta con el administrador de tu empresa si crees que hay un error en el acceso.</p>
        <Button className="w-full" disabled={cerrando} onClick={() => void cerrarSesion()}>Cerrar sesión</Button>
      </div>
    </div>
  );
}