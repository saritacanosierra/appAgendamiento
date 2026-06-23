import { formatearPrecio } from '../../utilidades/temaMarca';
import '../../../estilos/compartido/tarjeta_servicio/tarjeta_servicio.css';

export default function TarjetaServicio({ servicio, onSeleccionar }) {
  return (
    <article className="tarjeta-servicio">
      <div className="tarjeta-servicio__thumb" aria-hidden="true">💅</div>
      <div className="tarjeta-servicio__contenido">
        <h3>{servicio.nombre}</h3>
        {servicio.descripcion && <p>{servicio.descripcion}</p>}
        <div className="tarjeta-servicio__meta">
          <span>{servicio.duracionMinutos} min</span>
          <strong>{formatearPrecio(servicio.precio)}</strong>
        </div>
      </div>
      {onSeleccionar && (
        <button type="button" className="tarjeta-servicio__accion" onClick={() => onSeleccionar(servicio)}>
          Elegir
        </button>
      )}
    </article>
  );
}
