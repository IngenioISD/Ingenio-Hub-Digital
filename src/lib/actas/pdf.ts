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
  /** Firma recién dibujada (dataURL PNG) todavía no subida a Storage. */
  firmaDataUrlDirecta?: string;
  creadoPorNombre: string;
};

/** Cambia a false para volver a la cabecera clara original. */
const ESTILO_CABECERA_OSCURO = true;

const NAVY: [number, number, number] = [0, 30, 56];
const LIMA: [number, number, number] = [179, 255, 0];
const CARD_BG: [number, number, number] = [244, 246, 249];
const GRIS: [number, number, number] = [110, 118, 129];
const TEXTO: [number, number, number] = [40, 44, 50];

type Par = { bg: [number, number, number]; text: [number, number, number] };

/** Equivalente RGB de los tokens --tipo-reunion-*. */
const COLORES_TIPO: Record<string, Par> = {
  df: { bg: [238, 237, 254], text: [83, 74, 183] },
  propiedad: { bg: [234, 243, 222], text: [59, 109, 17] },
  interna: { bg: [230, 241, 251], text: [24, 95, 165] },
  subcontrata: { bg: [250, 238, 218], text: [133, 79, 11] },
  otra: { bg: [241, 239, 232], text: [95, 94, 90] },
};

function colorTipo(codigo: string): Par {
  return COLORES_TIPO[(codigo ?? "").toLowerCase()] ?? COLORES_TIPO["otra"]!;
}

