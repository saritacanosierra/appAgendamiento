/**
 * Panel interno de plataforma (superadmin). En producción para marcas debe ser false
 * para que el dueño de marca no vea rutas, enlaces ni referencias a /plataforma.
 */
export const PLATAFORMA_HABILITADA =
  import.meta.env.VITE_PLATAFORMA_HABILITADA === 'true' ||
  (import.meta.env.DEV && import.meta.env.VITE_PLATAFORMA_HABILITADA !== 'false');
