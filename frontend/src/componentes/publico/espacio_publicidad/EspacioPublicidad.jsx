import '../../../estilos/publico/espacio_publicidad/espacio_publicidad.css';

export default function EspacioPublicidad({ anuncios }) {
  if (!anuncios?.length) return null;

  return (
    <section className="espacio-publicidad" aria-label="Publicidad">
      <p className="espacio-publicidad__etiqueta">Publicidad</p>
      <ul className="espacio-publicidad__lista">
        {anuncios.map((anuncio) => {
          if (anuncio.tipo === 'imagen' && !anuncio.imagen) return null;
          const contenido = (
            <>
              {anuncio.tipo === 'imagen' && anuncio.imagen && (
                <img src={anuncio.imagen} alt={anuncio.titulo} loading="lazy" />
              )}
              {anuncio.tipo !== 'imagen' && (
                <span className="espacio-publicidad__texto">
                  <strong>{anuncio.titulo}</strong>
                  {anuncio.anunciante && <span>{anuncio.anunciante}</span>}
                  {anuncio.texto && <p>{anuncio.texto}</p>}
                </span>
              )}
            </>
          );

          return (
            <li key={anuncio.id}>
              {anuncio.enlaceUrl ? (
                <a
                  className="espacio-publicidad__anuncio"
                  href={anuncio.enlaceUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                >
                  {contenido}
                </a>
              ) : (
                <div className="espacio-publicidad__anuncio">{contenido}</div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
