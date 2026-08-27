import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, FileCog, Loader2, Pencil, Share2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { LayoutActas } from "@/components/actas/LayoutActas";
import { BadgeEstadoActa, BadgeTipoReunion } from "@/components/actas/BadgesActa";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";
import { usePermisosActas } from "@/hooks/use-permisos-actas";
import {
  BUCKET_FIRMAS,
  BUCKET_IMAGENES,
  BUCKET_PDF,
  formatoFechaHora,
  urlFirmada,
} from "@/lib/actas/actas";
import { generarPdfActa } from "@/lib/actas/pdf";

export const Route = createFileRoute("/_authenticated/digital/apps/actas-reunion/$id/")({
  component: Page,
  head: () => ({
    meta: [
      { title: "Detalle del acta · Ingenio Digital" },
      { name: "description", content: "Consulta el detalle, asistentes y firma de un acta." },
      { property: "og:title", content: "Detalle del acta · Ingenio Digital" },
      {
        property: "og:description",
        content: "Consulta el detalle, asistentes y firma de un acta.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

type Detalle = {
  acta: {
    id: string;
    asunto: string;
    lugar: string;
    fecha_reunion: string;
    tipo_reunion: string;
    tipo_otro_descripcion: string | null;
    notas: string;
    acciones: string | null;
    otros_asistentes: string | null;
    estado: string;
    pdf_url: string | null;
    nombre_pdf: string | null;
    proyecto_id: string | null;
  };
  proyectoNombre: string;
  tipoEtiqueta: string;
  participantes: { nombre: string; origen: string }[];
  imagenes: string[];
  firma: string | null;
  firmaPath: string | null;
};

function Seccion({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section
      className="p-5"
      style={{
        backgroundColor: "var(--bg-surface)",
        border: "var(--border-width-thin) solid var(--border-default)",
        borderRadius: "var(--radius-lg)",
      }}
    >
      <h2 className="mb-3" style={{ fontSize: "var(--text-md)", fontWeight: 700 }}>
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{etiqueta}</div>
      <div style={{ fontSize: "var(--text-sm)", color: "var(--text-primary)" }}>{valor}</div>
    </div>
  );
}

function Page() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuarioCliente } = useAuth();
  const { data: empresa } = useEmpresa();
  const { puedeEditar, puedeEliminar } = usePermisosActas();
  const [generando, setGenerando] = useState(false);
  const [urlPdf, setUrlPdf] = useState<string | null>(null);

  const { data, isLoading } = useQuery<Detalle | null>({
    queryKey: ["actas", "detalle", id],
    queryFn: async () => {
      const { data: acta } = await supabase.from("actas").select("*").eq("id", id).maybeSingle();
      if (!acta) return null;

      let proyectoNombre = "—";
      if (acta.proyecto_id) {
        const { data: p } = await supabase
          .from("proyectos")
          .select("nombre")
          .eq("id", acta.proyecto_id)
          .maybeSingle();
        proyectoNombre = p?.nombre ?? "—";
      }

      const { data: tipo } = await supabase
        .from("catalogo")
        .select("etiqueta")
        .eq("categoria", "tipo_reunion")
        .eq("codigo", acta.tipo_reunion)
        .maybeSingle();

      const { data: filas } = await supabase
        .from("acta_participantes")
        .select("tipo_participante, referencia_nif, nombre_libre")
        .eq("acta_id", id);

      const nifs = (filas ?? [])
        .filter((f) => f.tipo_participante === "interna" && f.referencia_nif)
        .map((f) => f.referencia_nif as string);
      const nombres = new Map<string, string>();
      if (nifs.length) {
        const { data: personas } = await supabase
          .from("personal")
          .select("nif, nombre, apellido_1, apellido_2")
          .in("nif", nifs);
        for (const p of personas ?? []) {
          nombres.set(
            p.nif,
            [p.nombre, p.apellido_1, p.apellido_2].filter(Boolean).join(" "),
          );
        }
      }

      const participantes = (filas ?? []).map((f) =>
        f.tipo_participante === "interna"
          ? {
              nombre: nombres.get(f.referencia_nif ?? "") ?? (f.referencia_nif ?? "—"),
              origen: "Personal interno",
            }
          : { nombre: f.nombre_libre ?? "—", origen: "Externo" },
      );

      const { data: imagenes } = await supabase
        .from("acta_imagenes")
        .select("url")
        .eq("acta_id", id)
        .order("orden");
      const urls = (
        await Promise.all(
          (imagenes ?? []).map((img) => urlFirmada(BUCKET_IMAGENES, img.url)),
        )
      ).filter(Boolean) as string[];

      const { data: firmaFila } = await supabase
        .from("acta_firmas")
        .select("firma_url")
        .eq("acta_id", id)
        .maybeSingle();

      return {
        acta,
        proyectoNombre,
        tipoEtiqueta: tipo?.etiqueta ?? acta.tipo_reunion,
        participantes,
        imagenes: urls,
        firma: await urlFirmada(BUCKET_FIRMAS, firmaFila?.firma_url),
        firmaPath: firmaFila?.firma_url ?? null,
      } as Detalle;
    },
  });

  useEffect(() => {
    let activo = true;
    void (async () => {
      const url = await urlFirmada(BUCKET_PDF, data?.acta.pdf_url);
      if (activo) setUrlPdf(url);
    })();
    return () => {
      activo = false;
    };
  }, [data?.acta.pdf_url]);

  const generar = async () => {
    if (!data || !usuarioCliente) return;
    setGenerando(true);
    try {
      const { path, nombre } = await generarPdfActa(
        {
          id: data.acta.id,
          asunto: data.acta.asunto,
          lugar: data.acta.lugar,
          fecha_reunion: data.acta.fecha_reunion,
          tipoReunionEtiqueta: data.tipoEtiqueta,
          proyectoNombre: data.proyectoNombre,
          notas: data.acta.notas,
          acciones: data.acta.acciones,
          otros_asistentes: data.acta.otros_asistentes,
          participantes: data.participantes.map((p) => p.nombre),
          empresaNombre: empresa?.nombre ?? "",
          firmaPath: data.firmaPath,
        },
        usuarioCliente.cliente_id,
      );
      const { error } = await supabase
        .from("actas")
        .update({ pdf_url: path, nombre_pdf: nombre, estado: "generada" })
        .eq("id", data.acta.id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["actas"] });
      toast.success("PDF generado");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se ha podido generar el PDF");
    } finally {
      setGenerando(false);
    }
  };

  const eliminar = async () => {
    if (!confirm("¿Seguro que quieres eliminar este acta?")) return;
    const { error } = await supabase.from("actas").delete().eq("id", id);
    if (error) {
      toast.error("No se ha podido eliminar el acta");
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["actas"] });
    toast.success("Acta eliminada");
    void navigate({ to: "/digital/apps/actas-reunion" });
  };

  const compartir = async () => {
    const enlace = urlPdf ?? window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: data?.acta.asunto ?? "Acta de reunión", url: enlace });
        return;
      } catch {
        /* cancelado por el usuario */
      }
    }
    await navigator.clipboard.writeText(enlace);
    toast.success("Enlace copiado al portapapeles");
  };

  if (isLoading) {
    return (
      <LayoutActas subtitulo="Detalle del acta">
        <p style={{ color: "var(--text-secondary)" }}>Cargando acta…</p>
      </LayoutActas>
    );
  }

  if (!data) {
    return (
      <LayoutActas subtitulo="Detalle del acta">
        <p style={{ color: "var(--text-secondary)" }}>No se ha encontrado el acta.</p>
        <Link className="btn btn-secondary mt-4" to="/digital/apps/actas-reunion">
          Volver al listado
        </Link>
      </LayoutActas>
    );
  }

  const { acta } = data;

  return (
    <LayoutActas subtitulo={acta.asunto}>
      <div className="flex flex-wrap items-center gap-2">
        <BadgeEstadoActa estado={acta.estado} />
        <BadgeTipoReunion codigo={acta.tipo_reunion} etiqueta={data.tipoEtiqueta} />
        <div className="ml-auto flex flex-wrap gap-2">
          {puedeEditar ? (
            <>
              <Link
                to="/digital/apps/actas-reunion/$id/edit"
                params={{ id: acta.id }}
                className="btn btn-secondary btn-sm"
              >
                <Pencil size={14} /> Editar
              </Link>
              <button
                type="button"
                className="btn btn-sm"
                style={{
                  backgroundColor: "var(--brand-navy-deep)",
                  color: "var(--brand-lime)",
                  borderColor: "var(--brand-navy-deep)",
                }}
                disabled={generando}
                onClick={() => void generar()}
              >
                {generando ? (
                  <Loader2 className="animate-spin" size={14} />
                ) : (
                  <FileCog size={14} />
                )}
                Generar PDF
              </button>
            </>
          ) : null}
          {urlPdf ? (
            <a className="btn btn-secondary btn-sm" href={urlPdf} target="_blank" rel="noreferrer">
              <Download size={14} /> Descargar
            </a>
          ) : null}
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => void compartir()}>
            <Share2 size={14} /> Compartir
          </button>
          {puedeEliminar ? (
            <button type="button" className="btn btn-danger btn-sm" onClick={() => void eliminar()}>
              <Trash2 size={14} /> Eliminar
            </button>
          ) : null}
        </div>
      </div>

      <div className="mt-5 flex max-w-4xl flex-col gap-4">
        <Seccion titulo="Datos generales">
          <div className="grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="Asunto" valor={acta.asunto} />
            <Dato etiqueta="Proyecto" valor={data.proyectoNombre} />
            <Dato etiqueta="Fecha" valor={formatoFechaHora(acta.fecha_reunion)} />
            <Dato etiqueta="Lugar" valor={acta.lugar} />
            <Dato
              etiqueta="Tipo de reunión"
              valor={acta.tipo_otro_descripcion || data.tipoEtiqueta}
            />
          </div>
        </Seccion>

        <Seccion titulo="Asistentes">
          {data.participantes.length === 0 && !acta.otros_asistentes ? (
            <p style={{ color: "var(--text-secondary)", fontSize: "var(--text-sm)" }}>
              Sin asistentes registrados.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {data.participantes.map((p, i) => (
                <li key={`${p.nombre}-${i}`} className="flex items-center gap-2">
                  <span style={{ fontSize: "var(--text-sm)" }}>{p.nombre}</span>
                  <span className="badge badge-neutral">{p.origen}</span>
                </li>
              ))}
              {acta.otros_asistentes ? (
                <li style={{ fontSize: "var(--text-sm)", color: "var(--text-secondary)" }}>
                  Otros: {acta.otros_asistentes}
                </li>
              ) : null}
            </ul>
          )}
        </Seccion>

        <Seccion titulo="Contenido">
          <div style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>Notas</div>
          <p className="whitespace-pre-wrap" style={{ fontSize: "var(--text-sm)" }}>
            {acta.notas}
          </p>
          {acta.acciones ? (
            <>
              <div
                className="mt-4"
                style={{ fontSize: "var(--text-xs)", color: "var(--text-muted)" }}
              >
                Acciones a tomar
              </div>
              <p className="whitespace-pre-wrap" style={{ fontSize: "var(--text-sm)" }}>
                {acta.acciones}
              </p>
            </>
          ) : null}
        </Seccion>

        {data.imagenes.length > 0 ? (
          <Seccion titulo="Imágenes">
            <div className="flex flex-wrap gap-3">
              {data.imagenes.map((url) => (
                <a key={url} href={url} target="_blank" rel="noreferrer">
                  <img
                    src={url}
                    alt="Imagen del acta"
                    className="h-28 w-28 object-cover"
                    style={{ borderRadius: "var(--radius-md)" }}
                  />
                </a>
              ))}
            </div>
          </Seccion>
        ) : null}

        {data.firma ? (
          <Seccion titulo="Firma">
            <img
              src={data.firma}
              alt="Firma del acta"
              className="h-28 w-auto"
              style={{ borderRadius: "var(--radius-md)" }}
            />
          </Seccion>
        ) : null}
      </div>
    </LayoutActas>
  );
}
