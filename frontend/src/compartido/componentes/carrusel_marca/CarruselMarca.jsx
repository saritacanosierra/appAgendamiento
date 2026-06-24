import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalBlogPublico from '../../../componentes/publico/modal_blog_publico/ModalBlogPublico';
import { listarCarruselPublico } from '../../../modulos/carrusel/servicios/carruselServicio';
import ImagenAmpliable from '../imagen_ampliable/ImagenAmpliable';
import IconoApp from '../icono_app/IconoApp';
import '../../../estilos/compartido/carrusel_marca/carrusel_marca.css';

const INTERVALO_MS = 5500;

function extraerSlugBlogDesdeEnlace(enlace, slugMarca) {
  if (!enlace || !slugMarca) return null;
  try {
    const path = enlace.startsWith('http') ? new URL(enlace).pathname : enlace;
    const slugEscapado = slugMarca.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const coincidencia = path.match(new RegExp(`/m/${slugEscapado}/blog/([^/?#]+)`));
    return coincidencia ? decodeURIComponent(coincidencia[1]) : null;
  } catch {
    return null;
  }
}

function mapearDiapositivasPropias(items, slugMarca) {
  return items.map((item) => {
    const enlaceExterno = Boolean(item.enlaceUrl?.startsWith('http'));
    const blogSlug = !enlaceExterno ? extraerSlugBlogDesdeEnlace(item.enlaceUrl, slugMarca) : null;

    return {
      id: `carrusel-${item.id}`,
      imagen: item.imagenRuta,
      titulo: item.titulo,
      subtitulo: item.subtitulo,
      enlace: blogSlug ? null : item.enlaceUrl || null,
      enlaceExterno,
      blogSlug,
      tipo: blogSlug ? 'blog' : 'custom',
    };
  });
}

function etiquetaSlide(tipo) {
  if (tipo === 'blog') return 'Blog';
  if (tipo === 'galeria') return 'Galería';
  if (tipo === 'custom') return 'Destacado';
  return 'Destacado';
}

export default function CarruselMarca({ marca, slug }) {
  const navigate = useNavigate();
  const [diapositivasPropias, setDiapositivasPropias] = useState([]);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [slugBlogAbierto, setSlugBlogAbierto] = useState(null);

  useEffect(() => {
    if (!marca?.id) return;

    let cancelado = false;

    listarCarruselPublico(marca.id)
      .then((propias) => {
        if (!cancelado) {
          setDiapositivasPropias(Array.isArray(propias) ? propias : []);
        }
      })
      .catch(() => {
        if (!cancelado) setDiapositivasPropias([]);
      });

    return () => {
      cancelado = true;
    };
  }, [marca?.id]);

  const slides = useMemo(
    () => mapearDiapositivasPropias(diapositivasPropias, slug),
    [diapositivasPropias, slug]
  );

  const irA = useCallback(
    (nuevo) => {
      setIndice((nuevo + slides.length) % slides.length);
    },
    [slides.length]
  );

  const manejarAccionSlide = useCallback(
    (slide) => {
      if (slide.blogSlug) {
        setSlugBlogAbierto(slide.blogSlug);
        return;
      }
      if (!slide.enlace) return;
      if (slide.enlaceExterno) {
        window.open(slide.enlace, '_blank', 'noopener,noreferrer');
      } else {
        navigate(slide.enlace);
      }
    },
    [navigate]
  );

  useEffect(() => {
    setIndice(0);
  }, [slides.length]);

  useEffect(() => {
    if (pausado || slides.length <= 1) return undefined;

    const timer = setInterval(() => {
      setIndice((prev) => (prev + 1) % slides.length);
    }, INTERVALO_MS);

    return () => clearInterval(timer);
  }, [pausado, slides.length]);

  if (!marca || slides.length === 0) return null;

  const slide = slides[indice];

  const contenidoSlide = (
    <article
      className={`carrusel-marca__slide carrusel-marca__slide--${slide.tipo}`}
      aria-hidden={false}
    >
      {slide.imagen ? (
        <ImagenAmpliable
          className="carrusel-marca__imagen"
          src={slide.imagen}
          alt={slide.titulo}
          loading="lazy"
        />
      ) : (
        <div className="carrusel-marca__placeholder" aria-hidden="true">
          <IconoApp nombre="carrusel" tamano="xl" />
        </div>
      )}
      <div className="carrusel-marca__overlay" />
      <div className="carrusel-marca__texto">
        <span className="carrusel-marca__etiqueta">{etiquetaSlide(slide.tipo)}</span>
        <h2>{slide.titulo}</h2>
        {slide.subtitulo && <p>{slide.subtitulo}</p>}
      </div>
    </article>
  );

  let slideEnvuelto = contenidoSlide;
  if (slide.blogSlug || slide.enlace) {
    slideEnvuelto = (
      <button
        type="button"
        className="carrusel-marca__enlace"
        onClick={() => manejarAccionSlide(slide)}
      >
        {contenidoSlide}
      </button>
    );
  }

  return (
    <>
      <section
        className="carrusel-marca"
        aria-roledescription="carrusel"
        aria-label="Contenido destacado de la marca"
        onMouseEnter={() => setPausado(true)}
        onMouseLeave={() => setPausado(false)}
        onFocus={() => setPausado(true)}
        onBlur={() => setPausado(false)}
      >
        <div className="carrusel-marca__viewport">{slideEnvuelto}</div>

        {slides.length > 1 && (
          <>
            <button
              type="button"
              className="carrusel-marca__flecha carrusel-marca__flecha--prev"
              onClick={() => irA(indice - 1)}
              aria-label="Anterior"
            >
              ‹
            </button>
            <button
              type="button"
              className="carrusel-marca__flecha carrusel-marca__flecha--sig"
              onClick={() => irA(indice + 1)}
              aria-label="Siguiente"
            >
              ›
            </button>
            <div className="carrusel-marca__puntos" role="tablist" aria-label="Diapositivas">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === indice}
                  aria-label={`Diapositiva ${i + 1}`}
                  className={`carrusel-marca__punto ${i === indice ? 'carrusel-marca__punto--activo' : ''}`}
                  onClick={() => irA(i)}
                />
              ))}
            </div>
          </>
        )}
      </section>

      <ModalBlogPublico
        abierto={Boolean(slugBlogAbierto)}
        marcaId={marca.id}
        slugPublicacion={slugBlogAbierto}
        onCerrar={() => setSlugBlogAbierto(null)}
      />
    </>
  );
}
