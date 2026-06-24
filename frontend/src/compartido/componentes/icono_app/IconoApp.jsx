import '../../../estilos/compartido/icono_app/icono_app.css';

const propsSvg = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.75,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
};

const ICONOS = {
  inicio: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" />
    </svg>
  ),
  agenda: (p) => (
    <svg {...propsSvg} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  ),
  citas: (p) => (
    <svg {...propsSvg} {...p}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <path d="M8 14h8M12 14v4" />
    </svg>
  ),
  atencion: (p) => (
    <svg {...propsSvg} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  ),
  clientes: (p) => (
    <svg {...propsSvg} {...p}>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2 20c0-3.5 3.1-6 7-6s7 2.5 7 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M15 20c.3-2.2 2.2-3.5 4.5-3.5" />
    </svg>
  ),
  servicios: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M12 3l1.8 4.5L18 9l-4.2 1.5L12 15l-1.8-4.5L6 9l4.2-1.5L12 3z" />
      <path d="M5 19h14" />
    </svg>
  ),
  reportes: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </svg>
  ),
  carrusel: (p) => (
    <svg {...propsSvg} {...p}>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <circle cx="8" cy="10" r="2" />
      <path d="m2 16 6-5 4 3 5-6 5 8" />
    </svg>
  ),
  galeria: (p) => (
    <svg {...propsSvg} {...p}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  ),
  blog: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
      <path d="M14 3v6h6M8 13h8M8 17h5" />
    </svg>
  ),
  config: (p) => (
    <svg {...propsSvg} {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  ),
  buscar: (p) => (
    <svg {...propsSvg} {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  ),
  confirmada: (p) => (
    <svg {...propsSvg} {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12l2.5 2.5L16 9" />
    </svg>
  ),
  marca: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M12 2l1.4 4.2L18 7.6l-4.2 1.4L12 13l-1.4-4L6.4 7.6l4.2-1.4L12 2z" />
      <path d="M5 19h14" />
    </svg>
  ),
  campana: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M18 16V11a6 6 0 1 0-12 0v5l-2 2v1h16v-1l-2-2z" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  ),
  panel: (p) => (
    <svg {...propsSvg} {...p}>
      <rect x="3" y="3" width="8" height="8" rx="1.5" />
      <rect x="13" y="3" width="8" height="8" rx="1.5" />
      <rect x="3" y="13" width="8" height="8" rx="1.5" />
      <rect x="13" y="13" width="8" height="8" rx="1.5" />
    </svg>
  ),
  marcas: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M4 20V8l8-4 8 4v12" />
      <path d="M4 20h16M9 20v-6h6v6" />
    </svg>
  ),
  flecha: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  ),
  externo: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M14 3h7v7M10 14 21 3M21 14v7H3V3h7" />
    </svg>
  ),
  menu: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  ),
  cerrar: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
  corazon: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ),
  puntos: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M20.6 7.4 17 4l-3.6 3.4a4 4 0 0 0-5.6 0L4.4 11.4a4 4 0 0 0 0 5.6L8 20.4l3.6-3.4a4 4 0 0 0 5.6 0l3.4 3.2a4 4 0 0 0 0-5.6z" />
      <path d="M9.5 9.5h.01M14.5 14.5h.01" />
    </svg>
  ),
  editar: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  eliminar: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M4 7h16" />
      <path d="M10 11v6M14 11v6" />
      <path d="M6 7l1 12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-12" />
      <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    </svg>
  ),
  whatsapp: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z" />
      <path d="M8.5 10.5c.3.8 1.2 2.3 2.8 3.1 1.1.6 1.8.7 2.4.7" />
    </svg>
  ),
  telefono: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.3 1.8.5 2.7a2 2 0 0 1-.5 2.1L8.1 9.6a16 16 0 0 0 6 6l1.1-1.1a2 2 0 0 1 2.1-.5c.9.2 1.8.4 2.7.5A2 2 0 0 1 22 16.9z" />
    </svg>
  ),
  ubicacion: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M12 21s7-4.4 7-11a7 7 0 1 0-14 0c0 6.6 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  ),
  ojo: (p) => (
    <svg {...propsSvg} {...p}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

export default function IconoApp({ nombre, className = '', tamano = 'md' }) {
  const Componente = ICONOS[nombre];
  if (!Componente) return null;
  return (
    <span className={`icono-app icono-app--${tamano} ${className}`.trim()}>
      {Componente({})}
    </span>
  );
}

export { ICONOS };
