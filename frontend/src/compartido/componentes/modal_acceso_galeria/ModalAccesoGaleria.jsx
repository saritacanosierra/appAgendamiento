import { useEffect, useState } from 'react';
import { BotonPrincipal, CampoFormulario } from '../index';
import '../../../estilos/compartido/modal_acceso_galeria/modal_acceso_galeria.css';

export default function ModalAccesoGaleria({
  abierto,
  cargando,
  error,
  citas,
  citaSeleccionadaId,
  telefonoInicial = '',
  mostrarTelefono = true,
  onTelefonoSubmit,
  onElegirCita,
  onConfirmarCita,
  onCerrar,
}) {
  const [telefono, setTelefono] = useState(telefonoInicial);
  const pasoElegirCita = citas?.length > 0;

  useEffect(() => {
    if (abierto) {
      setTelefono(telefonoInicial);
    }
  }, [abierto, telefonoInicial]);

  if (!abierto) return null;

  function manejarTelefono(e) {
    e.preventDefault();
    onTelefonoSubmit(telefono.trim());
  }

  return (
    <div className="modal-acceso-galeria" role="dialog" aria-modal="true" aria-labelledby="modal-galeria-titulo">
      <div className="modal-acceso-galeria__backdrop" onClick={onCerrar} aria-hidden="true" />
      <div className="modal-acceso-galeria__panel tarjeta-app">
        <button type="button" className="modal-acceso-galeria__cerrar" onClick={onCerrar} aria-label="Cerrar">
          ×
        </button>

        {!pasoElegirCita ? (
          mostrarTelefono ? (
          <>
            <h2 id="modal-galeria-titulo">Elige tus disenos</h2>
            <p className="modal-acceso-galeria__intro">
              Ingresa el telefono con el que reservaste para guardar las uñas que te gusten en tu cita.
            </p>

            <form className="modal-acceso-galeria__form" onSubmit={manejarTelefono}>
              <CampoFormulario etiqueta="Telefono" id="galeria-telefono" requerido>
                <input
                  id="galeria-telefono"
                  type="tel"
                  inputMode="tel"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="300 123 4567"
                  autoComplete="tel"
                  required
                  disabled={cargando}
                />
              </CampoFormulario>

              {error && <p className="modal-acceso-galeria__error">{error}</p>}

              <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={cargando || !telefono.trim()}>
                {cargando ? 'Verificando...' : 'Continuar'}
              </BotonPrincipal>
            </form>
          </>
          ) : (
            <>
              <h2 id="modal-galeria-titulo">Verificando tu cita</h2>
              <p className="modal-acceso-galeria__intro">Un momento...</p>
              {cargando && <p className="modal-acceso-galeria__intro">Cargando citas activas...</p>}
              {error && <p className="modal-acceso-galeria__error">{error}</p>}
            </>
          )
        ) : (
          <>
            <h2 id="modal-galeria-titulo">Tu cita reservada</h2>
            <p className="modal-acceso-galeria__intro">
              Selecciona la cita para la que quieres guardar disenos.
            </p>

            <ul className="modal-acceso-galeria__citas">
              {citas.map((cita) => (
                <li key={cita.id}>
                  <button
                    type="button"
                    className={`modal-acceso-galeria__cita${
                      citaSeleccionadaId === cita.id ? ' modal-acceso-galeria__cita--activa' : ''
                    }`}
                    onClick={() => onElegirCita(cita)}
                  >
                    <strong>{cita.servicio.nombre}</strong>
                    <span>
                      {cita.fecha} · {cita.horaInicio}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {error && <p className="modal-acceso-galeria__error">{error}</p>}

            <BotonPrincipal
              anchoCompleto
              onClick={onConfirmarCita}
              deshabilitado={!citaSeleccionadaId || cargando}
            >
              Ver galeria
            </BotonPrincipal>
          </>
        )}
      </div>
    </div>
  );
}
