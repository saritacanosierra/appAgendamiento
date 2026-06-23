import { useEffect, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, ImagenAmpliable, MensajeError } from '../../../compartido/componentes';
import ModalBlogPublico from '../../../componentes/publico/modal_blog_publico/ModalBlogPublico';
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
  const { marca, cargando: cargandoMarca, error: errorMarca } = useMarca();
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [slugAbierto, setSlugAbierto] = useState(null);

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
        <p className="blog-lista__vacio">Aún no hay publicaciones.</p>
      )}

      <div className="blog-lista__grid">
        {publicaciones.map((pub) => (
          <button
            key={pub.id}
            type="button"
            className="blog-lista__tarjeta"
            onClick={() => setSlugAbierto(pub.slug)}
          >
            {pub.imagenDestacada && (
              <ImagenAmpliable src={pub.imagenDestacada} alt={pub.titulo} className="blog-lista__imagen" />
            )}
            <div className="blog-lista__cuerpo">
              {pub.categoria && <span className="blog-lista__categoria">{pub.categoria}</span>}
              <h2>{pub.titulo}</h2>
              {pub.extracto && <p>{pub.extracto}</p>}
              <time dateTime={pub.fechaPublicacion}>{formatearFecha(pub.fechaPublicacion)}</time>
            </div>
          </button>
        ))}
      </div>

      <ModalBlogPublico
        abierto={Boolean(slugAbierto)}
        marcaId={marca?.id}
        slugPublicacion={slugAbierto}
        onCerrar={() => setSlugAbierto(null)}
      />
    </div>
  );
}
