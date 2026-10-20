import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { claimsFromToken, resolvePostLoginPath } from "@/lib/erp/auth-claims";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "Inicio · Ingenio HUB" },
    { name: "description", content: "Accede a tu espacio de trabajo en Ingenio HUB." },
    { property: "og:title", content: "Inicio · Ingenio HUB" },
    { property: "og:description", content: "Accede a tu espacio de trabajo en Ingenio HUB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) throw redirect({ to: "/login" });
    const destino = await resolvePostLoginPath(claimsFromToken(token));
    throw redirect({ to: destino as never });
  },
  component: () => null,
});
