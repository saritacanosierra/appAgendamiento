import { BotonPrincipal } from '../../../compartido/componentes';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
import GuiaPersonalizacion from '../guia_personalizacion/GuiaPersonalizacion';
import '../../../estilos/componentes/bienvenida_marca/bienvenida_marca.css';

export default function BienvenidaMarca({ marca, hechos, onVerPanel }) {
  const slug = marca?.slug;
  const nombre = marca?.nombreComercial ?? 'Tu marca';

  return (
    <div className="bienvenida-marca">
      <section className="bienvenida-marca__portada">
        <p className="bienvenida-marca__etiqueta">Lista para personalizar</p>
        <h1>{nombre}</h1>
        <p className="bienvenida-marca__texto">
          El paso 1 ya está: entraste. Sigue del 2 al 6. Al final copias el enlace y se lo envías a tu clienta. Ella no se registra.
        </p>
      </section>

      <section className="bienvenida-marca__preview" aria-label="Así se ve hoy">
        <div className="bienvenida-marca__preview-marco">
          <span>Así la ve tu clienta</span>
          <strong>{nombre}</strong>
          <p>Elige día, servicio y hora.</p>
        </div>
        {slug && (
          <a
            className="bienvenida-marca__preview-enlace"
            href={RUTAS_PUBLICAS.inicioMarca(slug)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Abrir la vista de clientas
            <IconoApp nombre="externo" />
          </a>
        )}
      </section>

      <GuiaPersonalizacion hechos={hechos} permitirOcultar={false} />

      <BotonPrincipal to={RUTAS_ADMIN.configuracionMarca} anchoCompleto>
        Seguir con el paso 2: tu marca
      </BotonPrincipal>
      <button type="button" className="bienvenida-marca__secundario" onClick={onVerPanel}>
        Ver el panel del día
      </button>
    </div>
  );
}
