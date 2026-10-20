import { describe, expect, it } from "vitest";
import { haceDias, passwordValida } from "./usuario-alta-reglas";

describe("contraseña temporal", () => {
  it("rechaza menos de 8 caracteres", () => expect(passwordValida("abc1234")).toBe(false));
  it("rechaza sin números", () => expect(passwordValida("abcdefgh")).toBe(false));
  it("rechaza sin letras", () => expect(passwordValida("12345678")).toBe(false));
  it("acepta 8 caracteres con letras y números", () => expect(passwordValida("abcdefg1")).toBe(true));
});

describe("primer acceso pendiente", () => {
  const ahora = new Date(2026, 9, 20, 12);
  it("mismo día es «hoy»", () => expect(haceDias(new Date(2026, 9, 20, 1).toISOString(), ahora)).toBe("hoy"));
  it("cuenta días", () => expect(haceDias(new Date(2026, 9, 15, 23).toISOString(), ahora)).toBe("hace 5 días"));
});
