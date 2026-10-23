import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { bloqueadoPorPersonal, type CatalogoFila, type UsuarioFila } from "./usuarios";

const base: UsuarioFila = {
  id: "1", userId: "u1", rolId: "r", accesoDesactivado: false, accesoTotalProyectos: false,
  activo: true, personalId: "p1", nombre: "A", apellido1: "B", nombreCompleto: "B, A",
  email: "a@b.c", puestoId: null, estadoId: null, fichaActiva: true,
  debeCambiarPassword: false, creadoEn: null,
};
const cat = (cuenta: boolean | null): CatalogoFila => ({ id: "e1", tipo: "estado", nombre: "Baja", rol_id: null, cuenta_como_activo: cuenta });

describe("bloqueadoPorPersonal", () => {
  it("ficha inactiva bloquea", () => assert.equal(bloqueadoPorPersonal({ ...base, fichaActiva: false }, new Map()), true));
  it("estado que no cuenta como activo bloquea", () =>
    assert.equal(bloqueadoPorPersonal({ ...base, estadoId: "e1" }, new Map([["e1", cat(false)]])), true));
  it("estado que cuenta como activo no bloquea", () =>
    assert.equal(bloqueadoPorPersonal({ ...base, estadoId: "e1" }, new Map([["e1", cat(true)]])), false));
  it("sin estado no bloquea", () => assert.equal(bloqueadoPorPersonal(base, new Map()), false));
  it("estado desconocido no bloquea", () => assert.equal(bloqueadoPorPersonal({ ...base, estadoId: "x" }, new Map()), false));
  it("bloqueo de Personal es independiente del deshabilitado manual", () =>
    assert.equal(bloqueadoPorPersonal({ ...base, fichaActiva: false, accesoDesactivado: true }, new Map()), true));
});
