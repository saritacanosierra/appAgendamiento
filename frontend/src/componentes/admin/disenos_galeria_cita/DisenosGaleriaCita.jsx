import { ImagenAmpliable } from '../../../compartido/componentes';
import '../../../estilos/componentes/disenos_galeria_cita/disenos_galeria_cita.css';

export default function DisenosGaleriaCita({ disenos, variante = 'compacta', className = '' }) {
  const lista = Array.isArray(disenos) ? disenos : [];
  if (lista.length === 0) return null;

  const clases = [
    'disenos-galeria-cita',
    `disenos-galeria-cita--${variante}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (variante === 'panel') {
    return (
      <section className={clases} aria-label="Disenos elegidos en galeria">
        <div className="disenos-galeria-cita__cabecera">
          <h3>Disenos elegidos</h3>
          <span className="disenos-galeria-cita__contador">
            {lista.length} {lista.length === 1 ? 'diseno' : 'disenos'}
          </span>
        </div>
        <p className="disenos-galeria-cita__ayuda">
          El cliente marco estos disenos en la galeria para esta cita.
        </p>
        <ul className="disenos-galeria-cita__grid">
          {lista.map((diseno) => (
            <li key={diseno.id} className="disenos-galeria-cita__item">
              <div className="disenos-galeria-cita__imagen">
                <ImagenAmpliable src={diseno.imagenRuta} alt={diseno.titulo} loading="lazy" />
              </div>
              <span className="disenos-galeria-cita__titulo">{diseno.titulo}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  return (
    <div className={clases} aria-label={`${lista.length} disenos elegidos en galeria`}>
      <p className="disenos-galeria-cita__etiqueta">
        {lista.length} {lista.length === 1 ? 'diseno elegido' : 'disenos elegidos'}
      </p>
      <ul className="disenos-galeria-cita__miniaturas">
        {lista.map((diseno) => (
          <li key={diseno.id} className="disenos-galeria-cita__miniatura">
            <img src={diseno.imagenRuta} alt={diseno.titulo} loading="lazy" />
          </li>
        ))}
      </ul>
    </div>
  );
}
