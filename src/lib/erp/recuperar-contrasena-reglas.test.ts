import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ESPERA_RECUPERACION_MS, segundosParaReenviar } from "./recuperar-contrasena-reglas";

describe("espera de recuperación", () => {
  it("bloquea el reenvío durante exactamente 60 segundos", () => {
    const enviadoEn = 1000;
    const disponibleEn = enviadoEn + ESPERA_RECUPERACION_MS;
    assert.equal(segundosParaReenviar(disponibleEn, enviadoEn), 60);
    assert.equal(segundosParaReenviar(disponibleEn, enviadoEn + 59_999), 1);
    assert.equal(segundosParaReenviar(disponibleEn, enviadoEn + 60_000), 0);
    assert.equal(segundosParaReenviar(disponibleEn, enviadoEn + 61_000), 0);
  });
});