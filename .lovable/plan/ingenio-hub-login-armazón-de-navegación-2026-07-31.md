# Ingenio HUB — Login + armazón de navegación

## Qué se construye

1. Pantalla de Login conectada a Supabase Auth.
2. Lógica de redirección tras login basada en los claims del JWT.
3. Componentes reutilizables: Sidebar (modo dirección / modo proyecto) y FranjaModulo.
4. Rutas vacías de Digital, Hub y Proyecto con su sidebar correspondiente.

Sin contenido real de pantallas (KPIs, tarjetas de módulo): solo el armazón navegable.

## Login (`/login`)

Dos columnas a pantalla completa:

- **Izquierda (~45%, oculta en móvil)**: fondo navy `--brand-navy-deep`, centrado: logo `/ingenio-sin-fondo.svg`, "INGENIO" en blanco bold mayúsculas con tracking amplio, "HUB · DIGITAL" en lima pequeño, y el descriptivo en gris apagado.
- **Derecha (blanco, max-width 400px)**: "Bienvenido" (24px bold), subtítulo gris, campo Correo electrónico, campo Contraseña con icono de ojo (labels en mayúsculas pequeñas), un único botón primario de ancho completo "Iniciar sesión" (fondo navy, texto lima), enlace "¿Olvidaste tu contraseña?" centrado y pie de copyright.
- Errores de credenciales con el `Alert` variant destructive de shadcn.
- La ruta `/` redirige a `/login` si no hay sesión, y al destino calculado si la hay.

## Redirección tras login

Se decodifica el payload del JWT de la sesión (sin librerías extra) y se leen los claims `portal`, `es_corporativo`, `acceso_total_proyectos`, `grupo_id`, `empresa_id`, `rol_id`, `nivel_aprobacion`. Ninguna decisión se basa en nombres de rol.

1. `portal = 'digital'` → `/digital/inicio`
2. `portal = 'hub'` y `acceso_total_proyectos = false` con exactamente un proyecto activo asignado → `/proyecto/:id/inicio`
3. Resto de casos con `portal = 'hub'` → `/hub/inicio`

Comprobado en la base de datos: la asignación de proyectos existe en `usuario_proyectos` (`user_id`, `cliente_id`, `proyecto_id`, `activo`), así que la consulta del proyecto único usa esa tabla, con un comentario TODO indicando que queda por confirmar formalmente. Se deja también el TODO sobre la prioridad `hub` cuando el usuario tenga acceso a ambos portales.

## Componentes del armazón

**`<Sidebar mode="direccion" | "proyecto" activeItem>`**

- `direccion`: fondo navy, 240px (60px colapsado en tablet, solo iconos). Logo `/hub-sin-fondo.svg` o `/digital-sin-fondo.svg` según contexto, con "HUB"/"DIGITAL" en lima debajo. Ítems: icono lucide + texto 13px medium, blanco 70%. Ítem activo: borde izquierdo 2.5px lima, fondo `rgba(179,255,0,0.07)`, texto e icono lima, semibold.
- `proyecto`: fondo verde bosque, bloque "OBRA ACTIVA" con nombre de obra en blanco mayúsculas y badge de estado, enlace "← Proyectos" sobre el menú. Ítem activo: fondo blanco 14% + texto/icono blanco bold, sin lima.
- Ítems placeholder: Inicio, Módulos, Proyectos, Apps, Agentes.
- Pie fijo en ambos modos: separador fino, ítem "Datos Maestros" (siempre visible), y tarjeta de perfil clicable (bloque redondeado, fondo blanco 8%) con avatar circular de iniciales (lima translúcido en dirección, blanco translúcido en proyecto), nombre completo bold y rol debajo; abre Configuración. Datos del usuario desde `usuarios_cliente` (nombre/apellidos, `cargo_visible`) con `cliente_roles.nombre_visible` como etiqueta de rol, y TODO comentado para confirmar el catálogo de roles v10.

**`<FranjaModulo colorFondo colorTexto icono titulo subtitulo>`**: barra superior de 56px, colores por props. No se usa en Inicio/Módulos/Proyectos.

**`<AppShell>`**: layout que combina sidebar + área de contenido con fondo `--bg-app`.

## Rutas

`/digital/inicio`, `/digital/apps`, `/digital/agentes` (sidebar dirección, logo Digital); `/hub/inicio`, `/hub/modulos`, `/hub/proyectos` (sidebar dirección, logo Hub); `/proyecto/$id/inicio`, `/proyecto/$id/modulos` (sidebar proyecto). Cada una solo con un `<h1>` con el nombre de la pantalla.

## Notas técnicas

- Todas las rutas de app van bajo el layout `_authenticated` gestionado por la integración (redirige a `/login` si no hay sesión); se ajustará su destino a `/login`.
- Colores, tipografía y radios se toman exclusivamente de las variables de `ingenio-design-system.css` (ya importado en el root) mediante clases utilitarias con `var(--token)`; sin hex en componentes.
- Lectura de perfil y de proyecto asignado mediante server functions con `requireSupabaseAuth`, llamadas desde componente (no desde loaders públicos).
- Verificación final con build de desarrollo y comprobación de la pantalla en el navegador.
