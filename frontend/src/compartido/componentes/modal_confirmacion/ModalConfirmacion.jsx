import BotonPrincipal from '../boton_principal/BotonPrincipal';
import { ModalPortal } from '../../utilidades/modalPortal';
import '../../../estilos/compartido/modal_confirmacion/modal_confirmacion.css';

export default function ModalConfirmacion({
  abierto,
  titulo,
  mensaje,
  onConfirmar,
  onCancelar,
  textoConfirmar = 'Confirmar',
  textoCancelar = 'Cancelar',
}) {
  return (
    <ModalPortal abierto={abierto}>
      <div className="modal-confirmacion" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
        <button
          type="button"
          className="modal-confirmacion__fondo"
          onClick={onCancelar}
          aria-label="Cerrar"
        />
        <div className="modal-confirmacion__contenido">
          <h2 id="modal-titulo">{titulo}</h2>
          {mensaje && <p>{mensaje}</p>}
          <div className="modal-confirmacion__acciones">
            <BotonPrincipal variante="texto" onClick={onCancelar}>
              {textoCancelar}
            </BotonPrincipal>
            <BotonPrincipal onClick={onConfirmar}>{textoConfirmar}</BotonPrincipal>
          </div>
        </div>
      </div>
    </ModalPortal>
  );
}
