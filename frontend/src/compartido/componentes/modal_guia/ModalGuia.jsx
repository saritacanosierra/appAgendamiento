import { useEffect } from 'react';
import BotonPrincipal from '../boton_principal/BotonPrincipal';
import { ModalPortal } from '../../utilidades/modalPortal';
import '../../../estilos/compartido/modal_guia/modal_guia.css';

export default function ModalGuia({
  abierto,
  titulo,
  onCerrar,
  children,
  textoCerrar = 'Entendido',
}) {
  useEffect(() => {
    if (!abierto) return undefined;
    function alTecla(evento) {
      if (evento.key === 'Escape') onCerrar();
    }
    window.addEventListener('keydown', alTecla);
    return () => window.removeEventListener('keydown', alTecla);
  }, [abierto, onCerrar]);

  return (
    <ModalPortal abierto={abierto}>
      <div
        className="modal-guia"
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-guia-titulo"
      >
        <button
          type="button"
          className="modal-guia__fondo"
          onClick={onCerrar}
          aria-label="Cerrar"
        />
        <div className="modal-guia__panel">
          <div className="modal-guia__cabecera">
            <h2 id="modal-guia-titulo">{titulo}</h2>
            <button
              type="button"
              className="modal-guia__cerrar"
              onClick={onCerrar}
              aria-label="Cerrar guía"
            >
              ×
            </button>
          </div>
          <div className="modal-guia__cuerpo">
            {children}
          </div>
          <BotonPrincipal onClick={onCerrar} anchoCompleto>
            {textoCerrar}
          </BotonPrincipal>
        </div>
      </div>
    </ModalPortal>
  );
}
