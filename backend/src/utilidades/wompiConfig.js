export const CLAVES_WOMPI = {
  llavePublica: 'wompi_llave_publica',
  secretoIntegridad: 'wompi_secreto_integridad',
  secretoEventos: 'wompi_secreto_eventos',
};

export function textoWompi(valor) {
  return String(valor ?? '').trim();
}

export function urlEventosWompi(entorno = process.env) {
  const base = textoWompi(entorno.PUBLIC_URL_BASE || entorno.RENDER_EXTERNAL_URL).replace(/\/$/, '');
  if (!base) return '/api/webhooks/wompi';
  return `${base}/api/webhooks/wompi`;
}

export function validarLlavesWompi({ llavePublica, secretoIntegridadNuevo, secretoIntegridadActual }) {
  const publica = textoWompi(llavePublica);
  if (!publica) {
    return { error: 'Falta la llave pública del comercio.', codigoHttp: 422 };
  }
  if (!publica.startsWith('pub_')) {
    return { error: 'La llave pública debe empezar por pub_.', codigoHttp: 422 };
  }
  const integridad = textoWompi(secretoIntegridadNuevo) || textoWompi(secretoIntegridadActual);
  if (!integridad) {
    return { error: 'Falta el secreto de integridad.', codigoHttp: 422 };
  }
  return {
    llavePublica: publica,
    secretoIntegridad: integridad,
  };
}

export function resolverSecretoEventos(nuevo, actual) {
  return textoWompi(nuevo) || textoWompi(actual) || '';
}
