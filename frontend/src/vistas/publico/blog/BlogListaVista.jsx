import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, MensajeError } from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { listarBlogPublico } from '../../../modulos/blog/servicios/blogServicio';
import '../../../estilos/publico/blog/blog.css';

function formatearFecha(valor) {
  if (!valor) return '';
  return new Date(valor).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function BlogListaVista() {
  const { slug } = useParams();
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!marca?.id) return;

    setCargando(true);
    listarBlogPublico(marca.id)
      .then(setPublicaciones)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [marca?.id]);

  if (cargandoMarca) return <Cargando />;
  if (errorMarca) return <MensajeError mensaje={errorMarca} />;

  return (
    <div className="blog-lista">
      <EncabezadoMarca marca={marca} titulo="Blog" />

      {error && <MensajeError mensaje={error} />}
      {cargando && <Cargando />}

      {!cargando && publicaciones.length === 0 && (
        <p className="blog-lista__vacio">Aun no hay publicaciones.</p>
      )}

      <div className="blog-lista__grid">
        {publicaciones.map((pub) => (
          <article key={pub.id} className="blog-lista__tarjeta">
            {pub.imagenDestacada && (
              <img src={pub.imagenDestacada} alt="" className="blog-lista__imagen" />
            )}
            <div className="blog-lista__cuerpo">
              {pub.categoria && <span className="blog-lista__categoria">{pub.categoria}</span>}
              <h2>
                <Link to={RUTAS_PUBLICAS.blogPublicacion(slug, pub.slug)}>{pub.titulo}</Link>
              </h2>
              {pub.extracto && <p>{pub.extracto}</p>}
              <time>{formatearFecha(pub.fechaPublicacion)}</time>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
