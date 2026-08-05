import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { ProyectoListado } from "./proyectos.types";

type PageResult<T> = PromiseLike<{
  data: T[] | null;
  error: { message: string } | null;
}>;

async function readAll<T>(
  load: (from: number, to: number) => PageResult<T>,
): Promise<T[]> {
  const pageSize = 1_000;
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await load(from, from + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = data ?? [];
    rows.push(...page);
    if (page.length < pageSize) return rows;
  }
}

export async function readProyectosCliente(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<ProyectoListado[]> {
  const { data: usuario, error: usuarioError } = await supabase
    .from("usuarios_cliente")
    .select("cliente_id")
    .eq("user_id", userId)
    .eq("activo", true)
    .limit(1)
    .maybeSingle();
  if (usuarioError) throw usuarioError;
  if (!usuario?.cliente_id) return [];

  const clienteId = usuario.cliente_id;
  const [proyectos, configs, propiedadesCliente, propiedades, provincias] = await Promise.all([
    readAll((from, to) =>
      supabase
        .from("proyectos")
        .select(
          "id, nombre, codigo_estudios, codigo_obra, propiedad_id, provincia_id, tipo_obra, estado",
        )
        .eq("cliente_id", clienteId)
        .range(from, to),
    ),
    readAll((from, to) =>
      supabase
        .from("proyectos_config")
        .select("proyecto_id, presupuesto_venta_estimado")
        .eq("cliente_id", clienteId)
        .range(from, to),
    ),
    readAll((from, to) =>
      supabase
        .from("clientes_propiedades")
        .select("propiedad_id, nombre_comercial")
        .eq("cliente_id", clienteId)
        .range(from, to),
    ),
    readAll((from, to) =>
      supabase.from("propiedad").select("id, nombre_legal").range(from, to),
    ),
    readAll((from, to) =>
      supabase.from("catalogo_provincias").select("id, nombre").range(from, to),
    ),
  ]);

  const presupuestos = new Map(
    configs.map((row) => [row.proyecto_id, row.presupuesto_venta_estimado]),
  );
  const nombresComerciales = new Map(
    propiedadesCliente.map((row) => [row.propiedad_id, row.nombre_comercial]),
  );
  const nombresLegales = new Map(propiedades.map((row) => [row.id, row.nombre_legal]));
  const nombresProvincia = new Map(provincias.map((row) => [row.id, row.nombre]));

  return proyectos.map((proyecto) => ({
    id: proyecto.id,
    nombre: proyecto.nombre,
    codigoEstudios: proyecto.codigo_estudios,
    codigoObra: proyecto.codigo_obra,
    propiedadNombre:
      nombresComerciales.get(proyecto.propiedad_id) ||
      nombresLegales.get(proyecto.propiedad_id) ||
      null,
    tipoObra: proyecto.tipo_obra,
    region: proyecto.provincia_id
      ? (nombresProvincia.get(proyecto.provincia_id) ?? null)
      : null,
    presupuestoVenta: presupuestos.get(proyecto.id) ?? null,
    estado: proyecto.estado,
  }));
}
