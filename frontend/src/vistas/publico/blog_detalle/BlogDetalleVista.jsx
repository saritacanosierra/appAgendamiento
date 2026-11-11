import { Link, useParams } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, ImagenAmpliable, MensajeError } from '../../../compartido/componentes';
import { useImagenesEnContenedor } from '../../../compartido/hooks/useImagenesEnContenedor';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { listarPublicidadBlog, obtenerBlogPublico } from '../../../modulos/blog/servicios/blogServicio';
import EspacioPublicidad from '../../../componentes/publico/espacio_publicidad/EspacioPublicidad';
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
  const [anuncios, setAnuncios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const refContenido = useRef(null);

  useEffect(() => {
    if (!publicacion?.id) return undefined;
    let cancelado = false;
    listarPublicidadBlog(publicacion.id)
      .then((lista) => {
        if (!cancelado) setAnuncios(lista);
      })
      .catch(() => {
        if (!cancelado) setAnuncios([]);
      });
    return () => {
      cancelado = true;
    };
  }, [publicacion?.id]);

  useImagenesEnContenedor(refContenido, [publicacion?.contenido]);

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
      <EncabezadoMarca marca={marca} compacto />

      <p className="blog-detalle__volver">
        <Link to={RUTAS_PUBLICAS.blog(slug)}>← Volver al blog</Link>
      </p>

      {error && <MensajeError mensaje={error} />}
      {cargando && <Cargando />}

      {publicacion && (
        <article className="blog-detalle__articulo">
          {publicacion.imagenDestacada && (
            <ImagenAmpliable
              src={publicacion.imagenDestacada}
              alt={publicacion.titulo}
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
            ref={refContenido}
            className="blog-detalle__contenido"
            dangerouslySetInnerHTML={{ __html: publicacion.contenido }}
          />
          <EspacioPublicidad anuncios={anuncios} />
        </article>
      )}
    </div>
  );
}
