import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  IconoApp,
  InputTexto,
  MensajeError,
  ModalConfirmacion,
} from '../../../compartido/componentes';
import {
  actualizarCliente,
  crearCliente,
  desactivarCliente,
  listarClientes,
} from '../../../modulos/clientes/servicios/clientesServicio';
import '../../../estilos/admin/clientes/clientes.css';

const FORM_VACIO = {
  nombre: '',
  telefono: '',
  correo: '',
  notas: '',
};

export default function ClientesVista() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [clienteAEliminar, setClienteAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);
  const [form, setForm] = useState(FORM_VACIO);

  async function cargar(q = busqueda) {
    setCargando(true);
    setError(null);
    try {
      setClientes(await listarClientes(q));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
  }

  function abrirCrear() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setMostrarForm(true);
  }

  function abrirEditar(cliente) {
    setEditandoId(cliente.id);
    setForm({
      nombre: cliente.nombre ?? '',
      telefono: cliente.telefono ?? '',
      correo: cliente.correo ?? '',
      notas: cliente.notas ?? '',
    });
    setMostrarForm(true);
  }

  async function manejarBusqueda(e) {
    e.preventDefault();
    cargar(busqueda);
  }

  async function manejarEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      const payload = {
        nombre: form.nombre,
        telefono: form.telefono,
        correo: form.correo,
        notas: form.notas,
      };

      if (editandoId) {
        await actualizarCliente(editandoId, payload);
      } else {
        await crearCliente(payload);
      }

      cerrarForm();
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarEliminar() {
    if (!clienteAEliminar) return;

    setEliminando(true);
    setError(null);
    try {
      await desactivarCliente(clienteAEliminar.id);
      if (editandoId === clienteAEliminar.id) {
        cerrarForm();
      }
      setClienteAEliminar(null);
      cargar();
    } catch (err) {
      setError(err.message);
      setClienteAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="clientes-vista">
      <ModalConfirmacion
        abierto={Boolean(clienteAEliminar)}
        titulo="Eliminar cliente"
        mensaje={
          clienteAEliminar
            ? `¿Eliminar a "${clienteAEliminar.nombre}" de la lista? Sus citas y servicios ya realizados se conservan en el historial.`
            : ''
        }
        textoConfirmar={eliminando ? 'Eliminando...' : 'Si, eliminar'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => !eliminando && setClienteAEliminar(null)}
      />

      <header className="clientes-vista__cabecera">
        <h1>Clientes</h1>
        <BotonPrincipal onClick={() => (mostrarForm && !editandoId ? cerrarForm() : abrirCrear())}>
          {mostrarForm && !editandoId ? 'Cerrar' : '+ Nuevo cliente'}
        </BotonPrincipal>
      </header>

      <form className="clientes-vista__busqueda" onSubmit={manejarBusqueda}>
        <input
          type="search"
          placeholder="Buscar por nombre o telefono..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        <BotonPrincipal tipo="submit" variante="secundario">Buscar</BotonPrincipal>
      </form>

      {mostrarForm && (
        <form className="clientes-vista__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar cliente' : 'Registrar cliente'}</h2>
          <CampoFormulario etiqueta="Nombre" id="cl-nombre" requerido>
            <InputTexto
              id="cl-nombre"
              capitalizar="palabras"
              value={form.nombre}
              onChange={(e) => setForm((prev) => ({ ...prev, nombre: e.target.value }))}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Telefono" id="cl-tel" requerido>
            <input
              id="cl-tel"
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((prev) => ({ ...prev, telefono: e.target.value }))}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Correo" id="cl-correo">
            <input
              id="cl-correo"
              type="email"
              value={form.correo}
              onChange={(e) => setForm((prev) => ({ ...prev, correo: e.target.value }))}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Notas" id="cl-notas">
            <textarea
              id="cl-notas"
              value={form.notas}
              onChange={(e) => setForm((prev) => ({ ...prev, notas: e.target.value }))}
            />
          </CampoFormulario>
          <div className="clientes-vista__form-acciones">
            <BotonPrincipal tipo="button" variante="secundario" onClick={cerrarForm}>
              Cancelar
            </BotonPrincipal>
            <BotonPrincipal tipo="submit" deshabilitado={enviando}>
              {enviando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Guardar cliente'}
            </BotonPrincipal>
          </div>
        </form>
      )}

      {error && <MensajeError mensaje={error} />}
      {cargando && <Cargando />}

      {!cargando && (
        <ul className="clientes-vista__lista">
          {clientes.length === 0 ? (
            <li className="clientes-vista__vacio">No hay clientes registrados.</li>
          ) : (
            clientes.map((c) => (
              <li key={c.id} className="clientes-vista__item">
                <div className="clientes-vista__item-datos">
                  <strong>{c.nombre}</strong>
                  <span>{c.telefono}</span>
                  {c.correo && <span>{c.correo}</span>}
                  {c.notas && <span className="clientes-vista__item-notas">{c.notas}</span>}
                </div>
                <div className="clientes-vista__item-acciones">
                  <button
                    type="button"
                    className="clientes-vista__accion-icono clientes-vista__accion-icono--editar"
                    onClick={() => abrirEditar(c)}
                    aria-label={`Editar ${c.nombre}`}
                    title="Editar"
                  >
                    <IconoApp nombre="editar" tamano="sm" />
                  </button>
                  <button
                    type="button"
                    className="clientes-vista__accion-icono clientes-vista__accion-icono--eliminar"
                    onClick={() => setClienteAEliminar(c)}
                    aria-label={`Eliminar ${c.nombre}`}
                    title="Eliminar"
                  >
                    <IconoApp nombre="eliminar" tamano="sm" />
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
