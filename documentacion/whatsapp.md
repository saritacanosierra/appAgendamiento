# WhatsApp Business — confirmacion de reservas

Integracion con la **WhatsApp Cloud API** de Meta. **Cada marca** usa su propio numero y credenciales; no se mezclan entre tenants.

## Sin token (contacto manual)

Si solo quieres que las clientas te escriban por WhatsApp **sin configurar Meta**, basta con el campo **WhatsApp (contacto)** en Admin → Mi marca. La web muestra un boton que abre `wa.me` con el numero de esa marca y un mensaje prellenado. No requiere API ni token.

Vistas con boton wa.me: inicio de marca, hub de citas, confirmacion de reserva y Mi cita.

## Requisitos por marca (mensajes automaticos)

1. Cuenta en [Meta for Developers](https://developers.facebook.com/)
2. App con producto **WhatsApp** vinculada al negocio de esa marca
3. **Phone Number ID** y **token de acceso** del numero de esa marca
4. Numero de prueba o numero verificado de negocio

## Configuracion (Admin de cada marca)

En **Admin → Mi marca → WhatsApp Business**:

| Campo | Descripcion |
|-------|-------------|
| WhatsApp (contacto) | Numero publico que ven las clientas en la web |
| Phone Number ID | ID tecnico en WhatsApp Manager (Meta) |
| Token de acceso | Bearer token de la app Meta de **esa marca** |
| Codigo de pais | Prefijo internacional (Mexico: `52`) |
| Plantilla recordatorio | Nombre de plantilla aprobada (opcional, recomendado en produccion) |

Variables globales en `backend/.env` (solo comportamiento del recordatorio, no el numero):

```env
WHATSAPP_API_VERSION=v21.0
WHATSAPP_RECORDATORIO_HABILITADO=1
WHATSAPP_RECORDATORIO_HORAS=4
WHATSAPP_RECORDATORIO_VENTANA_MIN=10
WHATSAPP_RECORDATORIO_INTERVALO_MIN=5
```

## Flujo de numeros

| Direccion | Origen |
|-----------|--------|
| **Remitente** | Numero de WhatsApp Business de **esa marca** (Phone Number ID + token guardados en su configuracion) |
| **Destinatario** | Telefono del **cliente** de la cita (10 digitos + codigo de pais de la marca) |

Marca A nunca envia desde el numero de Marca B.

## Verificar configuracion global

```bash
cd backend
npm run verificar:whatsapp
```

## Probar una marca

1. Guarda Phone Number ID y token en **Mi marca → WhatsApp Business**
2. Indica un telefono de prueba y pulsa **Probar WhatsApp**
3. O desde terminal:

```bash
cd backend
npm run probar:whatsapp-recordatorio -- --telefono=TU_NUMERO --slug=tu-marca
```

## Recordatorio 4 horas antes

Migracion:

```bash
cd backend && npm run migrar:whatsapp-recordatorio
```

Prueba manual del job:

```bash
cd backend && npm run recordatorios:whatsapp
```

## Mensajes fuera de ventana de 24 h

Para recordatorios automaticos, Meta exige **plantillas aprobadas** por marca. Configura el nombre en **Plantilla recordatorio** en la configuracion de esa marca.

## Produccion

- Token y Phone Number ID **por marca** en Admin → Mi marca
- Plantilla aprobada en Meta Business Manager de cada negocio
- Token de larga duracion o renovacion automatica
