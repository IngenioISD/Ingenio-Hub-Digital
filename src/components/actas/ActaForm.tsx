import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Eraser, Eye, FileCheck2, ImagePlus, Loader2, MoreVertical, Save, X } from "lucide-react";
import { toast } from "sonner";

import { MicButton } from "@/components/mic-button";
import { SignaturePad, type SignaturePadHandle } from "@/components/signature-pad";
import { PersonMultiSelect } from "@/components/actas/PersonMultiSelect";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useEmpresa } from "@/hooks/use-empresa";
import { blobPdfActa, generarPdfActa } from "@/lib/actas/pdf";
import {
  BUCKET_FIRMAS,
  BUCKET_IMAGENES,
  BUCKET_PDF,
  aDatetimeLocal,
  comprimirImagen,
  dataUrlToBlob,
  urlFirmada,
} from "@/lib/actas/actas";

type Proyecto = { id: string; nombre: string; codigo_obra: string | null };
type TipoReunion = { codigo: string; etiqueta: string };
type Persona = { nif: string; nombre: string; apellido_1: string; apellido_2: string | null };
type ContactoPropiedad = { nombre: string; departamento: string | null };

type ImagenExistente = { id: string; url: string; preview: string | null };
type ImagenNueva = { file: File; preview: string };

function nombrePersona(p: Persona) {
  return [p.nombre, p.apellido_1, p.apellido_2].filter(Boolean).join(" ");
}

function etiquetaContactoPropiedad(c: ContactoPropiedad) {
  return c.departamento ? `${c.nombre} (${c.departamento})` : c.nombre;
}

