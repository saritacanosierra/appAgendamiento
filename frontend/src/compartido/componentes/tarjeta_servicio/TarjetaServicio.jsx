import { formatearPrecio } from '../../utilidades/temaMarca';
import IconoApp from '../icono_app/IconoApp';
import '../../../estilos/compartido/tarjeta_servicio/tarjeta_servicio.css';

export default function TarjetaServicio({ servicio, onSeleccionar, acciones, className = '' }) {
  const tieneImagen = Boolean(servicio.imagenRuta);
  const clases = [
    'tarjeta-servicio',
    acciones ? 'tarjeta-servicio--admin' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={clases}>
      <div className={`tarjeta-servicio__thumb${tieneImagen ? ' tarjeta-servicio__thumb--imagen' : ''}`}>
        {tieneImagen ? (
          <img src={servicio.imagenRuta} alt="" loading="lazy" />
        ) : (
          <IconoApp nombre="servicios" tamano="lg" aria-hidden="true" />
        )}
      </div>
      <div className="tarjeta-servicio__contenido">
        <h3>{servicio.nombre}</h3>
        {servicio.descripcion && <p>{servicio.descripcion}</p>}
        <div className="tarjeta-servicio__meta">
          <span>{servicio.duracionMinutos} min</span>
          <strong>{formatearPrecio(servicio.precio)}</strong>
        </div>
      </div>
      {acciones && <div className="tarjeta-servicio__acciones-admin">{acciones}</div>}
      {onSeleccionar && (
        <button type="button" className="tarjeta-servicio__accion" onClick={() => onSeleccionar(servicio)}>
          Elegir
        </button>
      )}
    </article>
  );
}
