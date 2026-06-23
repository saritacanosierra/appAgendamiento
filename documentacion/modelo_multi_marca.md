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

Si `activa` o `plan_habilitado` estan off, el admin de marca no puede iniciar sesion y las reservas publicas se bloquean.

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
