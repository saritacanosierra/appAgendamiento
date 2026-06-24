import { Router } from 'express';
import { estado } from '../controladores/estadoControlador.js';
import { obtenerPorSlug } from '../controladores/marcaControlador.js';
import { login, logout, me, rotarToken } from '../controladores/autenticacionControlador.js';
import {
  listarPublicos as listarServiciosPublicos,
  listarAdmin as listarServiciosAdmin,
  listarAdicionalesAdmin as listarServiciosAdicionalesAdmin,
  crearAdmin as crearServicioAdmin,
  actualizarAdmin as actualizarServicioAdmin,
  eliminarAdmin as eliminarServicioAdmin,
} from '../controladores/servicioControlador.js';
import {
  agregarFavoritoCliente,
  quitarFavoritoCliente,
} from '../controladores/clientePerfilControlador.js';
import {
  obtenerDisponibilidad,
  crearReserva,
  obtenerConfirmacion,
  consultarCitas,
  cancelarReservaPublica,
  solicitarReagendamiento,
} from '../controladores/reservaControlador.js';
import {
  listarCitas,
  obtenerAgenda,
  crearCitaAdmin,
  actualizarCitaAdmin,
  eliminarCitaAdmin,
  listarClientes,
  crearCliente,
  actualizarCliente,
  desactivarCliente,
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
  listarCatalogoPublicos as listarGaleriaCatalogoPublicos,
  listarCatalogoAdmin as listarGaleriaCatalogoAdmin,
  crearCatalogoAdmin as crearGaleriaCatalogoAdmin,
  actualizarCatalogoAdmin as actualizarGaleriaCatalogoAdmin,
  eliminarCatalogoAdmin as eliminarGaleriaCatalogoAdmin,
} from '../controladores/galeriaControlador.js';
import {
  iniciarSesionGaleria,
  listarSeleccionesGaleria,
  agregarSeleccionGaleria,
  quitarSeleccionGaleria,
} from '../controladores/galeriaSeleccionControlador.js';
import {
  listarPublicos as listarCarruselPublicos,
  listarAdmin as listarCarruselAdmin,
  crearAdmin as crearCarruselAdmin,
  actualizarAdmin as actualizarCarruselAdmin,
} from '../controladores/carruselControlador.js';
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
import {
  obtenerEstadoWhatsappMarca,
  probarWhatsappMarca,
} from '../controladores/whatsappControlador.js';
import { obtenerReporte } from '../controladores/reporteControlador.js';
import {
  listarCitasAtencion,
  cerrarServicioAtencion,
} from '../controladores/atencionControlador.js';
import {
  listarSolicitudesReagendamiento,
  aprobarSolicitudReagendamiento,
  rechazarSolicitudReagendamiento,
} from '../controladores/solicitudReagendamientoControlador.js';
import {
  listarMarcasPlataforma,
  obtenerMarcaPlataforma,
  obtenerResumenPlataforma,
  crearMarcaPlataforma,
  actualizarMarcaPlataforma,
  impersonarMarcaPlataforma,
  obtenerReportePlataforma,
  resetearContrasenaMarcaPlataforma,
  activarSuscripcionMarcaPlataforma,
  renovarSuscripcionMarcaPlataforma,
  listarHistorialSuscripcionMarcaPlataforma,
} from '../controladores/plataformaControlador.js';
import { autenticacionMiddleware } from '../middlewares/autenticacionMiddleware.js';
import { superadminMiddleware, soloMarcaAdminMiddleware, plataformaDisponibleMiddleware } from '../middlewares/plataformaMiddleware.js';
import { aislamientoMarcaMiddleware } from '../middlewares/aislamientoMarcaMiddleware.js';
import { subidaImagenMiddleware } from '../middlewares/subidaArchivos.js';
import { limitarLogin, limitarReservas, limitarConsultasReservas } from '../middlewares/limitarTasa.js';
import { parchearRouterAsync } from '../middlewares/manejoErrores.js';

const router = parchearRouterAsync(Router());

router.get('/estado', estado);

// Publicos
router.get('/marcas/slug/:slug', obtenerPorSlug);
router.get('/marcas/:marca_id/servicios', listarServiciosPublicos);
router.get('/marcas/:marca_id/disponibilidad', obtenerDisponibilidad);
router.get('/marcas/:marca_id/blog', listarBlogPublicos);
router.get('/marcas/:marca_id/blog/slug/:slug', obtenerBlogPublico);
router.get('/marcas/:marca_id/galeria', listarGaleriaPublicos);
router.get('/marcas/:marca_id/galeria/catalogo', listarGaleriaCatalogoPublicos);
router.post('/marcas/:marca_id/galeria/sesion', limitarConsultasReservas, iniciarSesionGaleria);
router.get('/marcas/:marca_id/galeria/selecciones', limitarConsultasReservas, listarSeleccionesGaleria);
router.post('/marcas/:marca_id/galeria/selecciones', limitarConsultasReservas, agregarSeleccionGaleria);
router.delete('/marcas/:marca_id/galeria/selecciones', limitarConsultasReservas, quitarSeleccionGaleria);
router.get('/marcas/:marca_id/carrusel-inicio', listarCarruselPublicos);
router.post('/reservas', limitarReservas, crearReserva);
router.post('/reservas/consultar', limitarConsultasReservas, consultarCitas);
router.post('/reservas/favoritos', limitarConsultasReservas, agregarFavoritoCliente);
router.delete('/reservas/favoritos', limitarConsultasReservas, quitarFavoritoCliente);
router.get('/reservas/confirmacion/:codigo', obtenerConfirmacion);
router.post('/reservas/:codigo/cancelar', limitarConsultasReservas, cancelarReservaPublica);
router.post('/reservas/:codigo/reagendar', limitarConsultasReservas, solicitarReagendamiento);