/** Marca de agua diagonal "BORRADOR" como PNG transparente del tamaño de una A4. */
function marcaAguaBorrador(anchoPt: number, altoPt: number): string | null {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(anchoPt);
    canvas.height = Math.round(altoPt);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(-Math.PI / 4);
    ctx.font = "bold 78px Helvetica, Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(230, 81, 0, 0.10)";
    ctx.fillText("BORRADOR", 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return null;
  }
}



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
  const tipoTexto = (datos.tipoReunionEtiqueta || datos.tipoReunionCodigo || "").toUpperCase();
  const tipoColor = colorTipo(datos.tipoReunionCodigo);

  const anchoPastilla = (texto: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    return doc.getTextWidth(texto) + 14;
  };
  const pintarPastilla = (
    texto: string,
    x: number,
    yTop: number,
    w: number,
    par: { bg: [number, number, number]; text: [number, number, number] },
  ) => {
    doc.setFillColor(...par.bg);
    doc.roundedRect(x, yTop, w, 14, 7, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...par.text);
    doc.text(texto, x + w / 2, yTop + 9.5, { align: "center" });
  };

  const pintarTituloYPastillas = (baseline: number) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.setTextColor(...(ESTILO_CABECERA_OSCURO ? ([255, 255, 255] as [number, number, number]) : NAVY));
    doc.text("Acta de Reunión", anchoPag / 2, baseline, { align: "center" });

    if (tipoTexto) {
      const wTipo = anchoPastilla(tipoTexto);
      const yTop = baseline + 12;
      pintarPastilla(tipoTexto, (anchoPag - wTipo) / 2, yTop, wTipo, tipoColor);
    }
  };

  const pintarAsuntoYEmpresa = () => {
    const lineasAsunto = doc.splitTextToSize(datos.asunto || "—", ancho) as string[];
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...NAVY);
    for (const l of lineasAsunto) {
      doc.text(l, margen, y);
      y += 16;
    }
    y += 8;
  };

  if (ESTILO_CABECERA_OSCURO) {
    const altoFranja = 80;
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, anchoPag, altoFranja, "F");

    doc.setDrawColor(120, 140, 160);
    doc.setLineDashPattern([3, 3], 0);
    doc.roundedRect(margen, 20, 100, 40, 4, 4, "S");
    doc.roundedRect(anchoPag - margen - 100, 20, 100, 40, 4, 4, "S");
    doc.setLineDashPattern([], 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(200, 210, 220);
    doc.text("LOGO CONSTRUCTORA", margen + 50, 43, { align: "center" });
    doc.text("LOGO INGENIO ISD", anchoPag - margen - 50, 43, { align: "center" });

    pintarTituloYPastillas(44);

    y = altoFranja + 24;
    pintarAsuntoYEmpresa();
  } else {
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

    pintarTituloYPastillas(y + 14);
    y += 40;
    pintarAsuntoYEmpresa();
  }


  // ---------- Utilidades de tarjeta ----------
  /** Dibuja una tarjeta con altura conocida y devuelve la y interior inicial. */
  const abrirTarjeta = (alto: number) => {
    asegurar(alto);
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(margen, y, ancho, alto, 6, 6, "F");
    if (ESTILO_CABECERA_OSCURO) {
      doc.setFillColor(...LIMA);
      doc.rect(margen, y + 6, 3, alto - 12, "F");
    }
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

  // ---------- Datos generales ----------
  {
    const colW = (anchoInterno - 20) / 2;
    const filas: [string, string][][] = [
      [["Proyecto", `${datos.proyectoCodigo ? `${datos.proyectoCodigo} · ` : ""}${datos.proyectoNombre}`]],
      [
        ["Lugar", datos.lugar],
        ["Fecha", formatoFechaHora(datos.fecha_reunion)],
      ],
    ];

    const alturas: number[] = [];
    for (const fila of filas) {
      let maxFila = 0;
      for (const [, valor] of fila) {
        const anchoCampo = fila.length === 1 ? anchoInterno : colW;
        maxFila = Math.max(maxFila, lineasDe(valor, anchoCampo).length * 13 + 12);
      }
      alturas.push(maxFila);
    }
    const altoDatos = alturas.reduce((a, b) => a + b, 0);
    const alto = 22 + altoDatos + pad * 2 - 6;
    let yy = tituloSeccion("Datos generales", abrirTarjeta(alto));

    for (const fila of filas) {
      const anchoCampo = fila.length === 1 ? anchoInterno : colW;
      let maxAlto = 0;
      for (let c = 0; c < fila.length; c += 1) {
        const par = fila[c];
        if (!par) continue;
        const x = margen + pad + c * (colW + 20);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...GRIS);
        doc.text(par[0].toUpperCase(), x, yy);
        const fin = pintarLineas(lineasDe(par[1], anchoCampo), x, yy + 12);
        maxAlto = Math.max(maxAlto, fin - yy + 4);
      }
      yy += maxAlto;
    }
  }

  // ---------- Asistentes ----------
  {
    const lineas = datos.participantes.length
      ? datos.participantes.flatMap((t) => lineasDe(`• ${t}`, anchoInterno))
      : ["—"];
    if (datos.otros_asistentes) {
      lineas.push(...lineasDe(`• Otros: ${datos.otros_asistentes}`, anchoInterno));
    }
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

  // ---------- Firma (sin tarjeta) ----------
  if (datos.firmaDataUrlDirecta || datos.firmaPath) {
    const directa: string | null = datos.firmaDataUrlDirecta ?? null;
    let jpeg: string | null = null;
    if (!directa && datos.firmaPath) {
      const url = await urlFirmada(BUCKET_FIRMAS, datos.firmaPath);
      const img = url ? await comoJpeg(url) : null;
      jpeg = img?.dataUrl ?? null;
    }
    if (directa || jpeg) {
      asegurar(90 + 14);
      const yImg = y + 2;
      try {
        if (directa) doc.addImage(directa, "PNG", margen, yImg, 200, 90);
        else doc.addImage(jpeg!, "JPEG", margen, yImg, 200, 90);
      } catch {
        /* firma no legible */
      }
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...TEXTO);
      doc.text(datos.creadoPorNombre || "", margen, yImg + 90 + 4);
      y = yImg + 90 + 14 + gap;
    }
  }


  // ---------- Marca de agua "BORRADOR" (última capa, en todas las páginas) ----------
  if (datos.estado === "borrador") {
    const marca = marcaAguaBorrador(anchoPag, altoPag);
    if (marca) {
      const paginas = doc.getNumberOfPages();
      for (let i = 1; i <= paginas; i += 1) {
        doc.setPage(i);
        try {
          doc.addImage(marca, "PNG", 0, 0, anchoPag, altoPag);
        } catch {
          /* marca de agua no disponible */
        }
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
