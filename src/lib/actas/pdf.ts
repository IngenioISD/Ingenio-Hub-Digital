import jsPDF from "jspdf";

import { supabase } from "@/integrations/supabase/client";
import { BUCKET_PDF, formatoFechaHora, urlFirmada, BUCKET_FIRMAS } from "@/lib/actas/actas";

export type DatosPdfActa = {
  id: string;
  asunto: string;
  lugar: string;
  fecha_reunion: string;
  tipoReunionCodigo: string;
  tipoReunionEtiqueta: string;
  proyectoNombre: string;
  proyectoCodigo: string;
  notas: string;
  acciones: string | null;
  otros_asistentes: string | null;
  participantes: string[];
  empresaNombre: string;
  estado: "borrador" | "generada";
  imagenes: string[];
  firmaPath: string | null;
};

const NAVY: [number, number, number] = [0, 30, 56];
const CARD_BG: [number, number, number] = [244, 246, 249];
const GRIS: [number, number, number] = [110, 118, 129];
const TEXTO: [number, number, number] = [40, 44, 50];

/** Carga una imagen (cualquier formato) y la devuelve como JPEG dataURL (jsPDF usa DCTDecode). */
async function comoJpeg(url: string): Promise<{ dataUrl: string; w: number; h: number } | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const bitmap = await createImageBitmap(blob);
    const canvas = document.createElement("canvas");
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0);
    return {
      dataUrl: canvas.toDataURL("image/jpeg", 0.85),
      w: bitmap.width,
      h: bitmap.height,
    };
  } catch {
    return null;
  }
}

