import { useState } from 'react';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { ModalPortal } from '../../../compartido/utilidades/modalPortal';
import ContenidoInstalarPwaAdmin from './ContenidoInstalarPwaAdmin';
import '../../../estilos/componentes/instalar_app_admin/instalar_app_admin.css';

export default function BotonAccesoRapidoPwaAdmin({
  esIos,
  esStandalone,
  puedeInstalarNativo,
  instalar,
}) {
  const [abierto, setAbierto] = useState(false);

  return (
    <>
      <button
        type="button"
        className="instalar-app-admin__boton-topbar"
        onClick={() => setAbierto(true)}
        title="Acceso rapido en celular"
        aria-label="Acceso rapido en celular — instalar icono del panel"
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
              <h2 id="modal-acceso-rapido-titulo">Acceso rapido en celular</h2>
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
                esIos={esIos}
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
