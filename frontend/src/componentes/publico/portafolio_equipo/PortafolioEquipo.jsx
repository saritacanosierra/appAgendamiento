import { useState } from 'react';
import { Link } from 'react-router-dom';
import ImagenAmpliable from '../../../compartido/componentes/imagen_ampliable/ImagenAmpliable';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import '../../../estilos/publico/portafolio/portafolio.css';

function Trabajos({ trabajos }) {
  const [ocultos, setOcultos] = useState([]);
  const visibles = (trabajos ?? []).filter((trabajo) => trabajo.imagen && !ocultos.includes(trabajo.id));
  if (!trabajos?.length || (ocultos.length > 0 && visibles.length === 0)) return null;

  return (
    <div className="portafolio-equipo__trabajos">
      <p>Mejores trabajos</p>
      <div className="portafolio-equipo__franja">
        {visibles.map((trabajo) => (
          <ImagenAmpliable
            key={trabajo.id}
            src={trabajo.imagen}
            alt={trabajo.titulo}
            className="portafolio-equipo__trabajo"
            onError={() => setOcultos((prev) => (prev.includes(trabajo.id) ? prev : [...prev, trabajo.id]))}
          />
        ))}
      </div>
    </div>
  );
}

function inicial(nombre) {
  return (nombre || '?').trim().charAt(0).toUpperCase();
}

function FotoProfesional({ profesional, className }) {
  if (profesional.foto) {
    return <img src={profesional.foto} alt="" className={className} />;
  }
  return (
    <span className={`${className} portafolio-equipo__foto--vacia`} aria-hidden="true">
      {inicial(profesional.nombre)}
    </span>
  );
}

export default function PortafolioEquipo({ profesionales, slug, compacto = false }) {
  if (!profesionales?.length) return null;

  if (compacto && profesionales.length === 1) {
    const persona = profesionales[0];
    const destacadas = (persona.habilidades ?? []).slice(0, 3);
    return (
      <Link className="portafolio-solo" to={RUTAS_PUBLICAS.equipo(slug)}>
        <FotoProfesional profesional={persona} className="portafolio-solo__foto" />
        <span className="portafolio-solo__cuerpo">
          {persona.descripcion && <span className="portafolio-solo__descripcion">{persona.descripcion}</span>}
          {destacadas.length > 0 && (
            <span className="portafolio-solo__habilidades">
              {destacadas.map((habilidad) => (
                <span key={habilidad}>{habilidad}</span>
              ))}
            </span>
          )}
          <span className="portafolio-solo__boton">Portafolio</span>
        </span>
      </Link>
    );
  }

  if (compacto) {
    return (
      <section className="portafolio-equipo portafolio-equipo--franja" aria-label="Equipo">
        <div className="portafolio-equipo__cabecera">
          <h2>El equipo</h2>
          <Link to={RUTAS_PUBLICAS.equipo(slug)}>Ver portafolio</Link>
        </div>
        <div className="portafolio-equipo__franja">
          {profesionales.map((profesional) => (
            <Link
              key={profesional.id}
              className="portafolio-equipo__mini"
              to={RUTAS_PUBLICAS.equipo(slug)}
            >
              <FotoProfesional profesional={profesional} className="portafolio-equipo__mini-foto" />
              <strong>{profesional.nombre}</strong>
              {profesional.habilidades?.[0] && <span>{profesional.habilidades[0]}</span>}
            </Link>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="portafolio-equipo" aria-label="Portafolio del equipo">
      <ul className="portafolio-equipo__lista">
        {profesionales.map((profesional) => (
          <li key={profesional.id} className="portafolio-equipo__tarjeta">
            <FotoProfesional profesional={profesional} className="portafolio-equipo__foto" />
            <div className="portafolio-equipo__cuerpo">
              <h2>{profesional.nombre}</h2>
              {profesional.descripcion && <p className="portafolio-equipo__descripcion">{profesional.descripcion}</p>}
              {profesional.habilidades?.length > 0 && (
                <ul className="portafolio-equipo__habilidades">
                  {profesional.habilidades.map((habilidad) => (
                    <li key={habilidad}>{habilidad}</li>
                  ))}
                </ul>
              )}
              <Trabajos trabajos={profesional.trabajos} />
              <Link
                className="portafolio-equipo__agendar"
                to={`${RUTAS_PUBLICAS.reservar(slug)}?estilista=${profesional.id}`}
              >
                Agendar con {profesional.nombre}
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
