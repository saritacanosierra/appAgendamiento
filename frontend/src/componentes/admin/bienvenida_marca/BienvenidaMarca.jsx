import { Link } from 'react-router-dom';
import { BotonPrincipal } from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import '../../../estilos/componentes/bienvenida_marca/bienvenida_marca.css';

const PASOS = [
  {
    numero: '1',
    titulo: 'Tu estilo',
    detalle: 'Nombre, colores, logo y WhatsApp.',
    to: RUTAS_ADMIN.configuracionMarca,
    icono: 'config',
  },
  {
    numero: '2',
    titulo: 'Tus servicios',
    detalle: 'Qué ofreces, cuánto dura y el precio.',
    to: RUTAS_ADMIN.servicios,
    icono: 'servicios',
  },
  {
    numero: '3',
    titulo: 'Tu portada',
    detalle: 'Una foto para el inicio de tu app.',
    to: RUTAS_ADMIN.carruselInicio,
    icono: 'carrusel',
  },
];

export default function BienvenidaMarca({ marca, onVerPanel }) {
  const slug = marca?.slug;
  const nombre = marca?.nombreComercial ?? 'Tu marca';

  return (
    <div className="bienvenida-marca">
      <section className="bienvenida-marca__portada">
        <p className="bienvenida-marca__etiqueta">Lista para personalizar</p>
        <h1>{nombre}</h1>
        <p className="bienvenida-marca__texto">
          Esta es tu app, todavía en blanco. Tres pasos y queda con tu estilo. Tus clientas reservan desde el celular.
        </p>
      </section>

      <section className="bienvenida-marca__preview" aria-label="Así se ve hoy">
        <div className="bienvenida-marca__preview-marco">
          <span>Así la ve tu clienta</span>
          <strong>{nombre}</strong>
          <p>Elige día, servicio y hora.</p>
        </div>
        {slug && (
          <a
            className="bienvenida-marca__preview-enlace"
            href={RUTAS_PUBLICAS.inicioMarca(slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir la vista de clientas
            <IconoApp nombre="externo" />
          </a>
        )}
      </section>

      <ol className="bienvenida-marca__pasos">
        {PASOS.map((paso) => (
          <li key={paso.numero}>
            <Link to={paso.to} className="bienvenida-marca__paso">
              <span className="bienvenida-marca__paso-numero">{paso.numero}</span>
              <span className="bienvenida-marca__paso-icono">
                <IconoApp nombre={paso.icono} />
              </span>
              <span className="bienvenida-marca__paso-texto">
                <strong>{paso.titulo}</strong>
                <span>{paso.detalle}</span>
              </span>
              <IconoApp nombre="flecha" className="bienvenida-marca__paso-flecha" />
            </Link>
          </li>
        ))}
      </ol>

      <BotonPrincipal to={RUTAS_ADMIN.configuracionMarca} anchoCompleto>
        Empezar por el estilo
      </BotonPrincipal>
      <button type="button" className="bienvenida-marca__secundario" onClick={onVerPanel}>
        Ver el panel del día
      </button>
    </div>
  );
}
