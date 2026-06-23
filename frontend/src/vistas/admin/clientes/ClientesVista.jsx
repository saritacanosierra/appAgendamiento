import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  MensajeError,
} from '../../../compartido/componentes';
import { crearCliente, listarClientes } from '../../../modulos/clientes/servicios/clientesServicio';
import '../../../estilos/admin/clientes/clientes.css';

export default function ClientesVista() {
  const [clientes, setClientes] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);

  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [notas, setNotas] = useState('');

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

  async function manejarBusqueda(e) {
    e.preventDefault();
    cargar(busqueda);
  }

  async function manejarCrear(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await crearCliente({ nombre, telefono, correo, notas });
      setNombre('');
      setTelefono('');
      setCorreo('');
      setNotas('');
      setMostrarForm(false);
      cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="clientes-vista">
      <header className="clientes-vista__cabecera">
        <h1>Clientes</h1>
        <BotonPrincipal onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cerrar' : '+ Nuevo cliente'}
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
        <form className="clientes-vista__formulario" onSubmit={manejarCrear}>
          <h2>Registrar cliente</h2>
          <CampoFormulario etiqueta="Nombre" id="cl-nombre" requerido>
            <input id="cl-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} required />
          </CampoFormulario>
          <CampoFormulario etiqueta="Telefono" id="cl-tel" requerido>
            <input id="cl-tel" type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} required />
          </CampoFormulario>
          <CampoFormulario etiqueta="Correo" id="cl-correo">
            <input id="cl-correo" type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} />
          </CampoFormulario>
          <CampoFormulario etiqueta="Notas" id="cl-notas">
            <textarea id="cl-notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
          </CampoFormulario>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Guardando...' : 'Guardar cliente'}
          </BotonPrincipal>
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
                <strong>{c.nombre}</strong>
                <span>{c.telefono}</span>
                {c.correo && <span>{c.correo}</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
