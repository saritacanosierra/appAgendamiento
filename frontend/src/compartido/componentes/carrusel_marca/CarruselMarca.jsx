import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalBlogPublico from '../../../componentes/publico/modal_blog_publico/ModalBlogPublico';
import { listarCarruselPublico } from '../../../modulos/carrusel/servicios/carruselServicio';
import { listarBlogPublico } from '../../../modulos/blog/servicios/blogServicio';
import { listarGaleriaPublica } from '../../../modulos/galeria/servicios/galeriaServicio';
import { RUTAS_PUBLICAS } from '../../constantes';
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

function construirSlidesAutomaticos(marca, slug, blog, galeria) {
  const slides = [];

  slides.push({
    id: 'marca',
    imagen: marca.logo || null,
    titulo: marca.nombreComercial,
    subtitulo: marca.descripcion || 'Tu espacio de belleza y cuidado personal',
    enlace: null,
    enlaceExterno: false,
    blogSlug: null,
    tipo: 'marca',
  });

  for (const pub of blog.slice(0, 3)) {
    slides.push({
      id: `blog-${pub.id}`,
      imagen: pub.imagenDestacada || null,
      titulo: pub.titulo,
      subtitulo: pub.extracto || 'Novedades de la marca',
      enlace: null,
      enlaceExterno: false,
      blogSlug: pub.slug,
      tipo: 'blog',
    });
  }

  for (const item of galeria.slice(0, 4)) {
    slides.push({
      id: `galeria-${item.id}`,
      imagen: item.imagenRuta,
      titulo: item.titulo || 'Inspiración',
      subtitulo: item.descripcion || 'Descubre nuestros diseños',
      enlace: RUTAS_PUBLICAS.galeria(slug),
      enlaceExterno: false,
      blogSlug: null,
      tipo: 'galeria',
    });
  }

  if (slides.length === 1) {
    slides.push({
      id: 'promo',
      imagen: null,
      titulo: 'Reserva tu cita',
      subtitulo: 'Horarios flexibles y atención personalizada',
      enlace: RUTAS_PUBLICAS.citas(slug),
      enlaceExterno: false,
      blogSlug: null,
      tipo: 'promo',
    });
  }

  return slides;
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
  const [blog, setBlog] = useState([]);
  const [galeria, setGaleria] = useState([]);
  const [indice, setIndice] = useState(0);
  const [pausado, setPausado] = useState(false);
  const [slugBlogAbierto, setSlugBlogAbierto] = useState(null);

  useEffect(() => {
    if (!marca?.id) return;

    let cancelado = false;

    Promise.all([
      listarCarruselPublico(marca.id).catch(() => []),
      listarBlogPublico(marca.id).catch(() => []),
      listarGaleriaPublica(marca.id).catch(() => []),
    ]).then(([propias, posts, disenos]) => {
      if (!cancelado) {
        setDiapositivasPropias(Array.isArray(propias) ? propias : []);
        setBlog(Array.isArray(posts) ? posts : []);
        setGaleria(Array.isArray(disenos) ? disenos : []);
      }
    });

    return () => {
      cancelado = true;
    };
  }, [marca?.id]);

  const slides = useMemo(() => {
    if (diapositivasPropias.length > 0) {
      return mapearDiapositivasPropias(diapositivasPropias, slug);
    }
    return construirSlidesAutomaticos(marca, slug, blog, galeria);
  }, [diapositivasPropias, marca, slug, blog, galeria]);

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
          <IconoApp
            nombre={slide.tipo === 'marca' ? 'marca' : 'servicios'}
            tamano="xl"
          />
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
