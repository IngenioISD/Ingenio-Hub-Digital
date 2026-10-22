import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESPERA_RECUPERACION_MS, segundosParaReenviar } from "@/lib/erp/recuperar-contrasena-reglas";

export const Route = createFileRoute("/recuperar-contrasena")({
  head: () => ({ meta: [
    { title: "Recupera tu contraseña · Ingenio HUB" },
    { name: "description", content: "Solicita un enlace para recuperar tu acceso a Ingenio HUB." },
    { property: "og:title", content: "Recupera tu contraseña · Ingenio HUB" },
    { property: "og:description", content: "Solicita un enlace para recuperar tu acceso a Ingenio HUB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RecuperarContrasenaPage,
});

function RecuperarContrasenaPage() {
  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [disponibleEn, setDisponibleEn] = useState(0);
  const [segundos, setSegundos] = useState(0);

  useEffect(() => {
    if (!disponibleEn) return;
    const actualizar = () => setSegundos(segundosParaReenviar(disponibleEn));
    actualizar();
    const intervalo = window.setInterval(actualizar, 1000);
    return () => window.clearInterval(intervalo);
  }, [disponibleEn]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    if (enviando || segundosParaReenviar(disponibleEn) > 0) return;
    setEnviando(true);
    try {
      await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/restablecer-contrasena`,
      });
    } catch {
      // La respuesta visible es idéntica también ante errores; no revela cuentas.
    } finally {
      setDisponibleEn(Date.now() + ESPERA_RECUPERACION_MS);
      setSegundos(60);
      setEnviado(true);
      setEnviando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "var(--bg-surface)", fontFamily: "var(--font-family)" }}>
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>Recupera tu contraseña</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>Escribe el correo con el que accedes y te enviaremos un enlace para crear una contraseña nueva.</p>
        </div>
        <form onSubmit={enviar} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="correo-recuperacion" className="text-sm font-semibold">Correo electrónico</label>
            <Input id="correo-recuperacion" type="email" autoComplete="email" required value={email} disabled={enviando} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {enviado && <p role="status" className="text-sm" style={{ color: "var(--text-muted)" }}>Si el correo existe, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.</p>}
          <Button type="submit" className="w-full" disabled={enviando || segundos > 0}>
            {enviando && <Loader2 size={16} className="animate-spin" />}
            Enviar enlace{segundos > 0 ? ` (${segundos}s)` : ""}
          </Button>
        </form>
        <div className="text-center"><Link to="/login" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>Volver al inicio de sesión</Link></div>
      </div>
    </div>
  );
}