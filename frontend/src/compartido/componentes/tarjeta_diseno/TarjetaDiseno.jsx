import ImagenAmpliable from '../imagen_ampliable/ImagenAmpliable';
import '../../../estilos/compartido/tarjeta_diseno/tarjeta_diseno.css';
export default function TarjetaDiseno({ diseno }) {
  return (
    <article className="tarjeta-diseno">
      <div className="tarjeta-diseno__imagen">
        {diseno.imagen ? (
          <ImagenAmpliable src={diseno.imagen} alt={diseno.titulo} loading="lazy" />
        ) : (
          <div className="tarjeta-diseno__placeholder" aria-hidden="true" />
        )}
      </div>
      <div className="tarjeta-diseno__info">
        <h3>{diseno.titulo}</h3>
        {diseno.categoria && <span>{diseno.categoria}</span>}
      </div>
    </article>
  );
}
