import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { MSG_EMAIL_EXISTE, MSG_PASSWORD, MSG_SIN_EMAIL, passwordValida } from "@/lib/datos-maestros/usuario-alta-reglas";

const Entrada = z.object({
  personalId: z.string().uuid(),
  rolId: z.string().min(1).max(100),
  accesoTotalProyectos: z.boolean(),
  proyectoIds: z.array(z.string().uuid()).max(5000),
  password: z.string().max(200),
});

type Resultado = { ok: true } | { ok: false; error: string };
type PersonaPendiente = { id: string; email: string | null };

export const crearUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Entrada.parse(d))
  .handler(async ({ data, context }): Promise<Resultado> => {
    const sb = context.supabase;
    const fallo = (error: string): Resultado => ({ ok: false, error });

    // a) permiso
    const { data: puede } = await sb.rpc("usuarios_puede", { p_accion: "crear" } as never);
    if (puede !== true) return fallo("No tienes permiso para crear usuarios");

    // b) contraseña
    if (!passwordValida(data.password)) return fallo(MSG_PASSWORD);

    // c) persona disponible
    const { data: pendientes, error: ePend } = await sb.rpc("personal_sin_usuario", {} as never);
    if (ePend) return fallo("No se pudo comprobar el personal disponible");
    const persona = ((pendientes ?? []) as PersonaPendiente[]).find((p) => p.id === data.personalId);
    if (!persona) return fallo("La persona no está disponible para crear usuario");

    // d) email
    const email = persona.email?.trim();
    if (!email) return fallo(MSG_SIN_EMAIL);

    // e) email sin cuenta
    const { data: existe, error: eEmail } = await sb.rpc("email_con_cuenta", { p_email: email } as never);
    if (eEmail) return fallo("No se pudo comprobar el correo electrónico");
    if (existe === true) return fallo(MSG_EMAIL_EXISTE);

    // f) rol y proyectos de mi empresa
    const { data: clienteId } = await sb.rpc("mi_cliente_id", {} as never);
    if (!clienteId) return fallo("No se pudo identificar tu empresa");
    const { data: rol } = await sb.from("cliente_roles").select("rol_id")
      .eq("cliente_id", clienteId as string).eq("rol_id", data.rolId)
      .eq("tipo_portal", "interno").eq("activo", true).maybeSingle();
    if (!rol) return fallo("El rol elegido no es válido");
    const proyectoIds = data.accesoTotalProyectos ? [] : Array.from(new Set(data.proyectoIds));
    if (!data.accesoTotalProyectos) {
      if (!proyectoIds.length) return fallo("Selecciona al menos un proyecto");
      const { data: proys, error: eProy } = await sb.from("proyectos").select("id")
        .eq("cliente_id", clienteId as string).in("id", proyectoIds);
      if (eProy || (proys ?? []).length !== proyectoIds.length) return fallo("Alguno de los proyectos elegidos no es válido");
    }

    // g) crear cuenta
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: creada, error: eAuth } = await supabaseAdmin.auth.admin.createUser({ email, password: data.password, email_confirm: true });
    if (eAuth || !creada?.user) {
      const msg = (eAuth?.message ?? "").toLowerCase();
      if ((eAuth as { code?: string } | null)?.code === "email_exists" || msg.includes("already")) return fallo(MSG_EMAIL_EXISTE);
      console.error("[crearUsuario] error al crear la cuenta");
      return fallo("No se pudo crear la cuenta de acceso");
    }
    const userId = creada.user.id;

    // h, i) filas; j) deshacer si falla
    let usuarioClienteId: string | null = null;
    try {
      const { data: uc, error: eUc } = await supabaseAdmin.from("usuarios_cliente").insert({
        user_id: userId, cliente_id: clienteId as string, personal_id: data.personalId,
        rol_id: data.rolId, acceso_total_proyectos: data.accesoTotalProyectos, debe_cambiar_password: true,
      } as never).select("id").single();
      if (eUc || !uc) throw new Error("No se pudo registrar el usuario en la empresa");
      usuarioClienteId = (uc as { id: string }).id;
      if (proyectoIds.length) {
        const { error: eUp } = await supabaseAdmin.from("usuario_proyectos").insert(
          proyectoIds.map((proyecto_id) => ({ user_id: userId, cliente_id: clienteId as string, proyecto_id, activo: true })) as never,
        );
        if (eUp) throw new Error("No se pudieron asignar los proyectos");
      }
    } catch (e) {
      await supabaseAdmin.from("usuario_proyectos").delete().eq("user_id", userId);
      if (usuarioClienteId) await supabaseAdmin.from("usuarios_cliente").delete().eq("id", usuarioClienteId);
      else await supabaseAdmin.from("usuarios_cliente").delete().eq("user_id", userId);
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return fallo(e instanceof Error ? e.message : "No se pudo crear el usuario");
    }

    return { ok: true };
  });
