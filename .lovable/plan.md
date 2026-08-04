# Catálogo real de Módulos de Ingenio HUB

## Alcance

Construir únicamente el contenido de `/hub/modulos` y `/proyecto/$id/modulos`. Se mantienen intactos Sidebar, Login, Inicio, Proyectos, Apps, Agentes y las rutas de módulos concretos.

## Implementación

1. **Catálogo fijo y reutilizable**
   - Crear una constante tipada con los 8 capítulos y todos los módulos, títulos y descripciones suministrados, respetando exactamente su orden.
   - No incluir el capítulo Comunicación.
   - Añadir junto al catálogo el TODO completo sobre el futuro filtrado mediante `cliente_modulos`, la mezcla de granularidad de su columna `modulo` y la activación futura de badges, franjas y rutas.

2. **Vista compartida del catálogo**
   - Crear un componente presentacional reutilizable por ambos modos.
   - Renderizar una cabecera con título `Módulos` y el subtítulo recibido por la ruta.
   - Renderizar los capítulos con `chapter-grid`, `.chapter-box` y la variante `chapter-box--{slug}` ya definida en el sistema de diseño.
   - Renderizar cada módulo como `.module-card` no interactiva, con título, descripción atenuada y badge `.badge.badge-neutral` con el texto `En desarrollo`.
   - Neutralizar el cursor y el efecto visual interactivo sin añadir colores, radios ni variables nuevas.

3. **Integración en las dos rutas**
   - `/hub/modulos`: conservar `AppShell` en modo dirección y usar el subtítulo `Capítulos y módulos disponibles en tu plan HUB`.
   - `/proyecto/$id/modulos`: conservar el modo proyecto, sus datos de obra activa y usar el subtítulo `Herramientas de gestión para esta obra`.
   - Añadir metadatos propios y distintos para ambas rutas: title, description, Open Graph, `og:type` y `twitter:card`.

## Verificación

- Ejecutar el build de desarrollo.
- Abrir ambas rutas con la sesión disponible y comprobar visualmente en escritorio y móvil:
  - exactamente 8 capítulos, en el orden solicitado;
  - todos los módulos y textos completos;
  - badge `En desarrollo` en cada módulo;
  - ningún módulo clicable y ninguna navegación nueva;
  - 3 columnas en escritorio y 1 en móvil;
  - sidebar de dirección y sidebar de proyecto conservados sin cambios.