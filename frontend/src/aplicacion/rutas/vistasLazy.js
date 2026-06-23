import { lazy } from 'react';

export const InicioMarcaVista = lazy(
  () => import('../../vistas/publico/home/InicioMarcaVista')
);
export const ReservarVista = lazy(
  () => import('../../vistas/publico/reservar/ReservarVista')
);
export const GaleriaPublicaVista = lazy(
  () => import('../../vistas/publico/galeria/GaleriaPublicaVista')
);
export const BlogListaVista = lazy(
  () => import('../../vistas/publico/blog/BlogListaVista')
);
export const BlogDetalleVista = lazy(
  () => import('../../vistas/publico/blog_detalle/BlogDetalleVista')
);
export const ConfirmacionReservaVista = lazy(
  () => import('../../vistas/publico/confirmacion/ConfirmacionReservaVista')
);
export const ConsultarCitaVista = lazy(
  () => import('../../vistas/publico/mi_cita/ConsultarCitaVista')
);
export const CitasMarcaVista = lazy(
  () => import('../../vistas/publico/citas/CitasMarcaVista')
);

export const LoginVista = lazy(
  () => import('../../vistas/admin/login/LoginVista')
);
export const PanelVista = lazy(
  () => import('../../vistas/admin/panel/PanelVista')
);
export const AgendaVista = lazy(
  () => import('../../vistas/admin/agenda/AgendaVista')
);
export const ClientesVista = lazy(
  () => import('../../vistas/admin/clientes/ClientesVista')
);
export const ServiciosAdminVista = lazy(
  () => import('../../vistas/admin/servicios/ServiciosAdminVista')
);
export const BlogAdminVista = lazy(
  () => import('../../vistas/admin/blog/BlogAdminVista')
);
export const GaleriaAdminVista = lazy(
  () => import('../../vistas/admin/galeria/GaleriaAdminVista')
);
export const ConfiguracionMarcaVista = lazy(
  () => import('../../vistas/admin/configuracion/ConfiguracionMarcaVista')
);
export const CarruselAdminVista = lazy(
  () => import('../../vistas/admin/carrusel/CarruselAdminVista')
);
export const ReportesVista = lazy(
  () => import('../../vistas/admin/reportes/ReportesVista')
);
export const AtencionVista = lazy(
  () => import('../../vistas/admin/atencion/AtencionVista')
);
export const InicioVista = lazy(
  () => import('../../vistas/plataforma/inicio/InicioVista')
);
export const MarcasPlataformaVista = lazy(
  () => import('../../vistas/plataforma/marcas/MarcasPlataformaVista')
);
export const EditarMarcaPlataformaVista = lazy(
  () => import('../../vistas/plataforma/marcas/EditarMarcaPlataformaVista')
);
export const PanelPlataformaVista = lazy(
  () => import('../../vistas/plataforma/panel/PanelPlataformaVista')
);
export const ReportesPlataformaVista = lazy(
  () => import('../../vistas/plataforma/reportes/ReportesPlataformaVista')
);
