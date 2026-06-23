import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, MensajeError } from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerBlogPublico } from '../../../modulos/blog/servicios/blogServicio';
import '../../../estilos/publico/blog_detalle/blog_detalle.css';

function formatearFecha(valor) {
  if (!valor) return '';
  return new Date(valor).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogDetalleVista() {
  const { slugPublicacion } = useParams();
  const { slug } = useParams();
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!marca?.id || !slugPublicacion) return;

    setCargando(true);
    obtenerBlogPublico(marca.id, slugPublicacion)
      .then(setPublicacion)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [marca?.id, slugPublicacion]);

  if (cargandoMarca) return <Cargando />;
  if (errorMarca) return <MensajeError mensaje={errorMarca} />;

  return (
    <div className="blog-detalle">
      <EncabezadoMarca marca={marca} />

      <p className="blog-detalle__volver">
        <Link to={RUTAS_PUBLICAS.blog(slug)}>← Volver al blog</Link>
      </p>

      {error && <MensajeError mensaje={error} />}
      {cargando && <Cargando />}

      {publicacion && (
        <article className="blog-detalle__articulo">
          {publicacion.imagenDestacada && (
            <img
              src={publicacion.imagenDestacada}
              alt=""
              className="blog-detalle__imagen"
            />
          )}
          {publicacion.categoria && (
            <span className="blog-detalle__categoria">{publicacion.categoria}</span>
          )}
          <h1>{publicacion.titulo}</h1>
          <time className="blog-detalle__fecha">
            {formatearFecha(publicacion.fechaPublicacion)}
          </time>
          {publicacion.extracto && (
            <p className="blog-detalle__extracto">{publicacion.extracto}</p>
          )}
          <div
            className="blog-detalle__contenido"
            dangerouslySetInnerHTML={{ __html: publicacion.contenido }}
          />
        </article>
      )}
    </div>
  );
}
