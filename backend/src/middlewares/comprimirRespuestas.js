import { promisify } from 'util';
import { gzip } from 'zlib';

const comprimir = promisify(gzip);
const MINIMO_BYTES = 800;

/** Comprime JSON grande si el navegador acepta gzip. Los cuerpos chicos salen igual. */
export function comprimirRespuestas(req, res, next) {
  const enviarJson = res.json.bind(res);

  res.json = (cuerpo) => {
    const acepta = String(req.headers['accept-encoding'] ?? '');
    if (!acepta.includes('gzip')) return enviarJson(cuerpo);

    let texto;
    try {
      texto = JSON.stringify(cuerpo);
    } catch {
      return enviarJson(cuerpo);
    }

    if (texto.length < MINIMO_BYTES) return enviarJson(cuerpo);

    return comprimir(texto)
      .then((gz) => {
        if (res.headersSent) return undefined;
        res.setHeader('Content-Encoding', 'gzip');
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Vary', 'Accept-Encoding');
        return res.send(gz);
      })
      .catch(() => {
        if (!res.headersSent) return enviarJson(cuerpo);
        return undefined;
      });
  };

  next();
}
