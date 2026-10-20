/** Cache local al navegador: nunca comparte identidad entre usuarios. */
export function crearCachePerfil<T>(obtener: () => Promise<T | null>, ahora = Date.now) {
  let entrada: { userId: string; perfil: T | null; vence: number } | undefined;
  return {
    async consultar(userId: string) {
      if (entrada?.userId === userId && ahora() < entrada.vence) return entrada.perfil;
      const perfil = await obtener();
      entrada = { userId, perfil, vence: ahora() + 30_000 };
      return perfil;
    },
    limpiar() { entrada = undefined; },
  };
}