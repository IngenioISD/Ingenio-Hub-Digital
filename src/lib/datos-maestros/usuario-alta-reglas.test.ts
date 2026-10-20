import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { haceDias, passwordValida } from "./usuario-alta-reglas";

describe("contraseña temporal", () => {
  it("rechaza menos de 8 caracteres", () => assert.equal(passwordValida("abc1234"), false));
  it("rechaza sin números", () => assert.equal(passwordValida("abcdefgh"), false));
  it("rechaza sin letras", () => assert.equal(passwordValida("12345678"), false));
  it("acepta 8 caracteres con letras y números", () => assert.equal(passwordValida("abcdefg1"), true));
});

describe("primer acceso pendiente", () => {
  const ahora = new Date(2026, 9, 20, 12);
  it("mismo día es «hoy»", () => assert.equal(haceDias(new Date(2026, 9, 20, 1).toISOString(), ahora), "hoy"));
  it("cuenta días", () => assert.equal(haceDias(new Date(2026, 9, 15, 23).toISOString(), ahora), "hace 5 días"));
});
