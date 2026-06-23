/** Respuestas JSON uniformes para toda la API. */
export function respuestaExito(res, datos = null, mensaje = 'Operacion exitosa', codigoHttp = 200) {
  return res.status(codigoHttp).json({
    exito: true,
    mensaje,
    datos,
  });
}

export function respuestaError(res, mensaje, codigoHttp = 400, errores = null) {
  return res.status(codigoHttp).json({
    exito: false,
    mensaje,
    errores,
  });
}
