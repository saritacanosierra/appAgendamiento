const CODIGO_PAIS_DEFECTO = '52';

export function normalizarTelefonoWhatsapp(telefono, codigoPais = CODIGO_PAIS_DEFECTO) {
  const digitos = String(telefono ?? '').replace(/\D+/g, '');
  if (!digitos) return null;

  const prefijo = String(codigoPais || CODIGO_PAIS_DEFECTO).replace(/\D+/g, '');
  if (prefijo && digitos.startsWith(prefijo)) {
    return digitos;
  }
  if (digitos.length === 10) {
    return `${prefijo}${digitos}`;
  }
  return digitos;
}

export function construirEnlaceWhatsapp(telefono, opciones = {}) {
  const destino = normalizarTelefonoWhatsapp(telefono, opciones.codigoPais);
  if (!destino) return null;

  const url = new URL(`https://wa.me/${destino}`);
  const mensaje = opciones.mensaje?.trim();
  if (mensaje) {
    url.searchParams.set('text', mensaje);
  }
  return url.toString();
}

export function mensajeContactoMarca({ nombreMarca }) {
  const nombre = nombreMarca?.trim() || 'su negocio';
  return `Hola, me gustaria obtener mas informacion sobre ${nombre}.`;
}

export function mensajeConfirmacionCita({ nombreMarca, servicio, fecha, hora, codigo }) {
  const nombre = nombreMarca?.trim() || 'su negocio';
  const partes = [
    `Hola, acabo de reservar una cita en ${nombre}.`,
    servicio ? `Servicio: ${servicio}.` : null,
    fecha && hora ? `Fecha: ${fecha} a las ${hora}.` : null,
    codigo ? `Codigo: ${codigo}.` : null,
  ].filter(Boolean);
  return partes.join(' ');
}

export function mensajeConsultaCita({ nombreMarca, servicio, fecha, hora, codigo }) {
  const nombre = nombreMarca?.trim() || 'su negocio';
  const partes = [
    `Hola, tengo una consulta sobre mi cita en ${nombre}.`,
    servicio ? `Servicio: ${servicio}.` : null,
    fecha && hora ? `Fecha: ${fecha} a las ${hora}.` : null,
    codigo ? `Codigo: ${codigo}.` : null,
  ].filter(Boolean);
  return partes.join(' ');
}
