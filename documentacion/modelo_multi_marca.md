# Modelo multi-marca

## Concepto

Cada **marca** es un tenant independiente. Equivalente a una tienda o spa con su propio micrositio y panel admin.

## Identificacion

| Campo | Uso |
|-------|-----|
| `id` | Clave interna — usada en FK |
| `slug` | URL publica — `/m/luna-nails` |
| `activa` | Marca visible o suspendida |

## Aislamiento de datos

Todas estas tablas incluyen `marca_id`:

- `clientes`
- `servicios`
- `citas`
- `publicaciones_blog`
- `disenos_galeria`
- `notificaciones`
- `configuraciones_marca`
- `usuarios` (admin pertenece a una marca)
- `estilistas` (portafolio del equipo: foto, habilidades y trabajos de esa marca)

## Reglas de confidencialidad

1. **Nunca** listar registros sin filtrar por `marca_id`
2. En API admin, `marca_id` viene del token de sesion del usuario
3. Un telefono repetido en dos marcas = dos filas en `clientes`
4. Los repositorios reciben `marca_id` como parametro obligatorio

## Ejemplo de consulta segura

```sql
-- Correcto
SELECT * FROM clientes WHERE marca_id = :marca_id ORDER BY nombre;

-- Incorrecto (nunca en produccion)
SELECT * FROM clientes WHERE telefono = :telefono;
```

## Tres puertas

| Rol | Quien | Entrada | Sesion |
|-----|-------|---------|--------|
| Superadmin | Duena de la app | `/plataforma` | Token propio, sin `marca_id`. Ve las tiendas; al entrar a una abre solo esa |
| Admin | Duena de una marca | `/admin` | Token de su marca. `marca_id` sale de la sesion |
| Cliente | Quien agenda | `/m/{slug}` | Sin cuenta ni token. Solo esa tienda, con su WhatsApp |

Un token de un rol no abre las rutas de otro. El mismo telefono en dos tiendas son dos clientes.

Una marca nueva entra a un inicio generico: portada con su nombre, paleta blanco, rosa, lila y morado oscuro, y tres pasos en el panel (estilo, servicios, foto). No hereda contenido de otra tienda. Al crear el primer servicio, el panel pasa a la agenda del dia.

La publicidad del blog es de la plataforma, no de la marca. Solo el superadmin crea campanas en `/plataforma/publicidad`. Cada campana es una imagen que abre un enlace, o un enlace suelto, y se asigna a una o varias publicaciones. No usa `marca_id` y no sale en el resto del blog.

## Usuarios y roles

| Rol | Permisos |
|-----|----------|
| `superadmin` | Panel plataforma: crear empresas, habilitar plan, reportes globales |
| `admin` | Acceso completo a su marca |
| `staff` | Agenda y clientes (futuro) |

Un usuario de marca pertenece a **una** empresa. El superadmin no tiene `marca_id` y opera en `/plataforma`.

## Panel plataforma (superadmin)

Rutas frontend:

- `/plataforma/marcas` — listar, crear y activar/suspender empresas
- `/plataforma/reportes` — reportes globales agregados

Cada empresa creada recibe un admin inicial con correo y contrasena. El slug define la URL publica `/m/{slug}`.

Campos de control por empresa:

| Campo | Uso |
|-------|-----|
| `activa` | Empresa visible o suspendida |
| `plan_habilitado` | Si puede operar (reservas, panel) segun plan contratado |

Si `activa` esta off, el admin no entra y la agenda publica se bloquea. Si el plan vencio, las clientas no reservan, pero la administradora si entra para pagar $25.000 con Wompi y renovar un mes. Un salon nuevo, creado en la landing, tiene 8 dias gratis.

La landing `/` es la puerta de la web: registro del salon, entrada de administradora, entrada de clienta por el nombre corto, y entrada de la duena de la app.

## Modo soporte (superadmin)

Desde **Mis marcas**, el boton **Entrar al panel** abre el panel admin de esa empresa sin conocer su contraseña. Aparece un aviso azul "Modo soporte" con enlace para volver a Mis marcas.

## Google Calendar por empresa

1. Las credenciales OAuth de la **aplicacion** se configuran en `backend/.env` (infraestructura del servidor).
2. **Cada empresa** conecta su propia cuenta Google en Admin → Configuracion.
3. El `refresh_token` se guarda en `configuraciones_marca.configuracion_json` por `marca_id`.

Las empresas no comparten calendario ni cuenta de Google.

## Configuracion visual

Tabla `configuraciones_marca` extendida:

- Colores adicionales (`color_fondo`, `color_texto`)
- Tipografia
- JSON libre para futuras opciones

Variables CSS en frontend:

```css
--color-principal
--color-secundario
--color-fondo
--color-texto
```

Aplicadas dinamicamente via `aplicarTemaMarca()` al cargar la marca.

## Fase 2 — Implementacion

- `MarcaRepositorio::buscarPorSlug()`
- `MarcaMiddleware::obtenerMarcaIdAutenticada()` desde token
- Validacion en cada repositorio admin

## Fase 3 — Escalabilidad

- Subdominios: `luna.tudominio.com`
- Dominios personalizados por marca
- Panel super-admin para crear marcas (fuera del MVP)
