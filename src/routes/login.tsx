import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { claimsFromToken, resolvePostLoginPath } from "@/lib/erp/auth-claims";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Acceder | Ingenio HUB" },
      {
        name: "description",
        content:
          "Accede a Ingenio HUB, la plataforma de gestión integral para empresas constructoras.",
      },
      { property: "og:title", content: "Acceder | Ingenio HUB" },
      {
        property: "og:description",
        content:
          "Accede a Ingenio HUB, la plataforma de gestión integral para empresas constructoras.",
      },
    ],
  }),
  component: LoginPage,
});

const labelStyle = {
  fontSize: "var(--text-xs)",
  fontWeight: 600,
  letterSpacing: "0.08em",
  color: "var(--text-secondary)",
} as const;

function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (authError || !data.session) {
      setError("Credenciales incorrectas. Revisa tu correo y contraseña e inténtalo de nuevo.");
      setCargando(false);
      return;
    }

    const claims = claimsFromToken(data.session.access_token);
    const destino = await resolvePostLoginPath(claims);
    await navigate({ to: destino, replace: true });
    setCargando(false);
  }

  return (
    <div className="flex min-h-screen" style={{ fontFamily: "var(--font-family)" }}>
      {/* Columna izquierda — marca */}
      <div
        className="hidden w-[45%] flex-col items-center justify-center px-10 text-center md:flex"
        style={{ backgroundColor: "var(--brand-navy-deep)" }}
      >
        <img src="/ingenio-sin-fondo.svg" alt="Ingenio ISD" className="h-24 w-auto" />
        <h2
          className="mt-6 uppercase"
          style={{
            color: "var(--text-inverse)",
            fontSize: "36px",
            fontWeight: 700,
            letterSpacing: "0.28em",
          }}
        >
          Ingenio
        </h2>
        <p
          className="mt-2 uppercase"
          style={{
            color: "var(--brand-lime)",
            fontSize: "var(--text-sm)",
            fontWeight: 600,
            letterSpacing: "0.22em",
          }}
        >
          Hub · Digital
        </p>
        <p
          className="mt-8 max-w-xs"
          style={{ color: "rgba(255,255,255,0.55)", fontSize: "var(--text-base)" }}
        >
          La plataforma de gestión integral para empresas constructoras.
        </p>
      </div>

      {/* Columna derecha — formulario */}
      <div
        className="flex flex-1 items-center justify-center px-6"
        style={{ backgroundColor: "var(--bg-surface)" }}
      >
        <div className="w-full max-w-[400px]">
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>
            Bienvenido
          </h1>
          <p className="mt-1" style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>
            Accede a tu plataforma de gestión
          </p>

          {error ? (
            <Alert variant="destructive" className="mt-6" style={{ borderRadius: "9px" }}>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="email" className="block uppercase" style={labelStyle}>
                Correo electrónico
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ borderRadius: "7px" }}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="password" className="block uppercase" style={labelStyle}>
                Contraseña
              </label>
              <div className="relative">
                <Input
                  id="password"
                  type={verPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  style={{ borderRadius: "7px" }}
                />
                <button
                  type="button"
                  onClick={() => setVerPassword((v) => !v)}
                  aria-label={verPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute inset-y-0 right-0 flex items-center px-3"
                  style={{ color: "var(--text-muted)" }}
                >
                  {verPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={cargando}
              className="flex w-full items-center justify-center gap-2 py-2.5 transition-colors disabled:opacity-70"
              style={{
                backgroundColor: "var(--interactive-primary-bg)",
                color: "var(--interactive-primary-text)",
                borderRadius: "7px",
                fontSize: "var(--text-base)",
                fontWeight: 600,
              }}
            >
              {cargando ? <Loader2 size={16} className="animate-spin" /> : null}
              Iniciar sesión
            </button>
          </form>

          <div className="mt-4 text-center">
            <a
              href="#"
              style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <p
            className="mt-12 text-center"
            style={{ color: "var(--text-disabled)", fontSize: "var(--text-xs)" }}
          >
            © 2026 Ingenio ISD. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </div>
  );
}
