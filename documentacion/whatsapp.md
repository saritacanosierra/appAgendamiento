# WhatsApp Business — confirmacion de reservas

Integracion con la **WhatsApp Cloud API** de Meta para enviar confirmacion al cliente cuando reserva en linea.

## Requisitos

1. Cuenta en [Meta for Developers](https://developers.facebook.com/)
2. App con producto **WhatsApp**
3. Numero de prueba o numero verificado de negocio
4. Token de acceso permanente o temporal
5. **Phone Number ID** (no confundir con el numero visible)

## Variables en `backend/.env`

```env
WHATSAPP_HABILITADO=1
WHATSAPP_TOKEN=tu_token_de_acceso
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_CODIGO_PAIS=52
WHATSAPP_API_VERSION=v21.0
```

| Variable | Descripcion |
|----------|-------------|
| `WHATSAPP_HABILITADO` | `1` activa envios reales; cualquier otro valor simula en consola |
| `WHATSAPP_TOKEN` | Bearer token de la app Meta |
| `WHATSAPP_PHONE_NUMBER_ID` | ID del numero en WhatsApp Manager |
| `WHATSAPP_CODIGO_PAIS` | Prefijo internacional sin `+` (Mexico: `52`) |
| `WHATSAPP_API_VERSION` | Version Graph API (default `v21.0`) |

## Verificar configuracion

```bash
cd backend
npm run verificar:whatsapp
```

## Comportamiento

- Tras crear una reserva publica, si el cliente dejo telefono, se envia mensaje de texto con fecha, servicio y codigo.
- Si WhatsApp no esta configurado, la reserva **no falla**; en desarrollo se registra en consola.
- Los telefonos de 10 digitos se prefijan con `WHATSAPP_CODIGO_PAIS`.

## Mensajes fuera de ventana de 24 h

Para mensajes proactivos fuera de la ventana de conversacion, Meta exige **plantillas aprobadas**. Este modulo usa mensajes de texto tras la reserva (el cliente inicio el flujo). Para recordatorios automaticos posteriores, configura plantillas en Meta Business Manager.

## Produccion

- Usa token de larga duracion o renovacion automatica
- Registra el numero de negocio y verifica la empresa
- Revisa limites de la API en la documentacion oficial de Meta
