import jsPDF from "jspdf";

import { supabase } from "@/integrations/supabase/client";
import { BUCKET_PDF, formatoFechaHora, urlFirmada, BUCKET_FIRMAS } from "@/lib/actas/actas";

export type DatosPdfActa = {
  id: string;
  asunto: string;
  lugar: string;
  fecha_reunion: string;
  tipoReunionEtiqueta: string;
  proyectoNombre: string;
  notas: string;
  acciones: string | null;
  otros_asistentes: string | null;
  participantes: string[];
  empresaNombre: string;
  firmaPath: string | null;
};

async function cargarImagen(url: string): Promise<string | null> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

/** Construye el PDF del acta en memoria y devuelve el Blob (no guarda nada). */
export async function blobPdfActa(datos: DatosPdfActa): Promise<Blob> {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margen = 48;
  const ancho = doc.internal.pageSize.getWidth() - margen * 2;
  let y = margen;

  const salto = (alto: number) => {
    if (y + alto > doc.internal.pageSize.getHeight() - margen) {
      doc.addPage();
      y = margen;
    }
  };

  const titulo = (texto: string) => {
    salto(28);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(0, 30, 56);
    doc.text(texto, margen, y);
    y += 16;
  };

  const parrafo = (texto: string) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(40, 40, 40);
    const lineas = doc.splitTextToSize(texto || "—", ancho);
    for (const linea of lineas) {
      salto(14);
      doc.text(linea, margen, y);
      y += 14;
    }
    y += 6;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(0, 30, 56);
  doc.text("Acta de Reunión", margen, y);
  y += 22;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(datos.empresaNombre || "", margen, y);
  y += 24;

  titulo("Datos generales");
  parrafo(
    [
      `Asunto: ${datos.asunto}`,
      `Proyecto: ${datos.proyectoNombre}`,
      `Fecha: ${formatoFechaHora(datos.fecha_reunion)}`,
      `Lugar: ${datos.lugar}`,
      `Tipo de reunión: ${datos.tipoReunionEtiqueta}`,
    ].join("\n"),
  );

  titulo("Asistentes");
  parrafo(
    [...datos.participantes, ...(datos.otros_asistentes ? [datos.otros_asistentes] : [])].join(
      "\n",
    ) || "—",
  );

  titulo("Notas");
  parrafo(datos.notas);

  if (datos.acciones) {
    titulo("Acciones a tomar");
    parrafo(datos.acciones);
  }

  if (datos.firmaPath) {
    const url = await urlFirmada(BUCKET_FIRMAS, datos.firmaPath);
    const dataUrl = url ? await cargarImagen(url) : null;
    if (dataUrl) {
      titulo("Firma");
      salto(110);
      try {
        doc.addImage(dataUrl, "PNG", margen, y, 200, 90);
      } catch {
        /* firma no legible: se omite */
      }
      y += 100;
    }
  }

  return doc.output("blob");
}

/** Genera el PDF del acta, lo sube al bucket actas-pdf y devuelve la ruta y el nombre. */
export async function generarPdfActa(
  datos: DatosPdfActa,
  _clienteId?: string,
): Promise<{ path: string; nombre: string }> {
  const blob = await blobPdfActa(datos);
  const nombre = `acta-${datos.id}.pdf`;
  // La primera carpeta debe ser el acta_id (así lo esperan las políticas de Storage).
  const path = `${datos.id}/${nombre}`;

  const { error } = await supabase.storage
    .from(BUCKET_PDF)
    .upload(path, blob, { upsert: true, contentType: "application/pdf" });
  if (error) throw error;

  return { path, nombre };
}
