import { supabase } from "@/integrations/supabase/client";

export const BUCKET_IMAGENES = "actas-imagenes";
export const BUCKET_FIRMAS = "actas-firmas";
export const BUCKET_PDF = "actas-pdf";

export type EstadoActa = "borrador" | "generada";

export type TipoParticipante = "interna" | "propiedad" | "df" | "subcontrata" | "otro";

/** Par de color (bg/text) del badge de tipo de reunión, tomado del sistema de diseño. */
export function colorTipoReunion(codigo: string | null | undefined): {
  bg: string;
  text: string;
} {
  const slug = (codigo ?? "").toLowerCase();
  const conocidos = ["df", "propiedad", "interna", "subcontrata"];
  const clave = conocidos.includes(slug) ? slug : "otra";
  return {
    bg: `var(--tipo-reunion-${clave}-bg)`,
    text: `var(--tipo-reunion-${clave}-text)`,
  };
}

/** Los buckets de actas son privados: hay que firmar la URL para poder mostrarla. */
export async function urlFirmada(
  bucket: string,
  path: string | null | undefined,
  segundos = 3600,
): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data } = await supabase.storage.from(bucket).createSignedUrl(path, segundos);
  return data?.signedUrl ?? null;
}

export function dataUrlToBlob(dataUrl: string): Blob {
  const [cabecera, base64] = dataUrl.split(",");
  const mime = /:(.*?);/.exec(cabecera ?? "")?.[1] ?? "image/png";
  const binario = atob(base64 ?? "");
  const bytes = new Uint8Array(binario.length);
  for (let i = 0; i < binario.length; i += 1) bytes[i] = binario.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

export function formatoFechaHora(valor: string | null | undefined): string {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatoFecha(valor: string | null | undefined): string {
  if (!valor) return "—";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "—";
  return fecha.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/** Valor para <input type="datetime-local"> */
export function aDatetimeLocal(valor: string | null | undefined): string {
  if (!valor) return "";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}T${pad(
    fecha.getHours(),
  )}:${pad(fecha.getMinutes())}`;
}

/** Comprime una imagen a JPEG (máx. 1200px de ancho, calidad 0.7) antes de subirla. */
export async function comprimirImagen(file: File, maxAncho = 1200, calidad = 0.7): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, maxAncho / bitmap.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", calidad),
    );
    return blob ?? file;
  } catch {
    return file;
  }
}
