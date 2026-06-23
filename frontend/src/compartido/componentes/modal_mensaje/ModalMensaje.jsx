import BotonPrincipal from '../boton_principal/BotonPrincipal';
import { ModalPortal } from '../../utilidades/modalPortal';
import '../../../estilos/compartido/modal_mensaje/modal_mensaje.css';

const ICONOS = {
  exito: '✓',
  error: '✕',
  info: 'ℹ',
};

export default function ModalMensaje({
  abierto,
  titulo,
  mensaje,
  variante = 'exito',
  onCerrar,
  textoCerrar = 'Entendido',
}) {
  return (
    <ModalPortal abierto={abierto}>
      <div
        className={`modal-mensaje modal-mensaje--${variante}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-mensaje-titulo"
      >
        <button
          type="button"
          className="modal-mensaje__fondo"
          onClick={onCerrar}
          aria-label="Cerrar"
        />
        <div className="modal-mensaje__contenido">
          <span className="modal-mensaje__icono" aria-hidden="true">
            {ICONOS[variante] ?? ICONOS.info}
          </span>
          <h2 id="modal-mensaje-titulo">{titulo}</h2>
          {mensaje && <p>{mensaje}</p>}
          <BotonPrincipal onClick={onCerrar} anchoCompleto>
            {textoCerrar}
          </BotonPrincipal>
        </div>
      </div>
    </ModalPortal>
  );
}
