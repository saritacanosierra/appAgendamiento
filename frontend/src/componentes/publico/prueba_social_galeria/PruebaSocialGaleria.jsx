import { resolverUrlMedia } from '../../../compartido/utilidades/resolverUrlMedia';
import '../../../estilos/publico/prueba_social/prueba_social.css';

export default function PruebaSocialGaleria({ disenos = [], titulo }) {
  const visibles = disenos.filter((d) => d.imagenRuta).slice(0, 6);
  if (visibles.length === 0) return null;

  return (
    <section className="prueba-social" aria-label={titulo}>
      <h3>{titulo}</h3>
      <div className="prueba-social__grilla">
        {visibles.map((diseno) => (
          <img
            key={diseno.id}
            src={resolverUrlMedia(diseno.imagenRuta)}
            alt={diseno.titulo ? `${diseno.titulo} — diseño de uñas` : 'Diseño de uñas'}
            loading="lazy"
            width="160"
            height="160"
          />
        ))}
      </div>
    </section>
  );
}
