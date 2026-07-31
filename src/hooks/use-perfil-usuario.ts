import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PerfilUsuario = {
  nombreCompleto: string;
  rolEtiqueta: string;
  iniciales: string;
};

function calcularIniciales(nombre: string): string {
  const partes = nombre.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "?";
  const primera = partes[0]?.[0] ?? "";
  const segunda = partes.length > 1 ? (partes[partes.length - 1]?.[0] ?? "") : "";
  return (primera + segunda).toUpperCase();
}

/**
 * Perfil del usuario logueado para la tarjeta del pie del sidebar.
 *
 * TODO: pendiente de confirmar tabla y columna exactas para obtener nombre
 * completo y etiqueta de rol legible del usuario logueado
 * (ej. usuarios_cliente + catálogo de roles v10).
 */
export function usePerfilUsuario(): PerfilUsuario | null {
  const [perfil, setPerfil] = useState<PerfilUsuario | null>(null);

  useEffect(() => {
    let cancelado = false;

    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) return;

      const { data } = await supabase
        .from("usuarios_cliente")
        .select("nombre, apellidos, apellido1, apellido2, cargo_visible, rol_id, cliente_id")
        .eq("user_id", user.id)
        .eq("activo", true)
        .maybeSingle();

      let rolEtiqueta = data?.cargo_visible ?? "";
      if (!rolEtiqueta && data?.rol_id && data?.cliente_id) {
        const { data: rol } = await supabase
          .from("cliente_roles")
          .select("nombre_visible")
          .eq("rol_id", data.rol_id)
          .eq("cliente_id", data.cliente_id)
          .maybeSingle();
        rolEtiqueta = rol?.nombre_visible ?? "";
      }

      const apellidos =
        data?.apellidos ?? [data?.apellido1, data?.apellido2].filter(Boolean).join(" ");
      const nombreCompleto =
        [data?.nombre, apellidos].filter(Boolean).join(" ").trim() || (user.email ?? "Usuario");

      if (!cancelado) {
        setPerfil({
          nombreCompleto,
          rolEtiqueta: rolEtiqueta || "—",
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
