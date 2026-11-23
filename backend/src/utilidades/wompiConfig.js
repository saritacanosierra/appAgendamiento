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

  const publicaProd = publica.startsWith('pub_prod_');
  const publicaTest = publica.startsWith('pub_test_');
  const integridadProd = integridad.startsWith('prod_integrity_');
  const integridadTest = integridad.startsWith('test_integrity_');
  if ((publicaProd && integridadTest) || (publicaTest && integridadProd)) {
    return {
      error: 'La llave pública y el secreto de integridad deben ser del mismo ambiente (prod o test).',
      codigoHttp: 422,
    };
  }
  if ((publicaProd || publicaTest) && !integridadProd && !integridadTest) {
    return {
      error: 'El secreto de integridad debe empezar por prod_integrity_ o test_integrity_.',
      codigoHttp: 422,
    };
  }

  return {
    llavePublica: publica,
    secretoIntegridad: integridad,
  };
}

/** Solo acepta retorno al panel admin por http(s). */
export function redirectPagoWompi(candidato, fallback) {
  const texto = textoWompi(candidato);
  if (!texto) return fallback;
  try {
    const url = new URL(texto);
    if (!['http:', 'https:'].includes(url.protocol)) return fallback;
    if (!url.pathname.startsWith('/admin')) return fallback;
    const ruta = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    return `${url.origin}${ruta}${url.search}`;
  } catch {
    return fallback;
  }
}

export function resolverSecretoEventos(nuevo, actual) {
  return textoWompi(nuevo) || textoWompi(actual) || '';
}
