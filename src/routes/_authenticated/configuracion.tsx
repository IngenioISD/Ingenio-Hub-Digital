import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, User, Bell, Shield } from "lucide-react";

import { AppShell } from "@/components/layout/AppShell";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/configuracion")({
  component: Page,
});

const OPTION_BASE =
  "flex items-center gap-3 px-4 py-3 transition-colors cursor-pointer";
const OPTION_STYLE = {
  borderRadius: "9px",
  fontSize: "var(--text-base)",
  fontWeight: 500,
  color: "var(--text-primary)",
} as const;
const ICON_BOX =
  "flex h-9 w-9 items-center justify-center shrink-0 rounded-full";

function Page() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    // Limpia toda la caché (permisos, apps visibles, datos de sesión...).
    // Sin esto, al volver a entrar con otra cuenta o con un rol cambiado,
    // la app puede seguir mostrando datos de la sesión anterior hasta que
    // la caché expira por su cuenta (hasta 5 minutos según la consulta).
    queryClient.clear();
    await navigate({ to: "/login", replace: true });
  }

  return (
    <AppShell mode="direccion" contexto="hub" activeItem="">
      <h1
        className="mb-6"
        style={{ fontSize: "var(--text-2xl)", fontWeight: 700, color: "var(--text-primary)" }}
      >
        Configuración
      </h1>

      <div
        className="max-w-xl"
        style={{
          backgroundColor: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "12px",
          padding: "8px",
        }}
      >
        {/* Opciones de configuración pendientes de definir */}
        <div
          className={OPTION_BASE}
          style={{ ...OPTION_STYLE, backgroundColor: "transparent" }}
        >
          <span className={ICON_BOX} style={{ backgroundColor: "var(--bg-muted)" }}>
            <User size={18} style={{ color: "var(--text-secondary)" }} />
          </span>
          <span>Perfil de usuario</span>
        </div>

        <div
          className={OPTION_BASE}
          style={{ ...OPTION_STYLE, backgroundColor: "transparent" }}
        >
          <span className={ICON_BOX} style={{ backgroundColor: "var(--bg-muted)" }}>
            <Bell size={18} style={{ color: "var(--text-secondary)" }} />
          </span>
          <span>Notificaciones</span>
        </div>

        <div
          className={OPTION_BASE}
          style={{ ...OPTION_STYLE, backgroundColor: "transparent" }}
        >
          <span className={ICON_BOX} style={{ backgroundColor: "var(--bg-muted)" }}>
            <Shield size={18} style={{ color: "var(--text-secondary)" }} />
          </span>
          <span>Seguridad</span>
        </div>

        {/* Divisor visual */}
        <hr style={{ borderColor: "var(--border-default)", margin: "8px 0" }} />

        {/* Cerrar sesión */}
        <button
          type="button"
          onClick={handleSignOut}
          className={`${OPTION_BASE} w-full text-left`}
          style={{
            ...OPTION_STYLE,
            color: "var(--state-error)",
            backgroundColor: "transparent",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.backgroundColor = "var(--state-error-bg)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.backgroundColor = "transparent")
          }
        >
          <span className={ICON_BOX} style={{ backgroundColor: "var(--state-error-bg)" }}>
            <LogOut size={18} style={{ color: "var(--state-error)" }} />
          </span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </AppShell>
  );
}
