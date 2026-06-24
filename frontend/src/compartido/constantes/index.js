import { conBarraFinal } from '../utilidades/rutasApp';

function resolverApiBaseUrl() {
  const configurada = import.meta.env.VITE_API_URL?.trim();
  if (configurada) return configurada.replace(/\/$/, '');
  if (import.meta.env.DEV) return '/api';
  return '/_/backend/api';
}

export const API_BASE_URL = resolverApiBaseUrl();

export const CLAVE_TOKEN_SESION = 'spa_unas_token';
export const CLAVE_TOKEN_MARCA = 'spa_unas_token_marca';
export const CLAVE_TOKEN_PLATAFORMA = 'spa_unas_token_plataforma';
export const CLAVE_IMPERSONACION = 'spa_unas_impersonando';
export const EVENTO_TOKEN_CAMBIADO = 'spa-unas:token-cambiado';

export const RUTAS_PUBLICAS = {
  inicioMarca: (slug) => conBarraFinal(`/m/${slug}`),
  citas: (slug) => conBarraFinal(`/m/${slug}/citas`),
  reservar: (slug) => conBarraFinal(`/m/${slug}/reservar`),
  galeria: (slug) => conBarraFinal(`/m/${slug}/galeria`),
  blog: (slug) => conBarraFinal(`/m/${slug}/blog`),
  blogPublicacion: (slug, slugPublicacion) => conBarraFinal(`/m/${slug}/blog/${slugPublicacion}`),
  confirmacion: (slug, codigo) => conBarraFinal(`/m/${slug}/confirmacion/${codigo}`),
  miCita: (slug) => conBarraFinal(`/m/${slug}/mi-cita`),
};

export const RUTAS_ADMIN = {
  login: conBarraFinal('/admin'),
  panel: conBarraFinal('/admin/panel'),
  agenda: conBarraFinal('/admin/agenda'),
  atencion: conBarraFinal('/admin/atencion'),
  reportes: conBarraFinal('/admin/reportes'),
  clientes: conBarraFinal('/admin/clientes'),
  servicios: conBarraFinal('/admin/servicios'),
  blog: conBarraFinal('/admin/blog'),
  galeria: conBarraFinal('/admin/galeria'),
  carruselInicio: conBarraFinal('/admin/carrusel-inicio'),
  configuracionMarca: conBarraFinal('/admin/configuracion-marca'),
  atencionCita: (citaId, fecha) => {
    const params = new URLSearchParams();
    if (fecha) params.set('fecha', fecha);
    if (citaId != null) params.set('cita', String(citaId));
    const query = params.toString();
    return query ? `${conBarraFinal('/admin/atencion')}?${query}` : conBarraFinal('/admin/atencion');
  },
};

export const RUTAS_PLATAFORMA = {
  login: conBarraFinal('/plataforma'),
  panel: conBarraFinal('/plataforma/panel'),
  marcas: conBarraFinal('/plataforma/marcas'),
  reportes: conBarraFinal('/plataforma/reportes'),
  editarMarca: (id) => conBarraFinal(`/plataforma/marcas/${id}`),
};

export const ESTADOS_CITA = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
};

export const CANCELADA_POR_ETIQUETAS = {
  admin: 'Admin',
  cliente: 'Cliente',
};

export const VARIABLES_MARCA_DEFECTO = {
  colorPrincipal: '#C2185B',
  colorSecundario: '#F8BBD0',
  colorFondo: '#FFFFFF',
  colorTexto: '#1A1A1A',
};
