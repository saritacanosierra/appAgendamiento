export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const CLAVE_TOKEN_SESION = 'spa_unas_token';

export const RUTAS_PUBLICAS = {
  inicioMarca: (slug) => `/m/${slug}`,
  reservar: (slug) => `/m/${slug}/reservar`,
  galeria: (slug) => `/m/${slug}/galeria`,
  blog: (slug) => `/m/${slug}/blog`,
  blogPublicacion: (slug, slugPublicacion) => `/m/${slug}/blog/${slugPublicacion}`,
  confirmacion: (slug, codigo) => `/m/${slug}/confirmacion/${codigo}`,
};

export const RUTAS_ADMIN = {
  login: '/admin/login',
  panel: '/admin/panel',
  agenda: '/admin/agenda',
  reportes: '/admin/reportes',
  clientes: '/admin/clientes',
  servicios: '/admin/servicios',
  blog: '/admin/blog',
  galeria: '/admin/galeria',
  configuracionMarca: '/admin/configuracion-marca',
};

export const ESTADOS_CITA = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  completada: 'Completada',
};

export const VARIABLES_MARCA_DEFECTO = {
  colorPrincipal: '#C2185B',
  colorSecundario: '#F8BBD0',
  colorFondo: '#FFFFFF',
  colorTexto: '#1A1A1A',
};
