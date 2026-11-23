import { useEffect, useState } from 'react';
import { BotonPrincipal, CampoFormulario, Cargando, MensajeError } from '../../../compartido/componentes';
import {
  guardarWompiPlataforma,
  obtenerWompiPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/cobros/cobros.css';

const VACIO = {
  llavePublica: '',
  secretoIntegridad: '',
  secretoEventos: '',
};

export default function CobrosWompiVista() {
  const [estado, setEstado] = useState(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerWompiPlataforma();
      setEstado(datos);
      setFormulario({
        llavePublica: datos.llavePublica || '',
        secretoIntegridad: '',
        secretoEventos: '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cambiar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);
    try {
      const datos = await guardarWompiPlataforma({
        llave_publica: formulario.llavePublica,
        secreto_integridad: formulario.secretoIntegridad,
        secreto_eventos: formulario.secretoEventos,
      });
      setEstado(datos);
      setFormulario({
        llavePublica: datos.llavePublica || '',
        secretoIntegridad: '',
        secretoEventos: '',
      });
      setMensaje(datos.listo
        ? 'Cuenta de Wompi guardada. Las marcas ya pueden pagar la suscripción.'
        : 'Guardado. Todavía falta completar las llaves.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !estado) return <MensajeError mensaje={error} onReintentar={cargar} />;

  return (
    <div className="cobros-wompi">
      <header className="cobros-wompi__cabecera">
        <div>
          <h1>Cuenta Wompi</h1>
          <p>
            Aquí quien administra la plataforma guarda las llaves del comercio.
            Con eso las marcas pueden elegir un periodo y pagar la suscripción.
            Los secretos no se muestran otra vez: si no los cambias, déjalos en blanco.
          </p>
        </div>
        <p className={`cobros-wompi__estado${estado?.listo ? ' cobros-wompi__estado--listo' : ''}`}>
          {estado?.listo ? 'Listo para cobrar' : 'Todavía no cobra'}
        </p>
      </header>

      <section className="cobros-wompi__aviso">
        <h2>URL de eventos</h2>
        <p>
          En el panel de Wompi, pega esta dirección como URL de eventos. Sin ella el pago
          puede pasar en Wompi y la agenda no se abre sola.
        </p>
        <code className="cobros-wompi__url">{estado?.urlEventos}</code>
        {!estado?.eventosListos && (
          <p className="cobros-wompi__alerta">Falta el secreto de eventos para confirmar los pagos.</p>
        )}
      </section>

      <form className="cobros-wompi__formulario" onSubmit={guardar}>
        <CampoFormulario etiqueta="Llave pública" id="wompi-llave-publica" requerido>
          <input
            id="wompi-llave-publica"
            value={formulario.llavePublica}
            onChange={(e) => cambiar('llavePublica', e.target.value)}
            placeholder="pub_prod_... o pub_test_..."
            autoComplete="off"
            required
          />
        </CampoFormulario>
        <CampoFormulario
          etiqueta={estado?.secretoIntegridadGuardado
            ? 'Secreto de integridad (deja vacío para no cambiarlo)'
            : 'Secreto de integridad'}
          id="wompi-secreto-integridad"
          requerido={!estado?.secretoIntegridadGuardado}
        >
          <input
            id="wompi-secreto-integridad"
            type="password"
            value={formulario.secretoIntegridad}
            onChange={(e) => cambiar('secretoIntegridad', e.target.value)}
            placeholder={estado?.secretoIntegridadGuardado ? '••••••••' : 'prod_integrity_... o test_integrity_...'}
            autoComplete="new-password"
            required={!estado?.secretoIntegridadGuardado}
          />
        </CampoFormulario>
        <CampoFormulario
          etiqueta={estado?.secretoEventosGuardado
            ? 'Secreto de eventos (deja vacío para no cambiarlo)'
            : 'Secreto de eventos'}
          id="wompi-secreto-eventos"
        >
          <input
            id="wompi-secreto-eventos"
            type="password"
            value={formulario.secretoEventos}
            onChange={(e) => cambiar('secretoEventos', e.target.value)}
            placeholder={estado?.secretoEventosGuardado ? '••••••••' : ''}
            autoComplete="new-password"
          />
        </CampoFormulario>

        {mensaje && <p className="cobros-wompi__ok">{mensaje}</p>}
        {error && <p className="cobros-wompi__error">{error}</p>}

        <BotonPrincipal tipo="submit" deshabilitado={guardando}>
          {guardando ? 'Guardando...' : 'Guardar cuenta Wompi'}
        </BotonPrincipal>
      </form>
    </div>
  );
}
