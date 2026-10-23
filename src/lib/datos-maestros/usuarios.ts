import { supabase } from "@/integrations/supabase/client";

export type UsuarioFila = {
  id: string;
  userId: string;
  rolId: string;
  accesoDesactivado: boolean;
  accesoTotalProyectos: boolean;
  activo: boolean;
  personalId: string;
  nombre: string;
  apellido1: string;
  nombreCompleto: string;
  email: string;
  puestoId: string | null;
  estadoId: string | null;
  fichaActiva: boolean;
  debeCambiarPassword: boolean;
  creadoEn: string | null;
};

export type CatalogoFila = { id: string; tipo: string; nombre: string; rol_id: string | null; cuenta_como_activo: boolean | null };
export type RolFila = { rol_id: string; nombre_visible: string; tipo_portal: string; activo: boolean | null };

type Raw = {
  id: string; user_id: string; rol_id: string; acceso_desactivado: boolean;
  acceso_total_proyectos: boolean | null; activo: boolean | null; personal_id: string;
  debe_cambiar_password: boolean | null; creado_en: string | null;
  personal: { nombre: string; apellido_1: string; apellido_2: string | null; email: string | null;
    puesto_id: string | null; estado_id: string | null; activo: boolean | null } | null;
};

const SELECT =
  "id, user_id, rol_id, acceso_desactivado, acceso_total_proyectos, activo, personal_id, debe_cambiar_password, creado_en, personal(nombre, apellido_1, apellido_2, email, puesto_id, estado_id, activo)";

function mapear(r: Raw): UsuarioFila {
  const p = r.personal;
  const ap = [p?.apellido_1, p?.apellido_2].filter(Boolean).join(" ");
  return {
    id: r.id, userId: r.user_id, rolId: r.rol_id,
    accesoDesactivado: Boolean(r.acceso_desactivado),
    accesoTotalProyectos: Boolean(r.acceso_total_proyectos),
    activo: Boolean(r.activo), personalId: r.personal_id,
    nombre: p?.nombre ?? "", apellido1: p?.apellido_1 ?? "",
    nombreCompleto: p ? `${ap}, ${p.nombre}` : "—",
    email: p?.email ?? "", puestoId: p?.puesto_id ?? null, estadoId: p?.estado_id ?? null,
    fichaActiva: p?.activo !== false,
    debeCambiarPassword: Boolean(r.debe_cambiar_password), creadoEn: r.creado_en ?? null,
  };
}

export async function listarUsuarios(clienteId: string): Promise<UsuarioFila[]> {
  const { data, error } = await (supabase.from("usuarios_cliente") as any)
    .select(SELECT).eq("cliente_id", clienteId);
  if (error) throw error;
  return ((data ?? []) as Raw[]).map(mapear);
}

export async function obtenerUsuario(clienteId: string, id: string): Promise<UsuarioFila | null> {
  const { data, error } = await (supabase.from("usuarios_cliente") as any)
    .select(SELECT).eq("cliente_id", clienteId).eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapear(data as Raw) : null;
}

export async function listarCatalogos(clienteId: string): Promise<Map<string, CatalogoFila>> {
  const { data, error } = await (supabase.from("cliente_catalogos") as any)
    .select("id, tipo, nombre, rol_id, cuenta_como_activo").eq("cliente_id", clienteId);
  if (error) throw error;
  return new Map(((data ?? []) as CatalogoFila[]).map((c) => [c.id, c]));
}

export async function listarRoles(clienteId: string): Promise<RolFila[]> {
  const { data, error } = await supabase
    .from("cliente_roles").select("rol_id, nombre_visible, tipo_portal, activo").eq("cliente_id", clienteId);
  if (error) throw error;
  return (data ?? []) as RolFila[];
}

export async function cambiarAccesoDesactivado(id: string, valor: boolean) {
  const { error } = await supabase.from("usuarios_cliente").update({ acceso_desactivado: valor }).eq("id", id);
  if (error) throw error;
}

/** True si Personal bloquea el acceso: ficha inactiva o estado que no cuenta como activo. */
export function bloqueadoPorPersonal(u: UsuarioFila, cats: Map<string, CatalogoFila>): boolean {
  if (!u.fichaActiva) return true;
  if (!u.estadoId) return false;
  const estado = cats.get(u.estadoId);
  return estado ? estado.cuenta_como_activo === false : false;
}

/** Devuelve el nombre del puesto si su rol equivalente difiere del rol del usuario. */
export function puestoConRolDistinto(u: UsuarioFila, cats: Map<string, CatalogoFila>): string | null {
  if (!u.puestoId) return null;
  const p = cats.get(u.puestoId);
  if (!p?.rol_id) return null;
  return p.rol_id !== u.rolId ? p.nombre : null;
}
