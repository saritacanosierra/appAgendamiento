import { useState } from 'react';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { ModalPortal } from '../../../compartido/utilidades/modalPortal';
import ContenidoInstalarPwaAdmin from './ContenidoInstalarPwaAdmin';
import '../../../estilos/componentes/instalar_app_admin/instalar_app_admin.css';

export default function BotonAccesoRapidoPwaAdmin({
  sistema = 'escritorio',
  esStandalone,
  puedeInstalarNativo,
  instalar,
}) {
  const [abierto, setAbierto] = useState(false);
  const enCelular = sistema === 'ios' || sistema === 'android';
  const titulo = enCelular ? 'Acceso rápido en el celular' : 'Instalar el panel en este equipo';

  return (
    <>
      <button
        type="button"
        className="instalar-app-admin__boton-topbar"
        onClick={() => setAbierto(true)}
        title={titulo}
        aria-label={titulo}
      >
        <IconoApp nombre="instalar" tamano="md" />
      </button>

      <ModalPortal abierto={abierto}>
        <div
          className="instalar-app-admin__modal"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-acceso-rapido-titulo"
        >
          <button
            type="button"
            className="instalar-app-admin__fondo"
            onClick={() => setAbierto(false)}
            aria-label="Cerrar"
          />
          <div className="instalar-app-admin__panel">
            <header className="instalar-app-admin__cabecera">
              <h2 id="modal-acceso-rapido-titulo">{titulo}</h2>
              <button
                type="button"
                className="instalar-app-admin__cerrar-modal"
                onClick={() => setAbierto(false)}
                aria-label="Cerrar"
              >
                <IconoApp nombre="cerrar" tamano="sm" />
              </button>
            </header>
            <div className="instalar-app-admin instalar-app-admin--modal">
              <ContenidoInstalarPwaAdmin
                sistema={sistema}
                esStandalone={esStandalone}
                puedeInstalarNativo={puedeInstalarNativo}
                instalar={async () => {
                  const ok = await instalar();
                  if (ok) setAbierto(false);
                }}
                variante="modal"
              />
            </div>
          </div>
        </div>
      </ModalPortal>
    </>
  );
}
