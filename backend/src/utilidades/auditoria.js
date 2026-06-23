import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { entorno } from '../configuracion/entorno.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const directorioLogs = path.resolve(__dirname, '../../logs');

function asegurarDirectorio() {
  if (!fs.existsSync(directorioLogs)) {
    fs.mkdirSync(directorioLogs, { recursive: true });
  }
}

function nombreArchivoHoy() {
  const hoy = new Date().toISOString().slice(0, 10);
  return path.join(directorioLogs, `auditoria-${hoy}.log`);
}

export function registrarAuditoria(evento, datos = {}) {
  if (!entorno.depuracion && process.env.AUDITORIA_HABILITADA !== '1') {
    return;
  }

  try {
    asegurarDirectorio();
    const entrada = {
      ts: new Date().toISOString(),
      evento,
      ...datos,
    };
    fs.appendFileSync(nombreArchivoHoy(), `${JSON.stringify(entrada)}\n`, 'utf8');
  } catch {
    // No interrumpir la peticion por fallo de log
  }
}

export function middlewareAuditoria(evento) {
  return (req, res, next) => {
    res.on('finish', () => {
      if (res.statusCode >= 400) return;

      registrarAuditoria(evento, {
        ip: req.ip,
        marcaId: req.marcaId ?? null,
        usuarioId: req.usuario?.id ?? null,
        metodo: req.method,
        ruta: req.originalUrl,
      });
    });
    next();
  };
}
