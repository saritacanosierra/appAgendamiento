import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  InputTexto,
  MensajeError,
  SelectorFecha,
} from '../../../compartido/componentes';
import { listarClientes } from '../../../modulos/clientes/servicios/clientesServicio';
import { obtenerServiciosAdmin } from '../../../modulos/reservas/servicios/serviciosServicio';
import { crearCita } from '../../../modulos/agenda/servicios/agendaServicio';
import '../../../estilos/componentes/formulario_cita_admin/formulario_cita_admin.css';

export default function FormularioCitaAdmin({ fechaInicial, onCreada, onCancelar }) {
  const [servicios, setServicios] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const [servicioId, setServicioId] = useState('');
  const [modoCliente, setModoCliente] = useState('existente');
  const [clienteId, setClienteId] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [fecha, setFecha] = useState(fechaInicial);
  const [horaInicio, setHoraInicio] = useState('10:00');
  const [notasInternas, setNotasInternas] = useState('');

  useEffect(() => {
    setFecha(fechaInicial);
  }, [fechaInicial]);

  useEffect(() => {
    async function cargar() {
      setCargandoDatos(true);
      try {
        const [sv, cl] = await Promise.all([
          obtenerServiciosAdmin(),
          listarClientes(''),
        ]);
        setServicios(sv.filter((s) => s.activo));
        setClientes(cl);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargandoDatos(false);
      }
    }
    cargar();
  }, []);

  async function manejarEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const payload = {
      servicio_id: Number(servicioId),
      fecha,
      hora_inicio: horaInicio,
      estado: 'confirmada',
      notas_internas: notasInternas.trim() || null,
    };

    if (modoCliente === 'existente') {
      payload.cliente_id = Number(clienteId);
    } else {
      payload.nombre = nombre.trim();
      payload.telefono = telefono.trim();
    }

    try {
      await crearCita(payload);
      onCreada?.();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  if (cargandoDatos) {
    return <p className="formulario-cita-admin__cargando">Cargando datos...</p>;
  }

  return (
    <form className="formulario-cita-admin" onSubmit={manejarEnviar}>
      <h2>Nueva cita</h2>

      {error && <MensajeError mensaje={error} />}

      <CampoFormulario etiqueta="Servicio" id="cita-servicio" requerido>
        <select
          id="cita-servicio"
          value={servicioId}
          onChange={(e) => setServicioId(e.target.value)}
          required
        >
          <option value="">Selecciona un servicio</option>
          {servicios.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nombre} ({s.duracionMinutos} min)
            </option>
          ))}
        </select>
      </CampoFormulario>

      <fieldset className="formulario-cita-admin__cliente">
        <legend>Cliente</legend>
        <div className="formulario-cita-admin__modo-cliente">
          <label>
            <input
              type="radio"
              name="modo-cliente"
              checked={modoCliente === 'existente'}
              onChange={() => setModoCliente('existente')}
            />
            Cliente registrado
          </label>
          <label>
            <input
              type="radio"
              name="modo-cliente"
              checked={modoCliente === 'nuevo'}
              onChange={() => setModoCliente('nuevo')}
            />
            Cliente nuevo
          </label>
        </div>

        {modoCliente === 'existente' ? (
          <CampoFormulario etiqueta="Cliente" id="cita-cliente" requerido>
            <select
              id="cita-cliente"
              value={clienteId}
              onChange={(e) => setClienteId(e.target.value)}
              required
            >
              <option value="">Selecciona un cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nombre} — {c.telefono}
                </option>
              ))}
            </select>
          </CampoFormulario>
        ) : (
          <>
            <CampoFormulario etiqueta="Nombre" id="cita-nombre" requerido>
              <InputTexto
                id="cita-nombre"
                capitalizar="palabras"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Telefono" id="cita-tel" requerido>
              <input
                id="cita-tel"
                type="tel"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                required
              />
            </CampoFormulario>
          </>
        )}
      </fieldset>

      <div className="formulario-cita-admin__fila">
        <SelectorFecha valor={fecha} onChange={setFecha} etiqueta="Fecha" />
        <CampoFormulario etiqueta="Hora inicio" id="cita-hora" requerido>
          <input
            id="cita-hora"
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            required
          />
        </CampoFormulario>
      </div>

      <CampoFormulario etiqueta="Notas internas" id="cita-notas">
        <textarea
          id="cita-notas"
          value={notasInternas}
          onChange={(e) => setNotasInternas(e.target.value)}
        />
      </CampoFormulario>

      <div className="formulario-cita-admin__acciones">
        <BotonPrincipal variante="texto" tipo="button" onClick={onCancelar}>
          Cancelar
        </BotonPrincipal>
        <BotonPrincipal tipo="submit" deshabilitado={enviando || servicios.length === 0}>
          {enviando ? 'Guardando...' : 'Crear cita'}
        </BotonPrincipal>
      </div>
    </form>
  );
}