export function ActaForm({ actaId }: { actaId?: string }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { usuarioCliente } = useAuth();
  const { data: empresa } = useEmpresa();
  const clienteId = usuarioCliente?.cliente_id;

  const [proyectoId, setProyectoId] = useState("");
  const [fechaReunion, setFechaReunion] = useState(aDatetimeLocal(new Date().toISOString()));
  const [lugar, setLugar] = useState("");
  const [asunto, setAsunto] = useState("");
  const [tipoReunion, setTipoReunion] = useState("");
  const [tipoOtro, setTipoOtro] = useState("");
  const [notas, setNotas] = useState("");
  const [acciones, setAcciones] = useState("");
  const [otrosAsistentes, setOtrosAsistentes] = useState("");
  const [personalSeleccionado, setPersonalSeleccionado] = useState<string[]>([]);
  const [participantesLibres, setParticipantesLibres] = useState<string[]>([]);
  const [nuevoParticipante, setNuevoParticipante] = useState("");
  const [imagenesNuevas, setImagenesNuevas] = useState<ImagenNueva[]>([]);
  const [imagenesExistentes, setImagenesExistentes] = useState<ImagenExistente[]>([]);
  const [firmaDataUrl, setFirmaDataUrl] = useState<string | null>(null);
  const [firmaPathExistente, setFirmaPathExistente] = useState<string | null>(null);
  const [firmaUrlExistente, setFirmaUrlExistente] = useState<string | null>(null);
  const [creadoPorNombre, setCreadoPorNombre] = useState("");
  const [estadoActa, setEstadoActa] = useState<"borrador" | "generada">("borrador");
  const [pdfUrlExistente, setPdfUrlExistente] = useState<string | null>(null);

  const signaturePadRef = useRef<SignaturePadHandle>(null);
  const snapshotInicialRef = useRef<string>("");
  const primerCambioTipoRef = useRef(true);

  const [guardando, setGuardando] = useState(false);
  const [previsualizando, setPrevisualizando] = useState(false);
  const [cargado, setCargado] = useState(!actaId);
  const [confirmando, setConfirmando] = useState<null | "cancelar" | "limpiar">(null);

  const { data: proyectos = [] } = useQuery<Proyecto[]>({
    queryKey: ["actas", "proyectos", clienteId, usuarioCliente?.acceso_total_proyectos],
    enabled: !!clienteId,
    queryFn: async () => {
      let ids: string[] | null = null;
      if (!usuarioCliente?.acceso_total_proyectos) {
        const { data } = await supabase
          .from("usuario_proyectos")
          .select("proyecto_id")
          .eq("user_id", usuarioCliente!.user_id)
          .eq("activo", true);
        ids = (data ?? []).map((f) => f.proyecto_id);
      }
      let q = supabase.from("proyectos").select("id, nombre, codigo_obra").eq("cliente_id", clienteId!).order("nombre");
      if (ids) q = q.in("id", ids.length ? ids : ["00000000-0000-0000-0000-000000000000"]);
      const { data } = await q;
      return (data ?? []) as Proyecto[];
    },
  });

  useEffect(() => {
    const unico = proyectos[0];
    if (proyectos.length === 1 && unico && proyectoId !== unico.id) {
      setProyectoId(unico.id);
    }
  }, [proyectos, proyectoId]);

  const { data: tipos = [] } = useQuery<TipoReunion[]>({
    queryKey: ["actas", "tipos-reunion"],
    staleTime: 10 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from("catalogo")
        .select("codigo, etiqueta")
        .eq("categoria", "tipo_reunion")
        .eq("activo", true)
        .order("orden");
      return (data ?? []) as TipoReunion[];
    },
  });

  const esInterna = tipoReunion === "interna";
  const esDf = tipoReunion === "df";
  const esPropiedad = tipoReunion === "propiedad";
  const esSubcontrata = tipoReunion === "subcontrata";
  const esOtra = tipoReunion === "otra" || tipoReunion === "otro";

  // Proyecto seleccionado (para conocer su propiedad y su dirección facultativa)
  const { data: proyectoSel } = useQuery<{ propiedad_id: string | null; df_id: string | null } | null>({
    queryKey: ["actas", "proyecto-detalle", proyectoId],
    enabled: !!proyectoId && (esDf || esPropiedad),
    queryFn: async () => {
      const { data } = await supabase
        .from("proyectos")
        .select("propiedad_id, df_id")
        .eq("id", proyectoId)
        .maybeSingle();
      return data ?? null;
    },
  });

  // Contacto designado de la Dirección Facultativa para ESTE proyecto
  const { data: dfNombre = null } = useQuery<string | null>({
    queryKey: ["actas", "df-contacto", proyectoId],
    enabled: esDf && !!proyectoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("proyecto_direccion_facultativa")
        .select("direccion_facultativa_contactos(nombre, apellido_1, apellido_2)")
        .eq("proyecto_id", proyectoId)
        .maybeSingle();
      const contacto = data?.direccion_facultativa_contactos as
        | { nombre: string; apellido_1: string; apellido_2: string | null }
        | null;
      if (!contacto) return null;
      const nombre = [contacto.nombre, contacto.apellido_1, contacto.apellido_2].filter(Boolean).join(" ");
      return nombre || null;
    },
  });

  // Contactos de la Propiedad del proyecto
  const { data: contactosPropiedad = [] } = useQuery<ContactoPropiedad[]>({
    queryKey: ["actas", "propiedad-contactos", proyectoSel?.propiedad_id],
    enabled: esPropiedad && !!proyectoSel?.propiedad_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("propiedad_contactos")
        .select("nombre, apellido_1, apellido_2, departamento")
        .eq("propiedad_id", proyectoSel!.propiedad_id!)
        .order("apellido_1");
      return (data ?? [])
        .map((c) => ({
          nombre: [c.nombre, c.apellido_1, c.apellido_2].filter(Boolean).join(" "),
          departamento: c.departamento ?? null,
        }))
        .filter((c) => c.nombre.length > 0);
    },
  });

  // Subcontratas asignadas al proyecto
  const { data: contactosSubcontrata = [] } = useQuery<{ id: string; nombre: string }[]>({
    queryKey: ["actas", "subcontratas-proyecto", proyectoId],
    enabled: esSubcontrata && !!proyectoId,
    queryFn: async () => {
      const { data } = await supabase
        .from("proyecto_proveedores")
        .select("proveedor_id, proveedor_subcontrata(nombre_legal)")
        .eq("proyecto_id", proyectoId)
        .eq("activo", true);
      return (data ?? [])
        .map((r: any) => ({ id: r.proveedor_id as string, nombre: r.proveedor_subcontrata?.nombre_legal ?? "—" }))
        .filter((s) => s.nombre !== "—");
    },
  });

  const accesoTotal = usuarioCliente?.acceso_total_proyectos === true;

  const { data: personal = [] } = useQuery<Persona[]>({
    queryKey: ["actas", "personal", clienteId, accesoTotal, accesoTotal ? null : proyectoId],
    enabled: !!clienteId && esInterna && (accesoTotal || !!proyectoId),
    queryFn: async () => {
      const { data } = await supabase
        .from("personal")
        .select("nif, nombre, apellido_1, apellido_2, email")
        .eq("cliente_id", clienteId!)
        .eq("activo", true)
        .order("apellido_1");
      const filas = (data ?? []) as (Persona & { email: string | null })[];
      if (accesoTotal) return filas;

      // Roles de un solo proyecto: solo personas asignadas al proyecto de la acta.
      const { data: asignaciones } = await supabase
        .from("usuario_proyectos")
        .select("user_id")
        .eq("proyecto_id", proyectoId)
        .eq("activo", true);
      const userIds = (asignaciones ?? []).map((a) => a.user_id);
      if (userIds.length === 0) return [];

      const { data: usuarios } = await supabase
        .from("usuarios_cliente")
        .select("email")
        .eq("cliente_id", clienteId!)
        .in("user_id", userIds);
      const emails = new Set((usuarios ?? []).map((u) => (u.email ?? "").toLowerCase()).filter(Boolean));
      return filas.filter((p) => p.email && emails.has(p.email.toLowerCase()));
    },
  });

  // Datos de la persona conectada (para actas nuevas: creador y firmante)
  const { data: miPersonal } = useQuery<{ nombre: string; nif: string | null } | null>({
    queryKey: ["actas", "mi-personal", clienteId],
    enabled: !!clienteId,
    queryFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email ?? "";
      if (!email) return null;
      const { data } = await supabase
        .from("personal")
        .select("nif, nombre, apellido_1, apellido_2")
        .eq("cliente_id", clienteId!)
        .eq("email", email)
        .maybeSingle();
      if (!data) return null;
      return {
        nif: data.nif ?? null,
        nombre: [data.nombre, data.apellido_1, data.apellido_2].filter(Boolean).join(" "),
      };
    },
  });

  // Carga del acta existente
  useEffect(() => {
    if (!actaId) return;
    let cancelado = false;

    void (async () => {
      const { data: acta } = await supabase.from("actas").select("*").eq("id", actaId).maybeSingle();
      if (!acta || cancelado) return;

      setProyectoId(acta.proyecto_id ?? "");
      setFechaReunion(aDatetimeLocal(acta.fecha_reunion));
      setLugar(acta.lugar ?? "");
      setAsunto(acta.asunto ?? "");
      setTipoReunion(acta.tipo_reunion ?? "");
      setTipoOtro(acta.tipo_otro_descripcion ?? "");
      setNotas(acta.notas ?? "");
      setAcciones(acta.acciones ?? "");
      setOtrosAsistentes(acta.otros_asistentes ?? "");
      setEstadoActa(acta.estado === "generada" ? "generada" : "borrador");
      setPdfUrlExistente(acta.pdf_url ?? null);

      if (acta.creado_por_nif) {
        const { data: creador } = await supabase
          .from("personal")
          .select("nombre, apellido_1, apellido_2")
          .eq("nif", acta.creado_por_nif)
          .maybeSingle();
        if (creador && !cancelado) {
          setCreadoPorNombre([creador.nombre, creador.apellido_1, creador.apellido_2].filter(Boolean).join(" "));
        }
      }

      const { data: participantes } = await supabase
        .from("acta_participantes")
        .select("tipo_participante, referencia_nif, nombre_libre")
        .eq("acta_id", actaId);
      setPersonalSeleccionado(
        (participantes ?? [])
          .filter((p) => p.tipo_participante === "interna" && p.referencia_nif)
          .map((p) => p.referencia_nif as string),
      );
      setParticipantesLibres(
        (participantes ?? [])
          .filter((p) => p.tipo_participante !== "interna" && p.nombre_libre)
          .map((p) => p.nombre_libre as string),
      );

      const { data: imagenes } = await supabase
        .from("acta_imagenes")
        .select("id, url")
        .eq("acta_id", actaId)
        .order("orden");
      const conPreview = await Promise.all(
        (imagenes ?? []).map(async (img) => ({
          id: img.id,
          url: img.url,
          preview: await urlFirmada(BUCKET_IMAGENES, img.url),
        })),
      );
      if (!cancelado) setImagenesExistentes(conPreview);

      const { data: firma } = await supabase
        .from("acta_firmas")
        .select("firma_url")
        .eq("acta_id", actaId)
        .maybeSingle();
      if (firma?.firma_url && !cancelado) {
        setFirmaPathExistente(firma.firma_url);
        const urlFirma = await urlFirmada(BUCKET_FIRMAS, firma.firma_url);
        if (urlFirma) setFirmaUrlExistente(urlFirma);
      }

      if (!cancelado) setCargado(true);
    })();

    return () => {
      cancelado = true;
    };
  }, [actaId]);

  // Cargar la firma dentro del SignaturePad solo cuando el componente ya
  // está montado de verdad (cargado === true), para que la ref no sea null.
  useEffect(() => {
    if (cargado && firmaUrlExistente) {
      signaturePadRef.current?.setFromImage(firmaUrlExistente);
    }
  }, [cargado, firmaUrlExistente]);

  // Captura el snapshot inicial una vez los datos están listos.
  useEffect(() => {
    if (!actaId) {
      snapshotInicialRef.current = snapshotActual();
    }
  }, []);

  useEffect(() => {
    if (actaId && cargado && !snapshotInicialRef.current) {
      snapshotInicialRef.current = snapshotActual();
    }
  }, [actaId, cargado]);

  // Al cambiar realmente el tipo de reunión, limpiar asistentes vinculados
  // al tipo anterior para evitar que se etiqueten con el tipo nuevo.
  useEffect(() => {
    if (!cargado) return;
    if (primerCambioTipoRef.current) {
      primerCambioTipoRef.current = false;
      return;
    }
    setPersonalSeleccionado([]);
    setParticipantesLibres([]);
  }, [tipoReunion, cargado]);

  const nombresPersonal = useMemo(() => new Map(personal.map((p) => [p.nif, nombrePersona(p)])), [personal]);

  const toggleLibre = (nombre: string, checked: boolean) =>
    setParticipantesLibres((prev) =>
      checked ? (prev.includes(nombre) ? prev : [...prev, nombre]) : prev.filter((n) => n !== nombre),
    );

  function procesarPuntuacionDictado(texto: string): string {
    // Sustituye "punto" dicho como palabra suelta por un punto real.
    let resultado = texto.replace(/\s*\bpunto\b\s*/gi, ". ");
    // Capitaliza la letra que sigue a cada punto insertado dentro del propio fragmento dictado.
    resultado = resultado.replace(/\.\s+([a-záéíóúñü])/gi, (_match, letra: string) => `. ${letra.toUpperCase()}`);
    return resultado.trim();
  }

  const anadirTexto = (setter: (v: string) => void, actual: string) => (textoDictado: string) => {
    const texto = procesarPuntuacionDictado(textoDictado);
    if (!texto) return;
    const actualTrim = actual.trimEnd();
    const esInicioDeFrase = actualTrim === "" || /[.!?]$/.test(actualTrim);
    const textoFinal = esInicioDeFrase
      ? texto.charAt(0).toUpperCase() + texto.slice(1)
      : texto;
    setter(actualTrim ? `${actualTrim} ${textoFinal}` : textoFinal);
  };


  const snapshotActual = () =>
    JSON.stringify({
      proyectoId,
      fechaReunion,
      lugar,
      asunto,
      tipoReunion,
      tipoOtro,
      notas,
      acciones,
      otrosAsistentes,
      personalSeleccionado,
      participantesLibres,
      imagenesExistentes: imagenesExistentes.map((i) => i.id),
      numImagenesNuevas: imagenesNuevas.length,
      firmaPathExistente,
      tieneFirmaNueva: !!firmaDataUrl,
    });

  const hayCambios = () => snapshotActual() !== snapshotInicialRef.current;

  const nombreCreador = creadoPorNombre || miPersonal?.nombre || "";

  const ORIGEN_TIPO: Record<string, string> = {
    interna: "Personal interno",
    df: "Dirección facultativa",
    propiedad: "Propiedad",
    subcontrata: "Subcontrata",
  };

  const nombresParticipantes = () => {
    if (tipoReunion === "interna") {
      return [
        ...(nombreCreador ? [nombreCreador] : []),
        ...personalSeleccionado.map((nif) => nombresPersonal.get(nif) ?? nif),
        ...participantesLibres,
      ];
    }
    return [
      ...(nombreCreador ? [`${nombreCreador} (Constructora)`] : []),
      ...personalSeleccionado.map((nif) => `${nombresPersonal.get(nif) ?? nif} (${ORIGEN_TIPO["interna"]})`),
      ...participantesLibres.map((nombre) => {
        if (esPropiedad) {
          const c = contactosPropiedad.find((c) => c.nombre === nombre);
          return c?.departamento ? `${nombre} (${c.departamento})` : nombre;
        }
        return `${nombre} (${ORIGEN_TIPO[tipoReunion] ?? "Otro"})`;
      }),
    ];
  };

  const etiquetaTipo = tipos.find((t) => t.codigo === tipoReunion)?.etiqueta ?? (esOtra ? tipoOtro : tipoReunion);
  const nombreProyecto = proyectos.find((p) => p.id === proyectoId)?.nombre ?? "";
  const codigoProyecto = proyectos.find((p) => p.id === proyectoId)?.codigo_obra ?? "";
  const urlsImagenes = () =>
    [...imagenesExistentes.map((i) => i.preview), ...imagenesNuevas.map((i) => i.preview)].filter(Boolean) as string[];

  const ejecutarLimpiar = () => {
    imagenesNuevas.forEach((i) => URL.revokeObjectURL(i.preview));
    setProyectoId("");
    setFechaReunion(aDatetimeLocal(new Date().toISOString()));
    setLugar("");
    setAsunto("");
    setTipoReunion("");
    setTipoOtro("");
    setNotas("");
    setAcciones("");
    setOtrosAsistentes("");
    setPersonalSeleccionado([]);
    setParticipantesLibres([]);
    setNuevoParticipante("");
    setImagenesNuevas([]);
    setFirmaDataUrl(null);
    snapshotInicialRef.current = snapshotActual();
  };

  const limpiarCampos = () => {
    if (hayCambios()) {
      setConfirmando("limpiar");
      return;
    }
    ejecutarLimpiar();
  };

  const ejecutarCancelar = () => {
    if (actaId) void navigate({ to: "/digital/apps/actas-reunion/$id", params: { id: actaId } });
    else void navigate({ to: "/digital/apps/actas-reunion" });
  };

  const cancelar = () => {
    if (hayCambios()) {
      setConfirmando("cancelar");
      return;
    }
    ejecutarCancelar();
  };

  const ejecutarConfirmado = () => {
    if (confirmando === "cancelar") ejecutarCancelar();
    if (confirmando === "limpiar") ejecutarLimpiar();
    setConfirmando(null);
  };

  const previsualizar = async () => {
    setPrevisualizando(true);
    try {
      const blob = await blobPdfActa({
        id: actaId ?? "borrador",
        asunto: asunto.trim(),
        lugar: lugar.trim(),
        fecha_reunion: new Date(fechaReunion).toISOString(),
        tipoReunionCodigo: tipoReunion,
        tipoReunionEtiqueta: etiquetaTipo,
        proyectoNombre: nombreProyecto,
        proyectoCodigo: codigoProyecto,
        notas: notas.trim(),
        acciones: acciones.trim() || null,
        otros_asistentes: otrosAsistentes.trim() || null,
        participantes: nombresParticipantes(),
        empresaNombre: empresa?.nombre ?? "",
        logoClienteUrl: empresa?.logo_url ?? null,
        estado: estadoActa,
        imagenes: urlsImagenes(),
        creadoPorNombre: nombreCreador,
        ...(firmaDataUrl ? { firmaDataUrlDirecta: firmaDataUrl, firmaPath: null } : { firmaPath: firmaPathExistente }),
      });
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se ha podido generar la previsualización");
    } finally {
      setPrevisualizando(false);
    }
  };

  const guardar = async (estado: "borrador" | "generada") => {
    if (!clienteId || !usuarioCliente) {
      toast.error("No se ha podido identificar tu empresa");
      return;
    }
    if (!proyectoId || !asunto.trim() || !lugar.trim() || !tipoReunion || !notas.trim()) {
      toast.error("Completa proyecto, asunto, lugar, tipo de reunión y notas");
      return;
    }

    setGuardando(true);
    try {
      // Si se pasa de generada a borrador, eliminamos el PDF viejo para evitar
      // que la pantalla de detalle ofrezca descargar una versión desactualizada.
      const pasaDeGeneradaABorrador = actaId && estadoActa === "generada" && estado === "borrador";
      if (pasaDeGeneradaABorrador && pdfUrlExistente) {
        await supabase.storage.from(BUCKET_PDF).remove([pdfUrlExistente]);
      }

      // NIF del creador (actas.creado_por_nif es obligatorio)
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user?.email ?? "";
      const { data: yo } = await supabase
        .from("personal")
        .select("id, nif")
        .eq("cliente_id", clienteId)
        .eq("email", email)
        .maybeSingle();


      const payload = {
        cliente_id: clienteId,
        proyecto_id: proyectoId,
        fecha_reunion: new Date(fechaReunion).toISOString(),
        lugar: lugar.trim(),
        asunto: asunto.trim(),
        notas: notas.trim(),
        tipo_reunion: tipoReunion,
        tipo_otro_descripcion: esOtra ? tipoOtro.trim() || null : null,
        acciones: acciones.trim() || null,
        otros_asistentes: otrosAsistentes.trim() || null,
      };

      let id: string;
      if (actaId) {
        const { data, error } = await supabase
          .from("actas")
          .update({
            ...payload,
            estado,
            ...(pasaDeGeneradaABorrador ? { pdf_url: null, nombre_pdf: null } : {}),
          })
          .eq("id", actaId)
          .eq("cliente_id", clienteId)
          .select("id")
          .single();
        if (error) throw error;
        id = data.id;
      } else {
        if (!yo?.id) {
          throw new Error(
            "Tu usuario no está dado de alta en la ficha de personal de la empresa (necesario para firmar el acta).",
          );
        }
        const { data, error } = await supabase
          .from("actas")
          .insert({
            ...payload,
            creado_por_id: yo.id,
            estado,
          })
          .select("id")
          .single();

        if (error) throw error;
        if (!data?.id) throw new Error("Supabase no ha devuelto el identificador del acta");
        id = data.id;
      }

      // Participantes
      await supabase.from("acta_participantes").delete().eq("acta_id", id);
      const filas = [
        ...personalSeleccionado.map((nif) => ({
          acta_id: id,
          tipo_participante: "interna",
          referencia_nif: nif,
          nombre_libre: null as string | null,
        })),
        ...participantesLibres.map((nombre) => ({
          acta_id: id,
          tipo_participante: tipoReunion || "otro",
          referencia_nif: null,
          nombre_libre: nombre,
        })),
      ];
      if (filas.length) {
        const { error } = await supabase.from("acta_participantes").insert(filas);
        if (error) throw error;
      }

      // Imágenes nuevas — la primera carpeta debe ser el acta_id.
      let orden = imagenesExistentes.length;
      for (const { file } of imagenesNuevas) {
        const comprimida = await comprimirImagen(file);
        const nombreBase = file.name.replace(/\.[^.]+$/, "");
        const path = `${id}/${crypto.randomUUID()}-${nombreBase}.jpg`;
        const { error } = await supabase.storage
          .from(BUCKET_IMAGENES)
          .upload(path, comprimida, { contentType: "image/jpeg" });
        if (error) throw error;
        const { error: errImg } = await supabase.from("acta_imagenes").insert({ acta_id: id, url: path, orden });
        if (errImg) throw errImg;
        orden += 1;
      }

      // Firma — la primera carpeta debe ser el acta_id.
      let firmaPath: string | null = null;
      if (firmaDataUrl) {
        firmaPath = `${id}/firma.png`;
        const { error } = await supabase.storage.from(BUCKET_FIRMAS).upload(firmaPath, dataUrlToBlob(firmaDataUrl), {
          upsert: true,
          contentType: "image/png",
        });
        if (error) throw error;
        await supabase.from("acta_firmas").delete().eq("acta_id", id);
        const { error: errFirma } = await supabase.from("acta_firmas").insert({
          acta_id: id,
          firma_url: firmaPath,
          usuario_id: yo?.id ?? null,
        });
        if (errFirma) throw errFirma;

      } else {
        const { data: firma } = await supabase.from("acta_firmas").select("firma_url").eq("acta_id", id).maybeSingle();
        firmaPath = firma?.firma_url ?? null;
      }

      if (estado === "generada") {
        const { path, nombre } = await generarPdfActa({
          id: id,
          asunto: payload.asunto,
          lugar: payload.lugar,
          fecha_reunion: payload.fecha_reunion,
          tipoReunionCodigo: tipoReunion,
          tipoReunionEtiqueta: etiquetaTipo,
          proyectoNombre: nombreProyecto,
          proyectoCodigo: codigoProyecto,
          notas: payload.notas,
          acciones: payload.acciones,
          otros_asistentes: payload.otros_asistentes,
          participantes: nombresParticipantes(),
          empresaNombre: empresa?.nombre ?? "",
          logoClienteUrl: empresa?.logo_url ?? null,
          estado: "generada",
          imagenes: urlsImagenes(),
          creadoPorNombre: nombreCreador,
          firmaPath,
        });
        await supabase.from("actas").update({ pdf_url: path, nombre_pdf: nombre }).eq("id", id);
      }

      imagenesNuevas.forEach((i) => URL.revokeObjectURL(i.preview));
      setImagenesNuevas([]);
      setEstadoActa(estado);
      await queryClient.invalidateQueries({ queryKey: ["actas"] });
      toast.success(estado === "generada" ? "Acta generada" : "Borrador guardado");
      void navigate({ to: "/digital/apps/actas-reunion/$id", params: { id: id } });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "No se ha podido guardar el acta");
    } finally {
      setGuardando(false);
    }
  };

  const borrarImagenExistente = async (imagen: ImagenExistente) => {
    await supabase.from("acta_imagenes").delete().eq("id", imagen.id);
    await supabase.storage.from(BUCKET_IMAGENES).remove([imagen.url]);
    setImagenesExistentes((prev) => prev.filter((i) => i.id !== imagen.id));
  };

  if (!cargado) {
    return (
      <div className="flex items-center gap-2" style={{ color: "var(--text-secondary)" }}>
        <Loader2 className="animate-spin" size={16} /> Cargando acta…
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <div className="card">
        <div className="form-section">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="proyecto">
                Proyecto <span className="required">*</span>
              </label>
              <select
                id="proyecto"
                className="form-select"
                value={proyectoId}
                onChange={(e) => setProyectoId(e.target.value)}
                disabled={proyectos.length === 1}
              >
                {proyectos.length === 1 && proyectos[0] ? (
                  <option value={proyectos[0].id}>
                    {proyectos[0].codigo_obra ? `${proyectos[0].codigo_obra} · ` : ""}
                    {proyectos[0].nombre}
                  </option>
                ) : (
                  <>
                    <option value="">Selecciona un proyecto</option>
                    {proyectos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.codigo_obra ? `${p.codigo_obra} · ` : ""}
                        {p.nombre}
                      </option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="fecha">
                Fecha y hora <span className="required">*</span>
              </label>
              <input
                id="fecha"
                type="datetime-local"
                className="form-input"
                value={fechaReunion}
                onChange={(e) => setFechaReunion(e.target.value)}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label" htmlFor="lugar">
                Lugar <span className="required">*</span>
              </label>
              <input
                id="lugar"
                className="form-input"
                value={lugar}
                onChange={(e) => setLugar(e.target.value)}
                placeholder="Oficina de obra, sala de reuniones…"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tipo">
                Tipo de reunión <span className="required">*</span>
              </label>
              <select
                id="tipo"
                className="form-select"
                value={tipoReunion}
                onChange={(e) => setTipoReunion(e.target.value)}
              >
                <option value="">Selecciona un tipo</option>
                {tipos.map((t) => (
                  <option key={t.codigo} value={t.codigo}>
                    {t.etiqueta}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {esOtra ? (
            <div className="form-group">
              <label className="form-label" htmlFor="tipo-otro">
                Describe el tipo de reunión
              </label>
              <input
                id="tipo-otro"
                className="form-input"
                value={tipoOtro}
                onChange={(e) => setTipoOtro(e.target.value)}
              />
            </div>
          ) : null}

          <div className="form-group">
            <label className="form-label" htmlFor="asunto">
              Asunto <span className="required">*</span>
            </label>
            <div className="form-input-voice">
              <input id="asunto" className="form-input" value={asunto} onChange={(e) => setAsunto(e.target.value)} />
              <MicButton onResult={anadirTexto(setAsunto, asunto)} title="Dictar asunto" />
            </div>
          </div>

          {/* Asistentes */}
          <div className="form-group">
            <span className="form-label">Asistentes</span>
            {esInterna ? (
              <PersonMultiSelect
                opciones={personal
                  .filter((p) => p.nif !== miPersonal?.nif)
                  .map((p) => ({ value: p.nif, label: nombrePersona(p) }))}
                seleccionados={personalSeleccionado}
                onToggle={(nif, checked) =>
                  setPersonalSeleccionado((prev) => (checked ? [...prev, nif] : prev.filter((n) => n !== nif)))
                }
                mensajeVacio={
                  proyectoId
                    ? "No hay personal asignado a este proyecto."
                    : "Selecciona un proyecto para ver el personal."
                }
              />
            ) : esPropiedad ? (
              contactosPropiedad.length === 0 ? (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>Propiedad no asignada.</span>
              ) : (
                <PersonMultiSelect
                  opciones={contactosPropiedad.map((c) => ({ value: c.nombre, label: etiquetaContactoPropiedad(c) }))}
                  seleccionados={participantesLibres}
                  onToggle={toggleLibre}
                  mensajeVacio="Propiedad no asignada."
                />
              )
            ) : esDf ? (
              dfNombre ? (
                <label className="flex items-center gap-2 py-1">
                  <input
                    type="checkbox"
                    checked={participantesLibres.includes(dfNombre)}
                    onChange={(e) => toggleLibre(dfNombre, e.target.checked)}
                  />
                  <span style={{ fontSize: "var(--text-sm)" }}>¿Asiste {dfNombre}?</span>
                </label>
              ) : (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  Dirección facultativa no asignada.
                </span>
              )
            ) : esSubcontrata ? (
              contactosSubcontrata.length === 0 ? (
                <span style={{ fontSize: "var(--text-sm)", color: "var(--text-muted)" }}>
                  No hay subcontratas asignadas a este proyecto.
                </span>
              ) : (
                <PersonMultiSelect
                  opciones={contactosSubcontrata.map((s) => ({ value: s.nombre, label: s.nombre }))}
                  seleccionados={participantesLibres}
                  onToggle={toggleLibre}
                  mensajeVacio="No hay subcontratas asignadas a este proyecto."
                />
              )
            ) : (
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    className="form-input"
                    value={nuevoParticipante}
                    placeholder="Nombre del asistente"
                    onChange={(e) => setNuevoParticipante(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        if (nuevoParticipante.trim()) {
                          setParticipantesLibres((prev) => [...prev, nuevoParticipante.trim()]);
                          setNuevoParticipante("");
                        }
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => {
                      if (nuevoParticipante.trim()) {
                        setParticipantesLibres((prev) => [...prev, nuevoParticipante.trim()]);
                        setNuevoParticipante("");
                      }
                    }}
                  >
                    Añadir
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {participantesLibres.map((nombre, i) => (
                    <span key={`${nombre}-${i}`} className="badge badge-neutral gap-1">
                      {nombre}
                      <button
                        type="button"
                        aria-label={`Quitar ${nombre}`}
                        onClick={() => setParticipantesLibres((prev) => prev.filter((_, j) => j !== i))}
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {esInterna && personalSeleccionado.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {personalSeleccionado.map((nif) => (
                <span key={nif} className="badge badge-info">
                  {nombresPersonal.get(nif) ?? nif}
                </span>
              ))}
            </div>
          ) : null}

          <div className="form-group">
            <label className="form-label" htmlFor="otros">
              Otros asistentes
            </label>
            <input
              id="otros"
              className="form-input"
              value={otrosAsistentes}
              onChange={(e) => setOtrosAsistentes(e.target.value)}
              placeholder="Personas ajenas al listado"
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="notas">
              Notas <span className="required">*</span>
            </label>
            <div className="form-textarea-voice">
              <textarea id="notas" className="form-textarea" value={notas} onChange={(e) => setNotas(e.target.value)} />
              <MicButton onResult={anadirTexto(setNotas, notas)} title="Dictar notas" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="acciones">
              Acciones a tomar
            </label>
            <div className="form-textarea-voice">
              <textarea
                id="acciones"
                className="form-textarea"
                value={acciones}
                onChange={(e) => setAcciones(e.target.value)}
              />
              <MicButton onResult={anadirTexto(setAcciones, acciones)} title="Dictar acciones" />
            </div>
          </div>

          {/* Imágenes */}
          <div className="form-group">
            <span className="form-label">Imágenes</span>
            <div className="flex flex-wrap gap-3">
              {imagenesExistentes.map((img) => (
                <div key={img.id} className="relative">
                  {img.preview ? (
                    <img
                      src={img.preview}
                      alt="Imagen del acta"
                      className="h-24 w-24 object-cover"
                      style={{ borderRadius: "var(--radius-md)" }}
                    />
                  ) : null}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm absolute -top-2 -right-2 !h-6 !w-6 !p-0"
                    aria-label="Eliminar imagen"
                    onClick={() => void borrarImagenExistente(img)}
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {imagenesNuevas.map((img, i) => (
                <div key={`${img.file.name}-${i}`} className="relative">
                  <img
                    src={img.preview}
                    alt={img.file.name}
                    className="h-24 w-24 object-cover"
                    style={{ borderRadius: "var(--radius-md)" }}
                  />
                  <button
                    type="button"
                    className="btn btn-danger btn-sm absolute -top-2 -right-2 !h-6 !w-6 !p-0"
                    aria-label="Quitar imagen"
                    onClick={() =>
                      setImagenesNuevas((prev) => {
                        const fuera = prev[i];
                        if (fuera) URL.revokeObjectURL(fuera.preview);
                        return prev.filter((_, j) => j !== i);
                      })
                    }
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              <label className="btn btn-secondary cursor-pointer">
                <ImagePlus size={20} /> Añadir fotos
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => {
                    const nuevos = Array.from(e.target.files ?? []).map((file) => ({
                      file,
                      preview: URL.createObjectURL(file),
                    }));
                    setImagenesNuevas((prev) => [...prev, ...nuevos]);
                    e.target.value = "";
                  }}
                />
              </label>
            </div>
          </div>

          {/* Firma */}
          <div className="form-group">
            <span className="form-label">Firma</span>
            <div className="w-full md:w-1/2">
              <SignaturePad ref={signaturePadRef} onChange={setFirmaDataUrl} />
            </div>
          </div>
        </div>
      </div>

      {/* Escritorio */}
      <div className="mt-5 hidden items-center gap-3 md:flex">
        <button
          type="button"
          className="btn shrink-0"
          style={{
            backgroundColor: "var(--brand-navy-deep)",
            color: "var(--brand-lime)",
            borderColor: "var(--brand-navy-deep)",
          }}
          disabled={guardando}
          onClick={() => void guardar("generada")}
        >
          {guardando ? (
            <Loader2 className="shrink-0 animate-spin" size={20} />
          ) : (
            <FileCheck2 className="shrink-0" size={20} />
          )}
          Generar acta
        </button>
        <button
          type="button"
          className="btn btn-secondary shrink-0"
          disabled={guardando}
          onClick={() => void guardar("borrador")}
        >
          <Save className="shrink-0" size={20} /> Guardar borrador
        </button>
        <button type="button" className="btn btn-secondary shrink-0" disabled={guardando} onClick={cancelar}>
          <X className="shrink-0" size={20} /> Cancelar
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button type="button" className="btn btn-secondary shrink-0">
              <MoreVertical className="shrink-0" size={20} /> Más acciones
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {estadoActa === "borrador" ? (
              <DropdownMenuItem onSelect={() => void previsualizar()} disabled={previsualizando}>
                {previsualizando ? (
                  <Loader2 className="shrink-0 animate-spin" size={16} />
                ) : (
                  <Eye className="shrink-0" size={16} />
                )}
                Previsualizar borrador
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuItem onSelect={limpiarCampos}>
              <Eraser className="shrink-0" size={16} /> Limpiar campos
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Móvil */}
      <div className="bottom-bar md:hidden" style={{ justifyContent: "center" }}>
        <button
          type="button"
          className="bottom-bar-btn primary"
          disabled={guardando}
          onClick={() => void guardar("generada")}
          aria-label="Generar acta"
        >
          {guardando ? <Loader2 className="animate-spin" size={20} /> : <FileCheck2 size={20} />}
          <span className="bottom-bar-btn-label">Generar</span>
        </button>
        <button
          type="button"
          className="bottom-bar-btn secondary"
          disabled={guardando}
          onClick={() => void guardar("borrador")}
          aria-label="Guardar borrador"
        >
          <Save size={20} />
          <span className="bottom-bar-btn-label">Borrador</span>
        </button>
        {estadoActa === "borrador" ? (
          <button
            type="button"
            className="bottom-bar-btn secondary"
            disabled={previsualizando}
            onClick={() => void previsualizar()}
            aria-label="Previsualizar"
          >
            {previsualizando ? <Loader2 className="animate-spin" size={20} /> : <Eye size={20} />}
            <span className="bottom-bar-btn-label">Ver</span>
          </button>
        ) : null}
        <button type="button" className="bottom-bar-btn secondary" onClick={limpiarCampos} aria-label="Limpiar campos">
          <Eraser size={20} />
          <span className="bottom-bar-btn-label">Limpiar</span>
        </button>
        <button type="button" className="bottom-bar-btn ghost" onClick={cancelar} aria-label="Cancelar">
          <X size={20} />
          <span className="bottom-bar-btn-label">Cancelar</span>
        </button>
      </div>

      <AlertDialog open={!!confirmando} onOpenChange={(open) => !open && setConfirmando(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmando === "cancelar" ? "¿Salir sin guardar?" : "¿Vaciar el formulario?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmando === "cancelar"
                ? "Tienes cambios sin guardar. Si sales ahora, se perderán."
                : "Se borrarán todos los campos rellenados. Esta acción no se puede deshacer."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <button type="button" className="btn btn-secondary">
                Cancelar
              </button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <button type="button" className="btn btn-danger" onClick={ejecutarConfirmado}>
                {confirmando === "cancelar" ? "Salir sin guardar" : "Vaciar"}
              </button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
