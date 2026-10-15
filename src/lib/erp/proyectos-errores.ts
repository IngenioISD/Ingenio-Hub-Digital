/** Traduce el error de código duplicado (23505) que devuelve la base de datos. */
export function errorProyecto(e: unknown): Error {
  const err = e as { code?: string; message?: string } | null;
  if (err?.code === "23505" && /codigo/i.test(err.message ?? "")) {
    return new Error("Ese código ya está en uso en otro proyecto");
  }
  return e instanceof Error ? e : new Error(err?.message ?? "Error al guardar");
}
