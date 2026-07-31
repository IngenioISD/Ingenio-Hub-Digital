import { supabase } from "@/integrations/supabase/client";

/**
 * Claims personalizados inyectados por el Auth Hook `custom_access_token_hook`.
 * Nunca se toman decisiones a partir de nombres de rol, solo de estos campos.
 */
export type IngenioClaims = {
  empresa_id?: string | undefined;
  rol_id?: string | undefined;
  portal?: string | undefined;
  nivel_aprobacion?: number | undefined;
  es_corporativo?: boolean | undefined;
  acceso_total_proyectos?: boolean | undefined;
  grupo_id?: string | undefined;
};

/** Decodifica el payload de un JWT (base64url) sin dependencias externas. */
export function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const part = token.split(".")[1];
    if (!part) return null;
    const base64 = part.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
    const json = decodeURIComponent(
      atob(padded)
        .split("")
        .map((c) => "%" + c.charCodeAt(0).toString(16).padStart(2, "0"))
        .join(""),
    );
    return JSON.parse(json) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function claimsFromToken(accessToken: string): IngenioClaims {
  const payload = decodeJwtPayload(accessToken) ?? {};
  return {
    empresa_id: payload["empresa_id"] as string | undefined,
    rol_id: payload["rol_id"] as string | undefined,
    portal: payload["portal"] as string | undefined,
    nivel_aprobacion: payload["nivel_aprobacion"] as number | undefined,
    es_corporativo: payload["es_corporativo"] as boolean | undefined,
    acceso_total_proyectos: payload["acceso_total_proyectos"] as boolean | undefined,
    grupo_id: payload["grupo_id"] as string | undefined,
  };
}

export async function getCurrentClaims(): Promise<IngenioClaims | null> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return null;
  return claimsFromToken(token);
}

/**
 * Calcula la ruta de destino tras autenticarse a partir de los claims del JWT.
 *
 * TODO: cuando un usuario tenga acceso simultáneo a Digital y a HUB, priorizamos
 * 'hub' como destino por defecto. Es una suposición temporal, a afinar cuando
 * trabajemos el detalle de permisos.
 */
export async function resolvePostLoginPath(claims: IngenioClaims): Promise<string> {
  if (claims.portal === "digital") return "/digital/inicio";

  if (claims.acceso_total_proyectos === false) {
    // TODO: verificar nombre exacto de la tabla/columna de asignación de proyecto
    // único, pendiente de confirmar con Supabase (usamos usuario_proyectos).
    const { data } = await supabase
      .from("usuario_proyectos")
      .select("proyecto_id")
      .eq("activo", true)
      .limit(2);

    if (data && data.length === 1 && data[0]?.proyecto_id) {
      return `/proyecto/${data[0].proyecto_id}/inicio`;
    }
  }

  return "/hub/inicio";
}
