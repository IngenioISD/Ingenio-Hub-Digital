import { describe, expect, test } from "bun:test";
import { nivelAcceso, permiteAcciones, puedeGuardarExcepcion, seleccionarVisibles, type AccesoUsuario } from "./usuario-accesos-reglas";

const fila: AccesoUsuario = { modulo: "personal", tipo: "modulo", orden: 1, rol_base: "administracion", rol_aplicado: "tecnico", es_excepcion: false, excepcion_id: null, todos_los_proyectos: false, proyectos: [], puede_ver: true, puede_crear: false, puede_editar: false, puede_eliminar: false, puede_aprobar: false, puede_exportar: false };
describe("Reglas de excepciones de acceso", () => {
  test("sin rol aplicado no tiene acceso", () => expect(nivelAcceso({ ...fila, rol_aplicado: null })).toBe("sin_acceso"));
  test("sin permiso de ver no tiene acceso", () => expect(nivelAcceso({ ...fila, puede_ver: false })).toBe("sin_acceso"));
  test("ver sin crear editar eliminar es lectura", () => expect(nivelAcceso(fila)).toBe("lectura"));
  for (const campo of ["puede_crear", "puede_editar", "puede_eliminar"] as const) {
    test(`${campo} concede escritura si puede ver`, () => expect(nivelAcceso({ ...fila, [campo]: true })).toBe("escritura"));
  }
  test("sin puedeEditar no hay acciones ni en excepciones", () => expect(permiteAcciones(false, { ...fila, es_excepcion: true })).toBe(false));
  test("sin acceso ni excepción no hay acciones", () => expect(permiteAcciones(true, { ...fila, rol_aplicado: null })).toBe(false));
  test("una excepción sin rol aplicado se puede editar", () => expect(permiteAcciones(true, { ...fila, rol_aplicado: null, es_excepcion: true })).toBe(true));
  test("sin rol no se guarda", () => expect(puedeGuardarExcepcion("", "administracion", true, [])).toBe(false));
  test("mismo rol base no se guarda", () => expect(puedeGuardarExcepcion("administracion", "administracion", true, [])).toBe(false));
  test("proyectos concretos requieren selección", () => {
    expect(puedeGuardarExcepcion("tecnico", "administracion", false, [])).toBe(false);
    expect(puedeGuardarExcepcion("tecnico", "administracion", false, ["proyecto-1"])).toBe(true);
  });
  test("todos permite guardar sin selección", () => expect(puedeGuardarExcepcion("tecnico", "administracion", true, [])).toBe(true));
  test("seleccionar todos solo añade los visibles y conserva selección anterior", () => expect(seleccionarVisibles(["anterior", "visible-1"], ["visible-1", "visible-2"])).toEqual(["anterior", "visible-1", "visible-2"]));
});