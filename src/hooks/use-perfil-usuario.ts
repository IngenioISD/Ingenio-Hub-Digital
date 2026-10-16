import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { obtenerMiPerfil } from "@/hooks/use-auth";

export type PerfilUsuario = {
  nombreCompleto: string;
  rolEtiqueta: string;
  puesto: string;
  iniciales: string;
};

function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0]?.[0] ?? "";
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primera + segunda).toUpperCase();
}

/** Perfil del usuario logueado para la tarjeta del pie del sidebar (vía mi_perfil). */
export function usePerfilUsuario(): PerfilUsuario | null {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const data = await obtenerMiPerfil();

      const nombreCompleto =
        [data?.nombre, data?.apellidos].filter(Boolean).join(" ").trim() ||
        (user.email ?? "Usuario");

      if (!cancelado) {
        setPerfil({
          nombreCompleto,
          rolEtiqueta: data?.rol_nombre || "—",
          puesto: data?.puesto ?? "",
          iniciales: calcularIniciales(nombreCompleto),
        });
      }
    })();

    return () => {
      cancelado = true;
    };
  }, []);

  return perfil;
}
