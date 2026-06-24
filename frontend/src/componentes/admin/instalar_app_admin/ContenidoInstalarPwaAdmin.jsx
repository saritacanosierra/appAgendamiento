import { BotonPrincipal, IconoApp } from '../../../compartido/componentes';
import { obtenerPasosInstalarPwa } from './pasosInstalarPwaAdmin';

export default function ContenidoInstalarPwaAdmin({
  esIos,
  esStandalone,
  puedeInstalarNativo,
  instalar,
  onCerrar,
  variante = 'banner',
}) {
  const { intro, pasos } = obtenerPasosInstalarPwa({ esIos, esStandalone, puedeInstalarNativo });

  return (
    <>
      <div className="instalar-app-admin__icono" aria-hidden="true">
        <IconoApp nombre="instalar" tamano="lg" />
      </div>
      <div className="instalar-app-admin__texto">
        <strong>Acceso rapido en tu celular</strong>
        <p className="instalar-app-admin__intro">{intro}</p>
        <ol className="instalar-app-admin__pasos">
          {pasos.map((paso, indice) => (
            <li key={indice}>{paso}</li>
          ))}
        </ol>
      </div>
      {(onCerrar && variante === 'banner') || (!esStandalone && puedeInstalarNativo) ? (
        <div className="instalar-app-admin__acciones">
          {!esStandalone && puedeInstalarNativo && (
            <BotonPrincipal type="button" onClick={instalar}>
              Instalar icono
            </BotonPrincipal>
          )}
          {onCerrar && variante === 'banner' && (
            <button type="button" className="instalar-app-admin__cerrar" onClick={onCerrar}>
              {puedeInstalarNativo && !esStandalone ? 'Ahora no' : 'Entendido'}
            </button>
          )}
        </div>
      ) : null}
    </>
  );
}
