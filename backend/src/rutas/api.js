import { Router } from 'express';
import { estado } from '../controladores/estadoControlador.js';
import { obtenerPorSlug } from '../controladores/marcaControlador.js';
import { login, logout, me, rotarToken } from '../controladores/autenticacionControlador.js';
import {
  listarPublicos as listarServiciosPublicos,
  listarAdmin as listarServiciosAdmin,
  crearAdmin as crearServicioAdmin,
  actualizarAdmin as actualizarServicioAdmin,
} from '../controladores/servicioControlador.js';
import {
  obtenerDisponibilidad,
  crearReserva,
  obtenerConfirmacion,
} from '../controladores/reservaControlador.js';
import {
  listarCitas,
  obtenerAgenda,
  crearCitaAdmin,
  actualizarCitaAdmin,
  eliminarCitaAdmin,
  listarClientes,
  crearCliente,
} from '../controladores/adminCitaControlador.js';
import {
  listarPublicos as listarBlogPublicos,
  obtenerPublicoPorSlug as obtenerBlogPublico,
  listarAdmin as listarBlogAdmin,
  crearAdmin as crearBlogAdmin,
  actualizarAdmin as actualizarBlogAdmin,
} from '../controladores/blogControlador.js';
import {
  listarPublicos as listarGaleriaPublicos,
  listarAdmin as listarGaleriaAdmin,
  crearAdmin as crearGaleriaAdmin,
  actualizarAdmin as actualizarGaleriaAdmin,
} from '../controladores/galeriaControlador.js';
import {
  obtenerAdmin as obtenerConfiguracionAdmin,
  actualizarAdmin as actualizarConfiguracionAdmin,
  subirArchivo,
} from '../controladores/configuracionControlador.js';
import {
  obtenerResumen,
  listarNotificaciones,
  marcarLeida,
  marcarTodasLeidas,
} from '../controladores/notificacionControlador.js';
import {
  obtenerEstadoGoogle,
  iniciarAutorizacionGoogle,
  desconectarGoogle,
  probarGoogle,
  callbackGoogle,
} from '../controladores/googleCalendarControlador.js';
import { obtenerReporte } from '../controladores/reporteControlador.js';
import {
  listarMarcasPlataforma,
  obtenerMarcaPlataforma,
  obtenerResumenPlataforma,
  crearMarcaPlataforma,
  actualizarMarcaPlataforma,
  impersonarMarcaPlataforma,
  obtenerReportePlataforma,
  resetearContrasenaMarcaPlataforma,
} from '../controladores/plataformaControlador.js';
import { autenticacionMiddleware } from '../middlewares/autenticacionMiddleware.js';
import { superadminMiddleware, soloMarcaAdminMiddleware } from '../middlewares/plataformaMiddleware.js';
import { subidaImagenMiddleware } from '../middlewares/subidaArchivos.js';
import { limitarLogin, limitarReservas } from '../middlewares/limitarTasa.js';

const router = Router();

router.get('/estado', estado);

// Publicos
router.get('/marcas/slug/:slug', obtenerPorSlug);
router.get('/marcas/:marca_id/servicios', listarServiciosPublicos);
router.get('/marcas/:marca_id/disponibilidad', obtenerDisponibilidad);
router.get('/marcas/:marca_id/blog', listarBlogPublicos);
router.get('/marcas/:marca_id/blog/slug/:slug', obtenerBlogPublico);
router.get('/marcas/:marca_id/galeria', listarGaleriaPublicos);
router.post('/reservas', limitarReservas, crearReserva);
router.get('/reservas/confirmacion/:codigo', obtenerConfirmacion);

// OAuth callback (publico)
router.get('/integraciones/google/callback', callbackGoogle);

// Auth
router.post('/auth/login', limitarLogin, login);
router.post('/auth/logout', autenticacionMiddleware, logout);
router.post('/auth/rotar', autenticacionMiddleware, rotarToken);
router.get('/auth/me', autenticacionMiddleware, me);

// Admin protegido (solo admin de marca)
router.use('/admin', autenticacionMiddleware, soloMarcaAdminMiddleware);

router.get('/admin/agenda', obtenerAgenda);
router.get('/admin/citas', listarCitas);
router.post('/admin/citas', crearCitaAdmin);
router.put('/admin/citas/:id', actualizarCitaAdmin);
router.delete('/admin/citas/:id', eliminarCitaAdmin);
router.get('/admin/clientes', listarClientes);
router.post('/admin/clientes', crearCliente);
router.get('/admin/servicios', listarServiciosAdmin);
router.post('/admin/servicios', crearServicioAdmin);
router.put('/admin/servicios/:id', actualizarServicioAdmin);
router.get('/admin/blog', listarBlogAdmin);
router.post('/admin/blog', crearBlogAdmin);
router.put('/admin/blog/:id', actualizarBlogAdmin);
router.get('/admin/galeria', listarGaleriaAdmin);
router.post('/admin/galeria', crearGaleriaAdmin);
router.put('/admin/galeria/:id', actualizarGaleriaAdmin);
router.get('/admin/configuracion-marca', obtenerConfiguracionAdmin);
router.put('/admin/configuracion-marca', actualizarConfiguracionAdmin);
router.get('/admin/notificaciones/resumen', obtenerResumen);
router.put('/admin/notificaciones/marcar-todas-leidas', marcarTodasLeidas);
router.put('/admin/notificaciones/:id/leida', marcarLeida);
router.get('/admin/notificaciones', listarNotificaciones);
router.get('/admin/reportes', obtenerReporte);
router.get('/admin/integraciones/google', obtenerEstadoGoogle);
router.post('/admin/integraciones/google/autorizar', iniciarAutorizacionGoogle);
router.post('/admin/integraciones/google/probar', probarGoogle);
router.delete('/admin/integraciones/google', desconectarGoogle);
router.post('/admin/subidas/galeria', subidaImagenMiddleware('galeria'), subirArchivo);
router.post('/admin/subidas/blog', subidaImagenMiddleware('blog'), subirArchivo);
router.post('/admin/subidas/logos', subidaImagenMiddleware('logos'), subirArchivo);

// Plataforma (superadmin)
router.use('/plataforma', autenticacionMiddleware, superadminMiddleware);
router.get('/plataforma/resumen', obtenerResumenPlataforma);
router.get('/plataforma/reportes', obtenerReportePlataforma);
router.get('/plataforma/marcas', listarMarcasPlataforma);
router.get('/plataforma/marcas/:id', obtenerMarcaPlataforma);
router.post('/plataforma/marcas', crearMarcaPlataforma);
router.put('/plataforma/marcas/:id', actualizarMarcaPlataforma);
router.post('/plataforma/marcas/:id/impersonar', impersonarMarcaPlataforma);
router.put('/plataforma/marcas/:id/reset-contrasena', resetearContrasenaMarcaPlataforma);

export default router;
