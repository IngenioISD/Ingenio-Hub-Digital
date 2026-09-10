import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProyectoInicio = {
  id: string;
  nombre: string;
  estado: string;
  provincia: string | null;
  tipoObra: string | null;
  propiedadNombre: string | null;
  presupuestoVenta: number | null;
};

export type ProyectoDetalle = {
  id: string;
  nombre: string;
  estado: string;
  codigoObra: string | null;
  tipoObra: string | null;
  tipoVia: string | null;
  nombreVia: string | null;
  numero: string | null;
  municipio: string | null;
  provincia: string | null;
  fechaAdjudicacion: string | null;
  fechaInicioProyecto: string | null;
  plazoEjecucionMeses: number | null;
};

/** Proyectos del cliente del usuario autenticado (RLS + filtro explícito por cliente). */
export const getProyectosInicio = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProyectoInicio[]> => {
    const { supabase, userId } = context;

    const { data: usuario } = await supabase
      .from("usuarios_cliente")
      .select("cliente_id, acceso_total_proyectos")
      .eq("user_id", userId)
      .eq("activo", true)
      .maybeSingle();

    const clienteId = usuario?.cliente_id;
    if (!clienteId) return [];

    const accesoTotal = usuario?.acceso_total_proyectos === true;

    let proyectoIds: string[] | null = null;
    if (!accesoTotal) {
      const { data: asignaciones } = await supabase
        .from("usuario_proyectos")
        .select("proyecto_id")
        .eq("user_id", userId)
        .eq("activo", true);
      proyectoIds = (asignaciones ?? []).map((a) => a.proyecto_id);
      if (proyectoIds.length === 0) return [];
    }

    let consulta = supabase
      .from("proyectos")
      .select("id, nombre, estado, provincia, tipo_obra, propiedad_id")
      .eq("cliente_id", clienteId)
      .eq("activo", true);
    if (proyectoIds) consulta = consulta.in("id", proyectoIds);

    const { data: proyectos, error } = await consulta;
    if (error) throw error;

    const { data: configs } = await supabase
      .from("proyectos_config")
      .select("proyecto_id, presupuesto_venta_estimado")
      .eq("cliente_id", clienteId);

    const presupuestos = new Map(
      (configs ?? []).map((c) => [c.proyecto_id, c.presupuesto_venta_estimado]),
    );


    const { data: propiedadesCliente } = await supabase
      .from("clientes_propiedades")
      .select("propiedad_id, nombre_comercial")
      .eq("cliente_id", clienteId);

    const { data: propiedades } = await supabase.from("propiedad").select("id, nombre_legal");

    const comercial = new Map(
      (propiedadesCliente ?? []).map((p) => [p.propiedad_id, p.nombre_comercial]),
    );
    const legal = new Map((propiedades ?? []).map((p) => [p.id, p.nombre_legal]));

    return (proyectos ?? []).map((p) => {
      const presupuesto = presupuestos.get(p.id) ?? null;



      return {
        id: p.id,
        nombre: p.nombre,
        estado: p.estado,
        provincia: p.provincia,
        tipoObra: p.tipo_obra,
        propiedadNombre:
          comercial.get(p.propiedad_id) ?? legal.get(p.propiedad_id) ?? null,
        presupuestoVenta: presupuesto,
      };
    });
  });

export const getProyectoDetalle = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { id: string }) => data)
  .handler(async ({ data, context }): Promise<ProyectoDetalle | null> => {
    const { data: p, error } = await context.supabase
      .from("proyectos")
      .select(
        "id, nombre, estado, codigo_obra, tipo_obra, tipo_via, nombre_via, numero, municipio, provincia, fecha_adjudicacion, fecha_inicio_proyecto, plazo_ejecucion_meses",
      )
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw error;
    if (!p) return null;

    return {
      id: p.id,
      nombre: p.nombre,
      estado: p.estado,
      codigoObra: p.codigo_obra,
      tipoObra: p.tipo_obra,
      tipoVia: p.tipo_via,
      nombreVia: p.nombre_via,
      numero: p.numero,
      municipio: p.municipio,
      provincia: p.provincia,
      fechaAdjudicacion: p.fecha_adjudicacion,
      fechaInicioProyecto: p.fecha_inicio_proyecto,
      plazoEjecucionMeses: p.plazo_ejecucion_meses,
    };
  });
