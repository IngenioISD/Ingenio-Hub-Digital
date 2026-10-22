import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { perfilAccesoCache } from "@/lib/erp/perfil-acceso";
import { MSG_PASSWORD, MSG_PASSWORD_DISTINTA, passwordValida } from "@/lib/datos-maestros/usuario-alta-reglas";

export const Route = createFileRoute("/restablecer-contrasena")({
  head: () => ({ meta: [
    { title: "Restablece tu contraseña · Ingenio HUB" },
    { name: "description", content: "Crea una nueva contraseña para acceder a Ingenio HUB." },
    { property: "og:title", content: "Restablece tu contraseña · Ingenio HUB" },
    { property: "og:description", content: "Crea una nueva contraseña para acceder a Ingenio HUB." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: RestablecerContrasenaPage,
});

function RestablecerContrasenaPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [estado, setEstado] = useState<"cargando" | "valido" | "invalido">("cargando");
  const [password, setPassword] = useState("");
  const [repetir, setRepetir] = useState("");
  const [ver, setVer] = useState(false);
  const [verRepetir, setVerRepetir] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [actualizada, setActualizada] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valida = passwordValida(password);
  const distintas = repetir.length > 0 && password !== repetir;

  useEffect(() => {
    let activo = true;
    // getSession espera la inicialización del SDK y el intercambio del enlace.
    // getUser verifica después la sesión con el servidor de Auth.
    async function comprobar() {
      try {
        const { data, error: errorSesion } = await supabase.auth.getSession();
        if (errorSesion || !data.session) {
          if (activo) setEstado("invalido");
          return;
        }
        const { data: usuario, error: errorUsuario } = await supabase.auth.getUser();
        if (activo) setEstado(!errorUsuario && usuario.user ? "valido" : "invalido");
      } catch { if (activo) setEstado("invalido"); }
    }
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === "PASSWORD_RECOVERY") {
        // No llamar métodos Auth dentro del callback: el SDK mantiene su bloqueo.
        window.setTimeout(() => { if (activo) void comprobar(); }, 0);
      }
    });
    const parametros = new URLSearchParams(window.location.hash.slice(1));
    if (parametros.has("error") || parametros.has("error_code")) setEstado("invalido");
    else void comprobar();
    return () => { activo = false; subscription.unsubscribe(); };
  }, []);

  async function guardar(e: FormEvent) {
    e.preventDefault();
    if (estado !== "valido" || guardando || (!actualizada && (!valida || password !== repetir))) return;
    setGuardando(true);
    setError(null);
    let cambioRealizado = actualizada;
    try {
      if (!cambioRealizado) {
        const { error: errorPassword } = await supabase.auth.updateUser({ password });
        if (errorPassword) throw errorPassword;
        cambioRealizado = true;
        setActualizada(true);
        setPassword("");
        setRepetir("");
      }
      await queryClient.cancelQueries();
      queryClient.clear();
      perfilAccesoCache.limpiar();
      const { error: errorSesion } = await supabase.auth.signOut();
      if (errorSesion) throw errorSesion;
      toast.success("Contraseña actualizada. Inicia sesión con la nueva.");
      await navigate({ to: "/login", replace: true });
    } catch {
      setError(cambioRealizado ? "La contraseña se ha actualizado, pero no se pudo cerrar la sesión. Inténtalo de nuevo." : "No se pudo actualizar la contraseña. Inténtalo de nuevo.");
    } finally { setGuardando(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6" style={{ backgroundColor: "var(--bg-surface)", fontFamily: "var(--font-family)" }}>
      <div className="w-full max-w-[400px] space-y-6">
        {estado === "cargando" ? <div role="status" className="flex justify-center"><Loader2 className="animate-spin" aria-label="Comprobando enlace" /></div> : estado === "invalido" ? (
          <div className="space-y-6 text-center">
            <p role="alert" style={{ color: "var(--state-error)" }}>El enlace no es válido o ha caducado.</p>
            <Link to="/recuperar-contrasena" style={{ color: "var(--text-muted)", fontSize: "var(--text-sm)" }}>Recupera tu contraseña</Link>
          </div>
        ) : (
          <>
            <h1 className="text-center" style={{ fontSize: "24px", fontWeight: 700, color: "var(--text-primary)" }}>Crea tu nueva contraseña</h1>
            <form onSubmit={guardar} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="nueva-password" className="text-sm font-semibold">Nueva contraseña</label>
                <div className="relative">
                  <Input id="nueva-password" type={ver ? "text" : "password"} autoComplete="new-password" value={password} disabled={guardando || actualizada} onChange={(e) => { setPassword(e.target.value); setError(null); }} className="pr-12" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" disabled={guardando || actualizada} aria-label={ver ? "Ocultar nueva contraseña" : "Mostrar nueva contraseña"} onClick={() => setVer(!ver)}>{ver ? <EyeOff size={18} /> : <Eye size={18} />}</Button>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Mínimo 8 caracteres, con letras y números.</p>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="repetir-password" className="text-sm font-semibold">Repetir contraseña</label>
                <div className="relative">
                  <Input id="repetir-password" type={verRepetir ? "text" : "password"} autoComplete="new-password" value={repetir} disabled={guardando || actualizada} onChange={(e) => { setRepetir(e.target.value); setError(null); }} className="pr-12" />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-0 top-0" disabled={guardando || actualizada} aria-label={verRepetir ? "Ocultar repetición de contraseña" : "Mostrar repetición de contraseña"} onClick={() => setVerRepetir(!verRepetir)}>{verRepetir ? <EyeOff size={18} /> : <Eye size={18} />}</Button>
                </div>
              </div>
              <div aria-live="polite">
                {password.length > 0 && !valida && <p className="text-sm" style={{ color: "var(--state-error)" }}>{MSG_PASSWORD}</p>}
                {distintas && <p className="text-sm" style={{ color: "var(--state-error)" }}>{MSG_PASSWORD_DISTINTA}</p>}
                {error && <p className="text-sm" role="alert" style={{ color: "var(--state-error)" }}>{error}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={guardando || (!actualizada && (!valida || password !== repetir))}>{guardando && <Loader2 size={16} className="animate-spin" />}{actualizada ? "Cerrar sesión" : "Guardar contraseña"}</Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}