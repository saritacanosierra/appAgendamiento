import { Link } from 'react-router-dom';
import { formatearFecha } from '../../utilidades/temaMarca';
import '../../../estilos/compartido/tarjeta_publicacion/tarjeta_publicacion.css';

export default function TarjetaPublicacion({ publicacion, enlace }) {
  const contenido = (
    <article className="tarjeta-publicacion">
      {publicacion.imagenDestacada && (
        <img src={publicacion.imagenDestacada} alt="" loading="lazy" />
      )}
      <div className="tarjeta-publicacion__cuerpo">
        <h3>{publicacion.titulo}</h3>
        {publicacion.extracto && <p>{publicacion.extracto}</p>}
        {publicacion.fechaPublicacion && (
          <time dateTime={publicacion.fechaPublicacion}>
            {formatearFecha(publicacion.fechaPublicacion)}
          </time>
        )}
      </div>
    </article>
  );

  return enlace ? <Link to={enlace}>{contenido}</Link> : contenido;
}
