export const ESPERA_RECUPERACION_MS = 60_000;

export function segundosParaReenviar(disponibleEn: number, ahora = Date.now()): number {
  return Math.max(0, Math.ceil((disponibleEn - ahora) / 1000));
}