// OAuth callback (publico)
router.get('/integraciones/google/callback', callbackGoogle);

// Auth
router.post('/auth/login', limitarLogin, login);
router.post('/auth/logout', autenticacionMiddleware, logout);
router.post('/auth/rotar', autenticacionMiddleware, rotarToken);
router.get('/auth/me', autenticacionMiddleware, me);

// Admin protegido (solo admin de marca)
router.use('/admin', autenticacionMiddleware, soloMarcaAdminMiddleware, aislamientoMarcaMiddleware);

router.get('/admin/agenda', obtenerAgenda);
router.get('/admin/atencion/citas', listarCitasAtencion);
router.post('/admin/atencion/citas/:id/cerrar', cerrarServicioAtencion);
router.get('/admin/citas', listarCitas);
router.post('/admin/citas', crearCitaAdmin);
router.put('/admin/citas/:id', actualizarCitaAdmin);
router.delete('/admin/citas/:id', eliminarCitaAdmin);
router.get('/admin/solicitudes-reagendamiento', listarSolicitudesReagendamiento);
router.put('/admin/solicitudes-reagendamiento/:id/aprobar', aprobarSolicitudReagendamiento);
router.put('/admin/solicitudes-reagendamiento/:id/rechazar', rechazarSolicitudReagendamiento);
router.get('/admin/clientes', listarClientes);
router.post('/admin/clientes', crearCliente);
router.put('/admin/clientes/:id', actualizarCliente);
router.delete('/admin/clientes/:id', desactivarCliente);
router.get('/admin/servicios', listarServiciosAdmin);
router.get('/admin/servicios/adicionales', listarServiciosAdicionalesAdmin);
router.post('/admin/servicios', crearServicioAdmin);
router.put('/admin/servicios/:id', actualizarServicioAdmin);
router.delete('/admin/servicios/:id', eliminarServicioAdmin);
router.get('/admin/blog', listarBlogAdmin);
router.post('/admin/blog', crearBlogAdmin);
router.put('/admin/blog/:id', actualizarBlogAdmin);
router.get('/admin/galeria', listarGaleriaAdmin);
router.post('/admin/galeria', crearGaleriaAdmin);
router.put('/admin/galeria/:id', actualizarGaleriaAdmin);
router.get('/admin/galeria/catalogo', listarGaleriaCatalogoAdmin);
router.post('/admin/galeria/catalogo', crearGaleriaCatalogoAdmin);
router.put('/admin/galeria/catalogo/:id', actualizarGaleriaCatalogoAdmin);
router.delete('/admin/galeria/catalogo/:id', eliminarGaleriaCatalogoAdmin);
router.get('/admin/carrusel-inicio', listarCarruselAdmin);
router.post('/admin/carrusel-inicio', crearCarruselAdmin);
router.put('/admin/carrusel-inicio/:id', actualizarCarruselAdmin);
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
router.get('/admin/integraciones/whatsapp', obtenerEstadoWhatsappMarca);
router.post('/admin/integraciones/whatsapp/probar', probarWhatsappMarca);
router.post('/admin/subidas/galeria', subidaImagenMiddleware('galeria'), subirArchivo);
router.post('/admin/subidas/blog', subidaImagenMiddleware('blog'), subirArchivo);
router.post('/admin/subidas/logos', subidaImagenMiddleware('logos'), subirArchivo);
router.post('/admin/subidas/carrusel', subidaImagenMiddleware('carrusel'), subirArchivo);
router.post('/admin/subidas/servicios', subidaImagenMiddleware('servicios'), subirArchivo);

// Plataforma (superadmin) — deshabilitable en despliegues solo-marca
router.use('/plataforma', plataformaDisponibleMiddleware, autenticacionMiddleware, superadminMiddleware);
router.get('/plataforma/resumen', obtenerResumenPlataforma);
router.get('/plataforma/reportes', obtenerReportePlataforma);
router.get('/plataforma/marcas', listarMarcasPlataforma);
router.get('/plataforma/marcas/:id', obtenerMarcaPlataforma);
router.post('/plataforma/marcas', crearMarcaPlataforma);
router.put('/plataforma/marcas/:id', actualizarMarcaPlataforma);
router.post('/plataforma/marcas/:id/impersonar', impersonarMarcaPlataforma);
router.put('/plataforma/marcas/:id/reset-contrasena', resetearContrasenaMarcaPlataforma);
router.post('/plataforma/marcas/:id/suscripcion/activar', activarSuscripcionMarcaPlataforma);
router.post('/plataforma/marcas/:id/suscripcion/renovar', renovarSuscripcionMarcaPlataforma);
router.get('/plataforma/marcas/:id/suscripcion/historial', listarHistorialSuscripcionMarcaPlataforma);

export default router;
