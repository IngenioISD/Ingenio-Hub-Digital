export const MSG_PASSWORD = "La contraseña debe tener al menos 8 caracteres, con letras y números";
export const MSG_PASSWORD_DISTINTA = "La contraseña introducida debe ser igual";
export const MSG_SIN_EMAIL = "El trabajador elegido no tiene correo electrónico en la ficha de personal, dato obligatorio para realizar el registro";
export const MSG_EMAIL_EXISTE = "Ese correo electrónico ya tiene un usuario relacionado. Revisa la ficha de personal de este trabajador para modificarlo";

/** Mínimo 8 caracteres, al menos una letra y un número. */
export function passwordValida(p: string): boolean {
  return p.length >= 8 && /\p{L}/u.test(p) && /\d/.test(p);
}

/** Días naturales transcurridos desde una fecha ISO; texto «hoy» o «hace N días». */
export function haceDias(iso: string | null, ahora: Date = new Date()): string {
  if (!iso) return "";
  const d = new Date(iso);
  const ini = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
  const fin = Date.UTC(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());
  const n = Math.max(0, Math.round((fin - ini) / 86400000));
  return n === 0 ? "hoy" : n === 1 ? "hace 1 día" : `hace ${n} días`;
}
