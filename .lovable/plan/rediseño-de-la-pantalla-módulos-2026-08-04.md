# Rediseño de la pantalla Módulos

## Alcance

Rediseñar únicamente el catálogo compartido por `/hub/modulos` y `/proyecto/$id/modulos`. No cambiar textos, orden, navegación, Sidebar ni ninguna otra pantalla.

## Implementación

1. **Catálogo tipado con iconos**
   - Añadir a cada módulo su componente de icono de `lucide-react`, respetando exactamente la asignación y el orden indicados.
   - Mantener sin cambios los 8 capítulos, los 58 títulos, descripciones y el TODO existente de `cliente_modulos`.
   - Usar directamente los iconos solicitados, ya que todos existen en la versión instalada de `lucide-react`.

2. **Rejilla responsive exclusiva del catálogo**
   - Adaptar `.chapter-grid` a 4 columnas en escritorio, 2 en tablet y 1 en móvil.
   - Conservar los gaps y tokens existentes del sistema de diseño, sin introducir colores, radios ni tipografías nuevas.
   - Dar a las 8 `.chapter-box` una altura común y estable, calculada para título, contador, tres tarjetas y pie de expansión.

3. **Resumen uniforme de cada capítulo**
   - Convertir la cabecera en una fila robusta con título y badge `.badge.badge-neutral` que muestre el total de módulos.
   - Mostrar únicamente los tres primeros módulos de cada capítulo.
   - Crear una tarjeta de módulo reutilizable con `.module-card`, `.module-card-icon`, icono Lucide, título, descripción y badge `En desarrollo`, manteniendo su estado atenuado y no interactivo.
   - Reservar una zona inferior estable: mostrar `+ N más →` solo cuando existan módulos adicionales y dejar el mismo espacio vacío cuando no los haya, sin estirar las tarjetas.

4. **Dialog con el catálogo completo del capítulo**
   - Usar el `Dialog` de shadcn/ui existente, abierto desde `+ N más →` y cerrable con la X, Escape o clic fuera.
   - Aplicar al contenido del dialog la variante `chapter-box--{slug}` para heredar el fondo y texto propios del capítulo.
   - Mostrar nombre, badge de recuento y todos los módulos del capítulo mediante la misma tarjeta reutilizable con iconos.
   - Usar una columna en pantallas estrechas y dos cuando el ancho lo permita, con altura máxima y desplazamiento interno para capítulos largos.
   - Mantener las tarjetas informativas y sin navegación.

## Verificación

- Comprobar build y tipos.
- Revisar `/hub/modulos` y `/proyecto/$id/modulos` en escritorio, tablet y móvil.
- Confirmar 4×2, 2×4 y 1 columna según viewport, ocho cajas de idéntica altura y máximo tres tarjetas visibles por caja.
- Abrir y cerrar dialogs de al menos un capítulo largo y uno corto, verificando contador, color del capítulo, listado completo, iconos y ausencia de navegación.
- Comprobar que no aparecen errores de consola y que el resto de pantallas permanece sin cambios.

## Detalles técnicos

- Archivos previstos: catálogo tipado, componente compartido y reglas responsive de `.chapter-grid`/cajas en el sistema de diseño existente.
- No se modificarán las dos rutas consumidoras salvo que la verificación revele una necesidad estrictamente ligada a este rediseño.