import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQueryClient } from "@tanstack/react-query";
import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cambiarContrasenaInicial } from "@/lib/erp/usuarios-alta.functions";
import { obtenerDebeCambiarPassword, perfilAccesoCache } from "@/lib/erp/perfil-acceso";
import { MSG_PASSWORD, MSG_PASSWORD_DISTINTA, passwordValida } from "@/lib/datos-maestros/usuario-alta-reglas";

export const Route = createFileRoute("/cambiar-contrasena")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/login" });
    if (!(await obtenerDebeCambiarPassword())) throw redirect({ to: "/" });
  },
  head: () => ({ meta: [
    { title: "Crea tu contraseña · Ingenio HUB" },
    { name: "description", content: "Establece tu contraseña personal para el primer acceso a Ingenio HUB." },
    { property: "og:title", content: "Crea tu contraseña · Ingenio HUB" },
    { property: "og:description", content: "Establece tu contraseña personal para el primer acceso a Ingenio HUB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: CambiarContrasenaPage,
});

function CambiarContrasenaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const cambiar = useServerFn(cambiarContrasenaInicial);
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [ver, setVer] = useState(false);
  const [verRepetir, setVerRepetir] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valida = passwordValida(password);
  const distintas = repetir.length > 0 && password !== repetir;
  const ocupado = guardando || cerrando;

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (!valida || password !== repetir || ocupado) return;
    setGuardando(true);
    setError(null);
    try {
      const resultado = await cambiar({ data: { password } });
      if (!resultado.ok) { setError(resultado.error); return; }
      setPassword("");
      setRepetir("");
      toast.success("Contraseña actualizada");
      await queryClient.cancelQueries();
      queryClient.clear();
      perfilAccesoCache.limpiar();
      await navigate({ to: "/", replace: true });
    } catch {
      setError("No se pudo actualizar la contraseña. Inténtalo de nuevo.");
    } finally { setGuardando(false); }
  }

  async function cerrarSesion() {
    setCerrando(true);
    setError(null);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      perfilAccesoCache.limpiar();
      const { error: errorSesion } = await supabase.auth.signOut();
      if (errorSesion) throw errorSesion;
      await navigate({ to: "/login", replace: true });
    } catch { setError("No se pudo cerrar la sesión. Inténtalo de nuevo."); }
    finally { setCerrando(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "var(--bg-surface)", fontFamily: "var(--font-family)" }}>
      <div className="w-full max-w-[400px] space-y-6">
        <div className="space-y-2 text-center">
          <h1 style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>Crea tu contraseña</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>Es tu primer acceso. Elige una contraseña personal para continuar.</p>
        </div>
        <form onSubmit={guardar} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="nueva-password" className="text-sm font-semibold">Nueva contraseña</label>
            <div className="relative">
              <Input id="nueva-password" type={ver ? "text" : "password"} autoComplete="new-password" value={password} disabled={ocupado} onChange={(e) => { setPassword(e.target.value); setError(null); }} className="pr-12" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" disabled={ocupado} aria-label={ver ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"} onClick={() => setVer(!ver)}>{ver ? <EyeOff size={18} /> : <Eye size={18} />}</Button>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Mínimo 8 caracteres, con letras y números.</p>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="repetir-password" className="text-sm font-semibold">Repetir contraseña</label>
            <div className="relative">
              <Input id="repetir-password" type={verRepetir ? "text" : "password"} autoComplete="new-password" value={repetir} disabled={ocupado} onChange={(e) => { setRepetir(e.target.value); setError(null); }} className="pr-12" />
              <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" disabled={ocupado} aria-label={verRepetir ? "Ocultar repetición de contraseña" : "Mostrar repetición de contraseña"} onClick={() => setVerRepetir(!verRepetir)}>{verRepetir ? <EyeOff size={18} /> : <Eye size={18} />}</Button>
            </div>
          </div>
          <div aria-live="polite">
            {password.length > 0 && !valida && <p className="text-sm" style={{ color: "var(--state-error)" }}>{MSG_PASSWORD}</p>}
            {distintas && <p className="text-sm" style={{ color: "var(--state-error)" }}>{MSG_PASSWORD_DISTINTA}</p>}
            {error && <p className="text-sm" role="alert" style={{ color: "var(--state-error)" }}>{error}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={!valida || password !== repetir || ocupado}>{guardando && <Loader2 size={16} className="animate-spin" />}Guardar contraseña</Button>
          <Button type="button" variant="outline" className="w-full" disabled={ocupado} onClick={() => void cerrarSesion()}>Cerrar sesión</Button>
        </form>
      </div>
    </div>
  );
}