/** Construye el PDF del acta en memoria y devuelve el Blob (no guarda nada). */
export async function blobPdfActa(datos: DatosPdfActa): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = 40;
  const anchoPag = doc.internal.pageSize.getWidth();
  const altoPag = doc.internal.pageSize.getHeight();
  const ancho = anchoPag - margen * 2;
  const pad = 16;
  const gap = 14;
  let y = margen;

  const nuevaPagina = () => {
    doc.addPage();
    y = margen;
  };
  const asegurar = (alto: number) => {
    if (y + alto > altoPag - margen) nuevaPagina();
  };

  // ---------- Cabecera ----------
  doc.setDrawColor(180, 188, 196);
  doc.setLineDashPattern([3, 3], 0);
  doc.roundedRect(margen, y, 100, 40, 4, 4, "S");
  doc.roundedRect(anchoPag - margen - 100, y, 100, 40, 4, 4, "S");
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...GRIS);
  doc.text("LOGO CONSTRUCTORA", margen + 50, y + 23, { align: "center" });
  doc.text("LOGO INGENIO ISD", anchoPag - margen - 50, y + 23, { align: "center" });
  y += 56;

  const generada = datos.estado === "generada";
  const badgeTexto = generada ? "GENERADA" : "BORRADOR";
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  const anchoTitulo = doc.getTextWidth("Acta de Reunión");
  doc.setFontSize(7.5);
  const anchoBadge = doc.getTextWidth(badgeTexto) + 14;
  const total = anchoTitulo + 10 + anchoBadge;
  const xTitulo = (anchoPag - total) / 2;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(...NAVY);
  doc.text("Acta de Reunión", xTitulo, y + 14);

  const bx = xTitulo + anchoTitulo + 10;
  doc.setFillColor(...(generada ? [230, 244, 236] : [255, 243, 224]));
  doc.roundedRect(bx, y + 3, anchoBadge, 14, 7, 7, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(7.5);
  doc.setTextColor(...(generada ? [29, 106, 58] : [230, 81, 0]));
  doc.text(badgeTexto, bx + anchoBadge / 2, y + 12.5, { align: "center" });
  y += 30;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...GRIS);
  doc.text(datos.empresaNombre || "", anchoPag / 2, y, { align: "center" });
  y += 22;

  // ---------- Utilidades de tarjeta ----------
  /** Dibuja una tarjeta con altura conocida y devuelve la y interior inicial. */
  const abrirTarjeta = (alto: number) => {
    asegurar(alto);
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margen, y, ancho, alto, 6, 6, "F");
    const inicio = y + pad;
    y += alto + gap;
    return inicio;
  };

  const tituloSeccion = (texto: string, yy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...NAVY);
    doc.text(texto, margen + pad, yy + 8);
    return yy + 22;
  };

  const anchoInterno = ancho - pad * 2;

  const lineasDe = (texto: string, w: number, size = 9.5) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    return doc.splitTextToSize(texto || "—", w) as string[];
  };

  const pintarLineas = (lineas: string[], x: number, yy: number, size = 9.5) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...TEXTO);
    let cur = yy;
    for (const l of lineas) {
      doc.text(l, x, cur);
      cur += 13;
    }
    return cur;
  };

  // ---------- Datos generales (2 columnas) ----------
  {
    const colW = (anchoInterno - 20) / 2;
    const pares: [string, string][] = [
      ["Asunto", datos.asunto],
      ["Proyecto", `${datos.proyectoCodigo ? `${datos.proyectoCodigo} · ` : ""}${datos.proyectoNombre}`],
      ["Fecha", formatoFechaHora(datos.fecha_reunion)],
      ["Lugar", datos.lugar],
      ["Tipo de reunión", datos.tipoReunionEtiqueta],
    ];
    const alturas: number[] = [];
    for (const [, valor] of pares) alturas.push(lineasDe(valor, colW).length * 13 + 12);
    let altoDatos = 0;
    for (let i = 0; i < alturas.length; i += 2) {
      altoDatos += Math.max(alturas[i] ?? 0, alturas[i + 1] ?? 0);
    }
    const alto = 22 + altoDatos + pad * 2 - 6;
    let yy = tituloSeccion("Datos generales", abrirTarjeta(alto));

    for (let i = 0; i < pares.length; i += 2) {
      let maxAlto = 0;
      for (let c = 0; c < 2; c += 1) {
        const par = pares[i + c];
        if (!par) continue;
        const x = margen + pad + c * (colW + 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...GRIS);
        doc.text(par[0].toUpperCase(), x, yy);
        const fin = pintarLineas(lineasDe(par[1], colW), x, yy + 12);
        maxAlto = Math.max(maxAlto, fin - yy + 4);
      }
      yy += maxAlto;
    }
  }

  // ---------- Asistentes ----------
  {
    const items = [
      ...datos.participantes,
      ...(datos.otros_asistentes ? [datos.otros_asistentes] : []),
    ];
    const lineas = items.length
      ? items.flatMap((t) => lineasDe(`• ${t}`, anchoInterno))
      : ["—"];
    const alto = 22 + lineas.length * 13 + pad * 2 - 6;
    const yy = tituloSeccion("Asistentes", abrirTarjeta(alto));
    pintarLineas(lineas, margen + pad, yy);
  }

  // ---------- Contenido ----------
  {
    const lNotas = lineasDe(datos.notas, anchoInterno);
    const lAcciones = datos.acciones ? lineasDe(datos.acciones, anchoInterno) : null;
    let alto = 22 + 12 + lNotas.length * 13 + pad * 2 - 6;
    if (lAcciones) alto += 10 + 12 + lAcciones.length * 13;
    let yy = tituloSeccion("Contenido", abrirTarjeta(alto));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...GRIS);
    doc.text("NOTAS", margen + pad, yy);
    yy = pintarLineas(lNotas, margen + pad, yy + 12);
    if (lAcciones) {
      yy += 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(...GRIS);
      doc.text("ACCIONES A TOMAR", margen + pad, yy);
      pintarLineas(lAcciones, margen + pad, yy + 12);
    }
  }

  // ---------- Imágenes ----------
  if (datos.imagenes.length > 0) {
    const imgs = (await Promise.all(datos.imagenes.map((u) => comoJpeg(u)))).filter(
      Boolean,
    ) as { dataUrl: string; w: number; h: number }[];

    if (imgs.length) {
      const lado = 130;
      const sep = 14;
      const filas = Math.ceil(imgs.length / 2);
      const altoTotal = 22 + filas * (lado + sep) - sep + pad * 2 - 6;
      const cabe = y + altoTotal <= altoPag - margen;

      if (cabe) {
        const yy = tituloSeccion("Imágenes", abrirTarjeta(altoTotal));
        imgs.forEach((img, i) => {
          const fila = Math.floor(i / 2);
          const col = i % 2;
          const x = margen + pad + col * (lado + sep);
          try {
            doc.addImage(img.dataUrl, "JPEG", x, yy + fila * (lado + sep), lado, lado);
          } catch {
            /* imagen no legible */
          }
        });
      } else {
        // Rejilla paginada
        nuevaPagina();
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(...NAVY);
        doc.text("Imágenes", margen, y + 8);
        y += 22;
        let col = 0;
        for (const img of imgs) {
          if (col === 0) asegurar(lado + sep);
          const x = margen + col * (lado + sep);
          try {
            doc.addImage(img.dataUrl, "JPEG", x, y, lado, lado);
          } catch {
            /* imagen no legible */
          }
          col += 1;
          if (col === 2) {
            col = 0;
            y += lado + sep;
          }
        }
        if (col === 1) y += lado + sep;
      }
    }
  }

  // ---------- Firma ----------
  if (datos.firmaPath) {
    const url = await urlFirmada(BUCKET_FIRMAS, datos.firmaPath);
    const img = url ? await comoJpeg(url) : null;
    if (img) {
      const alto = 22 + 90 + pad * 2 - 6;
      const yy = tituloSeccion("Firma", abrirTarjeta(alto));
      try {
        doc.addImage(img.dataUrl, "JPEG", margen + pad, yy, 200, 90);
      } catch {
        /* firma no legible */
      }
    }
  }

  return doc.output("blob");
}

function nombreArchivoActa(datos: DatosPdfActa): string {
  const fecha = new Date(datos.fecha_reunion);
  const pad = (n: number) => String(n).padStart(2, "0");
  const fechaHora = `${fecha.getFullYear()}${pad(fecha.getMonth() + 1)}${pad(fecha.getDate())}-${pad(fecha.getHours())}${pad(fecha.getMinutes())}`;
  return `${fechaHora}_${datos.proyectoCodigo}_${datos.tipoReunionCodigo}.pdf`;
}

/** Genera el PDF del acta, lo sube al bucket actas-pdf y devuelve la ruta y el nombre. */
export async function generarPdfActa(
  datos: DatosPdfActa,
  _clienteId?: string,
): Promise<{ path: string; nombre: string }> {
  const blob = await blobPdfActa(datos);
  const nombre = nombreArchivoActa(datos);
  // La primera carpeta debe ser el acta_id (así lo esperan las políticas de Storage).
  const path = `${datos.id}/${nombre}`;

  const { error } = await supabase.storage
    .from(BUCKET_PDF)
    .upload(path, blob, { upsert: true, contentType: "application/pdf" });
  if (error) throw error;

  return { path, nombre };
}
