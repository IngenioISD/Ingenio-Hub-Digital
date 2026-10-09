import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ArrowLeft, Save, Pencil, X, Plus, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { usePermisosDatosMaestros } from "@/hooks/use-permisos-datos-maestros";

import { useProvincias } from "@/components/datos-maestros/ProvinciaSelect";
import { DireccionObraFields, type DireccionObra } from "@/components/datos-maestros/DireccionObraFields";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/datos-maestros/entidades-obra/propiedad/$id")({
  head: () => ({ meta: [{ title: "Propiedad · Datos Maestros · Ingenio HUB" }] }),
  component: Page,
});

const NIF_LONGITUD = 9;
/** Mayúsculas y solo letras/números (quita espacios y guiones), máximo 9. */
const normalizarNif = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, NIF_LONGITUD);

interface PropiedadData {
  id: string;
  nif: string | null;
  nombre_legal: string | null;
  tipo_via: string | null;
  nombre_via: string | null;
  numero: string | null;
  codigo_postal: string | null;
  municipio: string | null;
  provincia_id: string | null;
}

function Page() {
  return <PropiedadDetail />;
}

function PropiedadDetail() {
  const { id } = Route.useParams();
  const { usuarioCliente } = useAuth();
  const { puedeEditar } = usePermisosDatosMaestros();
  const clienteId = usuarioCliente?.cliente_id;
  const qc = useQueryClient();
  const queryKey = ["datos-maestros", "propiedad", id, clienteId] as const;

  const { data, isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const [{ data: prop, error: errProp }, { data: cp, error: errCp }] = await Promise.all([
        supabase
          .from("propiedad")
          .select("id, nif, nombre_legal, tipo_via, nombre_via, numero, codigo_postal, municipio, provincia_id")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("clientes_propiedades")
          .select("id, nombre_comercial")
          .eq("propiedad_id", id)
          .eq("cliente_id", clienteId!)
          .maybeSingle(),
      ]);
      if (errProp) throw errProp;
      if (errCp) throw errCp;
      return { propiedad: prop as PropiedadData | null, clientePropiedad: cp };
    },
  });

  const [editMode, setEditMode] = useState(false);
  const [nif, setNif] = useState("");
  const [nombreLegal, setNombreLegal] = useState("");
  const [nombreComercial, setNombreComercial] = useState("");
  const [dirObra, setDirObra] = useState<DireccionObra>({});
  const [provinciaId, setProvinciaId] = useState<string | null>(null);

  const resetForm = () => {
    if (!data?.propiedad) return;
    setNif(data.propiedad.nif ?? "");
    setNombreLegal(data.propiedad.nombre_legal ?? "");
    setNombreComercial(data.clientePropiedad?.nombre_comercial ?? "");
    setDirObra({
      tipoVia: data.propiedad.tipo_via,
      via: data.propiedad.nombre_via,
      numero: data.propiedad.numero,
      cp: data.propiedad.codigo_postal,
      municipio: data.propiedad.municipio,
    });
    setProvinciaId(data.propiedad.provincia_id);
  };

  useEffect(() => {
    if (data) resetForm();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data]);

  const [errorNombres, setErrorNombres] = useState<string | null>(null);
  const [errorNif, setErrorNif] = useState<string | null>(null);

  const { data: tiposVia = [] } = useQuery({
    queryKey: ["catalogo", "tipo_via"],
    staleTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data, error } = await supabase.from("catalogo").select("codigo, etiqueta").eq("categoria", "tipo_via");
      if (error) throw error;
      return (data ?? []) as { codigo: string; etiqueta: string | null }[];
    },
  });
  const tipoViaLabel = (codigo: string | null | undefined) =>
    (codigo && tiposVia.find((t) => t.codigo === codigo)?.etiqueta) || codigo || "";

  const { data: provincias = [] } = useProvincias();
  const provinciaNombre = provincias.find((p) => p.id === provinciaId)?.nombre ?? "";

  // Ej.: "Avenida de Juan, 3. 28043 Madrid (Madrid)"
  const calle = [[tipoViaLabel(dirObra.tipoVia), dirObra.via].filter(Boolean).join(" "), dirObra.numero]
    .filter(Boolean)
    .join(", ");
  const localidad = [dirObra.cp, dirObra.municipio].filter(Boolean).join(" ");
  const localidadConProvincia = provinciaNombre
    ? [localidad, `(${provinciaNombre})`].filter(Boolean).join(" ")
    : localidad;
  const direccionTexto = [calle, localidadConProvincia].filter(Boolean).join(". ");

  const save = useMutation({
    mutationFn: async () => {
      const legal = nombreLegal.trim();
      const comercial = nombreComercial.trim();
      if (!legal && !comercial) {
        throw new Error("Indica al menos el nombre legal o el nombre comercial");
      }
      if (nif.length !== NIF_LONGITUD) {
        throw new Error(`El NIF debe tener ${NIF_LONGITUD} caracteres`);
      }
      // Si solo se rellena el legal, se copia también al comercial.
      // Si solo se rellena el comercial, el legal se queda en blanco (no se inventa un nombre legal).
      const legalFinal = legal;
      const comercialFinal = comercial || legal;

      const { error: errProp } = await supabase
        .from("propiedad")
        .update({
          nif,
          nombre_legal: legalFinal || null,
          tipo_via: dirObra.tipoVia || null,
          nombre_via: dirObra.via || null,
          numero: dirObra.numero || null,
          codigo_postal: dirObra.cp || null,
          municipio: dirObra.municipio || null,
          provincia_id: provinciaId,
        })
        .eq("id", id);
      if (errProp) {
        // 23505 = clave duplicada: ya hay otra propiedad con ese NIF.
        if ((errProp as { code?: string }).code === "23505") {
          throw new Error("Ya existe otra propiedad con ese NIF.");
        }
        throw errProp;
      }

      if (data?.clientePropiedad?.id) {
        const { error: errCp } = await supabase
          .from("clientes_propiedades")
          .update({ nombre_comercial: comercialFinal })
          .eq("id", data.clientePropiedad.id);
        if (errCp) throw errCp;
      }
    },
    onSuccess: () => {
      toast.success("Cambios guardados");
      setEditMode(false);
      qc.invalidateQueries({ queryKey });
      qc.invalidateQueries({ queryKey: ["datos-maestros", "propiedades"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Cargando…</div>;
  if (!data?.propiedad) return <div className="text-sm text-muted-foreground">No encontrado.</div>;

  const editing = puedeEditar && editMode;

  const Field = ({ label, value, blankIfEmpty }: { label: string; value: string; blankIfEmpty?: boolean }) => (
    <div className="space-y-1">
      <Label className="text-muted-foreground">{label}</Label>
      <p className="text-sm">
        {value || (blankIfEmpty ? "" : <span className="text-muted-foreground">—</span>)}
      </p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/datos-maestros/entidades-obra/propiedad">
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver
          </Link>
        </Button>
        <h1 className="text-xl font-bold">{nombreComercial || nombreLegal}</h1>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle>Datos generales</CardTitle>
          {puedeEditar && !editing && (
            <Button size="icon" variant="ghost" onClick={() => setEditMode(true)} aria-label="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
          )}
          {editing && (
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => { resetForm(); setErrorNombres(null); setErrorNif(null); setEditMode(false); }}>
                <X className="mr-2 h-4 w-4" /> Cancelar
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  const sinNombres = !nombreLegal.trim() && !nombreComercial.trim();
                  const nifMal = nif.length !== NIF_LONGITUD;
                  setErrorNombres(sinNombres ? "Indica al menos el nombre legal o el nombre comercial." : null);
                  setErrorNif(nifMal ? `El NIF debe tener ${NIF_LONGITUD} caracteres.` : null);
                  if (sinNombres || nifMal) return;
                  save.mutate();
                }}
                disabled={save.isPending}
              >
                <Save className="mr-2 h-4 w-4" /> Guardar
              </Button>
            </div>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {editing ? (
              <>
                <div className="space-y-1.5 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">
                    Rellena al menos uno de los dos nombres. Si solo pones el legal, se copiará también como comercial.
                  </p>
                  {errorNombres && <p className="text-xs font-medium text-destructive">{errorNombres}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre legal</Label>
                  <Input value={nombreLegal} onChange={(e) => setNombreLegal(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Nombre comercial</Label>
                  <Input value={nombreComercial} onChange={(e) => setNombreComercial(e.target.value)} />
                </div>
              </>
            ) : (
              <>
                <Field label="Nombre legal" value={nombreLegal} blankIfEmpty />
                <Field label="Nombre comercial" value={nombreComercial} blankIfEmpty />
              </>
            )}
          </div>

          <div className="border-t pt-4">
            {editing ? (
              <div className="space-y-4">
                <div className="max-w-xs space-y-1.5">
                  <Label>NIF</Label>
                  <Input
                    value={nif}
                    onChange={(e) => { setNif(normalizarNif(e.target.value)); setErrorNif(null); }}
                    maxLength={NIF_LONGITUD}
                  />
                  {(errorNif || (nif.length > 0 && nif.length !== NIF_LONGITUD)) && (
                    <p className="text-xs font-medium text-destructive">
                      {errorNif ?? `El NIF debe tener ${NIF_LONGITUD} caracteres (${nif.length} de ${NIF_LONGITUD}).`}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dirección</Label>
                  <DireccionObraFields
                    value={dirObra}
                    onChange={setDirObra}
                    provinciaId={provinciaId}
                    onProvinciaChange={setProvinciaId}
                  />
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="NIF" value={nif} />
                <Field label="Dirección" value={direccionTexto} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ProyectosPropiedad propiedadId={id} clienteId={clienteId} />

      <Card>
        <CardHeader>
          <CardTitle>Contactos</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactosPropiedad propiedadId={id} clienteId={clienteId} />
        </CardContent>
      </Card>
    </div>
  );
}

const ESTADO_PROYECTO: Record<string, string> = {
  en_estudio: "En estudio",
  adjudicado: "Adjudicado",
  perdido: "Perdido",
  finalizado: "Finalizado",
};

/**
 * Proyectos (obras) de esta propiedad para la empresa del usuario. Cuando
 * exista el módulo de Gestión de contratos, aquí se añadirán también los
 * contratos de cada proyecto.
 */
function ProyectosPropiedad({ propiedadId, clienteId }: { propiedadId: string; clienteId: string | undefined }) {
  const { data = [], isLoading } = useQuery({
    queryKey: ["datos-maestros", "propiedad-proyectos", propiedadId, clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("proyectos")
        .select("id, nombre, codigo_obra, codigo_estudios, estado")
        .eq("propiedad_id", propiedadId)
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? []).sort((a, b) => (a.nombre ?? "").localeCompare(b.nombre ?? "", "es"));
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Proyectos</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
        {!isLoading && data.length === 0 && (
          <p className="text-sm text-muted-foreground">Esta propiedad todavía no tiene proyectos.</p>
        )}
        <div className="space-y-3">
          {data.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-3 border-l-2 pl-3">
              <div className="space-y-0.5 text-sm">
                <Link
                  to="/datos-maestros/entidades-obra/proyectos/$id"
                  params={{ id: p.id }}
                  className="font-medium hover:underline"
                >
                  {p.nombre}
                </Link>
                {(p.codigo_obra || p.codigo_estudios) && (
                  <p className="text-xs text-muted-foreground">{p.codigo_obra || p.codigo_estudios}</p>
                )}
              </div>
              <Badge variant="outline">{ESTADO_PROYECTO[p.estado] ?? p.estado}</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ContactoRow {
  linkId: string;
  activo: boolean;
  contacto: {
    id: string;
    nombre: string | null;
    apellido_1: string | null;
    apellido_2: string | null;
    departamento: string | null;
    telefono: string | null;
    email: string | null;
  };
}

function ContactosPropiedad({ propiedadId, clienteId }: { propiedadId: string; clienteId: string | undefined }) {
  const { puedeCrear, puedeEditar, puedeEliminar } = usePermisosDatosMaestros();
  const qc = useQueryClient();
  const queryKey = ["datos-maestros", "propiedad-contactos", propiedadId, clienteId] as const;

  const { data = [], isLoading } = useQuery({
    queryKey,
    enabled: !!clienteId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cliente_propiedad_contactos")
        .select("id, activo, propiedad_contactos(id, nombre, apellido_1, apellido_2, departamento, telefono, email)")
        .eq("propiedad_id", propiedadId)
        .eq("cliente_id", clienteId!);
      if (error) throw error;
      return (data ?? [])
        .map((r): ContactoRow | null => {
          const c = Array.isArray(r.propiedad_contactos) ? r.propiedad_contactos[0] : r.propiedad_contactos;
          if (!c) return null;
          return { linkId: r.id, activo: r.activo, contacto: c };
        })
        .filter((r): r is ContactoRow => r !== null);
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ linkId, activo }: { linkId: string; activo: boolean }) => {
      const { error } = await supabase.from("cliente_propiedad_contactos").update({ activo }).eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey }),
    onError: (e: Error) => toast.error(e.message),
  });

  const quitar = useMutation({
    mutationFn: async (linkId: string) => {
      const { error } = await supabase.from("cliente_propiedad_contactos").delete().eq("id", linkId);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey }); toast.success("Contacto quitado de tu lista"); },
    onError: (e: Error) => toast.error(e.message),
  });

  const [editando, setEditando] = useState<ContactoRow["contacto"] | null>(null);

  return (
    <div className="space-y-3">
      {puedeCrear && <ContactoDialog propiedadId={propiedadId} clienteId={clienteId} queryKey={queryKey} />}

      {isLoading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!isLoading && data.length === 0 && <p className="text-sm text-muted-foreground">Sin contactos todavía.</p>}

      <div className="space-y-3">
        {data.map((r) => (
          <div key={r.linkId} className="flex items-start justify-between gap-3 border-l-2 pl-3">
            <div className={`space-y-0.5 text-sm ${r.activo ? "" : "text-muted-foreground/60"}`}>
              <p className="font-medium">
                {r.contacto.nombre} {r.contacto.apellido_1} {r.contacto.apellido_2 ?? ""}
                {r.contacto.departamento && <span className="ml-1 text-xs text-muted-foreground">({r.contacto.departamento})</span>}
              </p>
              {r.contacto.email && <p className="text-xs text-muted-foreground">{r.contacto.email}</p>}
              {r.contacto.telefono && <p className="text-xs text-muted-foreground">{r.contacto.telefono}</p>}
            </div>
            <div className="flex items-center gap-2">
              {puedeEditar && r.activo && (
                <Button size="icon" variant="ghost" onClick={() => setEditando(r.contacto)} aria-label="Editar contacto">
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
              {puedeEditar && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => toggle.mutate({ linkId: r.linkId, activo: !r.activo })}
                  aria-label={r.activo ? "Contacto visible: pulsa para ocultarlo" : "Contacto oculto: pulsa para mostrarlo"}
                  title={r.activo ? "Visible: pulsa para ocultarlo" : "Oculto: pulsa para mostrarlo"}
                >
                  {r.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                </Button>
              )}
              {puedeEliminar && (
                <Button size="icon" variant="ghost" onClick={() => quitar.mutate(r.linkId)} aria-label="Quitar de esta propiedad">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {editando && (
        <ContactoDialog
          propiedadId={propiedadId}
          clienteId={clienteId}
          queryKey={queryKey}
          contacto={editando}
          onClose={() => setEditando(null)}
        />
      )}
    </div>
  );
}

function ContactoDialog({
  propiedadId, clienteId, queryKey, contacto, onClose,
}: {
  propiedadId: string;
  clienteId: string | undefined;
  queryKey: readonly unknown[];
  /** Si se pasa, el diálogo edita este contacto en vez de crear uno nuevo. */
  contacto?: ContactoRow["contacto"];
  /** Solo en modo edición: se llama al cerrar el diálogo (crea su propio trigger "Añadir"). */
  onClose?: () => void;
}) {
  const esEdicion = !!contacto;
  const qc = useQueryClient();
  const [open, setOpen] = useState(esEdicion); // en edición se abre ya montado (sin trigger propio)
  const [nombre, setNombre] = useState(contacto?.nombre ?? "");
  const [apellido1, setApellido1] = useState(contacto?.apellido_1 ?? "");
  const [apellido2, setApellido2] = useState(contacto?.apellido_2 ?? "");
  const [departamento, setDepartamento] = useState(contacto?.departamento ?? "");
  const [telefono, setTelefono] = useState(contacto?.telefono ?? "");
  const [email, setEmail] = useState(contacto?.email ?? "");

  const reset = () => {
    setNombre(""); setApellido1(""); setApellido2(""); setDepartamento(""); setTelefono(""); setEmail("");
  };

  const cerrar = (o: boolean) => {
    setOpen(o);
    if (!o) {
      if (esEdicion) onClose?.();
      else reset();
    }
  };

  const guardar = useMutation({
    mutationFn: async () => {
      if (!nombre.trim()) throw new Error("Indica al menos el nombre");
      const campos = {
        nombre: nombre.trim(),
        apellido_1: apellido1.trim() || null,
        apellido_2: apellido2.trim() || null,
        departamento: departamento.trim() || null,
        telefono: telefono.trim() || null,
        email: email.trim() || null,
      };

      if (esEdicion) {
        const { error } = await supabase.from("propiedad_contactos").update(campos).eq("id", contacto!.id);
        if (error) throw error;
        return;
      }

      if (!clienteId) throw new Error("Falta identificar tu empresa");
      const { data: nuevo, error: errNuevo } = await supabase
        .from("propiedad_contactos")
        .insert({ propiedad_id: propiedadId, ...campos })
        .select("id")
        .single();
      if (errNuevo) throw errNuevo;

      const { error: errLink } = await supabase.from("cliente_propiedad_contactos").insert({
        cliente_id: clienteId,
        propiedad_id: propiedadId,
        contacto_id: nuevo.id,
        activo: true,
      });
      if (errLink) throw errLink;
    },
    onSuccess: () => {
      toast.success(esEdicion ? "Contacto actualizado" : "Contacto añadido");
      qc.invalidateQueries({ queryKey });
      cerrar(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={cerrar}>
      {!esEdicion && (
        <DialogTrigger asChild>
          <Button size="sm" variant="outline"><Plus className="mr-2 h-4 w-4" /> Añadir contacto</Button>
        </DialogTrigger>
      )}
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>{esEdicion ? "Editar contacto" : "Nuevo contacto"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Nombre *</Label>
              <Input value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Primer apellido</Label>
              <Input value={apellido1} onChange={(e) => setApellido1(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Segundo apellido</Label>
              <Input value={apellido2} onChange={(e) => setApellido2(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Departamento / cargo</Label>
            <Input value={departamento} onChange={(e) => setDepartamento(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Teléfono</Label>
              <Input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => cerrar(false)}>Cancelar</Button>
          <Button onClick={() => guardar.mutate()} disabled={guardar.isPending}>
            {esEdicion ? "Guardar" : "Añadir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
