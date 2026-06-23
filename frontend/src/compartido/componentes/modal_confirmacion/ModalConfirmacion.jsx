import BotonPrincipal from '../boton_principal/BotonPrincipal';
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
  if (!abierto) return null;

  return (
    <div className="modal-confirmacion" role="dialog" aria-modal="true" aria-labelledby="modal-titulo">
      <div className="modal-confirmacion__fondo" onClick={onCancelar} aria-hidden="true" />
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
  );
}
