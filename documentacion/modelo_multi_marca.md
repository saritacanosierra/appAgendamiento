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
| `admin` | Acceso completo a su marca |
| `staff` | Agenda y clientes (futuro) |

Un usuario solo puede pertenecer a **una** marca en el MVP.

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
