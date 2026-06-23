import { useEffect, useRef, useState } from 'react';
import { useVisorImagen } from '../../../aplicacion/proveedores/ProveedorVisorImagen';
import { Cargando, ImagenAmpliable, MensajeError } from '../../../compartido/componentes';
import { useImagenesEnContenedor } from '../../../compartido/hooks/useImagenesEnContenedor';
import { obtenerBlogPublico } from '../../../modulos/blog/servicios/blogServicio';
import '../../../estilos/publico/blog/modal_blog_publico.css';

function formatearFecha(valor) {
  if (!valor) return '';
  return new Date(valor).toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function ModalBlogPublico({ abierto, marcaId, slugPublicacion, onCerrar }) {
  const { imagenAbierta } = useVisorImagen();
  const refContenido = useRef(null);
  const [publicacion, setPublicacion] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!abierto || !marcaId || !slugPublicacion) {
      setPublicacion(null);
      setError(null);
      return undefined;
    }

    let cancelado = false;
    setCargando(true);
    setError(null);

    obtenerBlogPublico(marcaId, slugPublicacion)
      .then((datos) => {
        if (!cancelado) setPublicacion(datos);
      })
      .catch((err) => {
        if (!cancelado) {
          setError(err.message);
          setPublicacion(null);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [abierto, marcaId, slugPublicacion]);

  useImagenesEnContenedor(refContenido, [publicacion?.contenido]);

  useEffect(() => {
    if (!abierto) return undefined;

    function manejarTecla(e) {
      if (e.key === 'Escape' && !imagenAbierta) onCerrar();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', manejarTecla);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', manejarTecla);
    };
  }, [abierto, onCerrar, imagenAbierta]);

  if (!abierto) return null;

  return (
    <div
      className="modal-blog-publico"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-blog-titulo"
    >
      <button type="button" className="modal-blog-publico__fondo" onClick={onCerrar} aria-label="Cerrar" />
      <div className="modal-blog-publico__panel">
        <header className="modal-blog-publico__cabecera">
          <h2 id="modal-blog-titulo" className="modal-blog-publico__titulo-placeholder">
            {publicacion?.titulo ?? 'Publicación'}
          </h2>
          <button type="button" className="modal-blog-publico__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </header>

        <div className="modal-blog-publico__cuerpo">
          {cargando && <Cargando mensaje="Cargando publicación…" />}
          {error && <MensajeError mensaje={error} />}
          {!cargando && !error && publicacion && (
            <article className="modal-blog-publico__articulo">
              {publicacion.imagenDestacada && (
                <ImagenAmpliable
                  src={publicacion.imagenDestacada}
                  alt={publicacion.titulo}
                  className="modal-blog-publico__imagen"
                />
              )}
              {publicacion.categoria && (
                <span className="modal-blog-publico__categoria">{publicacion.categoria}</span>
              )}
              <h3 className="modal-blog-publico__titulo">{publicacion.titulo}</h3>
              <time className="modal-blog-publico__fecha">
                {formatearFecha(publicacion.fechaPublicacion)}
              </time>
              {publicacion.extracto && (
                <p className="modal-blog-publico__extracto">{publicacion.extracto}</p>
              )}
              {publicacion.contenido && (
                <div
                  ref={refContenido}
                  className="modal-blog-publico__contenido"
                  dangerouslySetInnerHTML={{ __html: publicacion.contenido }}
                />
              )}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
