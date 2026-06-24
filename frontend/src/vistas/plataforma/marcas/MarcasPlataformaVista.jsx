import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  InputTexto,
  MensajeError,
} from '../../../compartido/componentes';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { guardarTokenMarca, marcarImpersonacion } from '../../../compartido/utilidades/tokenSesion';
import {
  actualizarMarcaPlataforma,
  crearMarcaPlataforma,
  impersonarMarcaPlataforma,
  listarMarcasPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import EnlacesEntregaMarca from '../../../componentes/plataforma/enlaces_entrega_marca/EnlacesEntregaMarca';
import '../../../estilos/plataforma/marcas/marcas.css';

const formularioVacio = {
  nombre_comercial: '',
  slug: '',
  admin_nombre: '',
  admin_correo: '',
  admin_contrasena: '',
  plan_habilitado: true,
  activa: true,
};

function EstadoBadge({ activa, planHabilitado }) {
  if (!activa) {
    return <span className="marcas-plataforma__badge marcas-plataforma__badge--suspendida">Suspendida</span>;
  }
  if (!planHabilitado) {
    return <span className="marcas-plataforma__badge marcas-plataforma__badge--plan">Sin plan</span>;
  }
  return <span className="marcas-plataforma__badge marcas-plataforma__badge--activa">Activa</span>;
}

export default function MarcasPlataformaVista() {
  const navigate = useNavigate();
  const { recargarSesionMarca } = useAuth();
  const [marcas, setMarcas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [form, setForm] = useState(formularioVacio);
  const [enviando, setEnviando] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [entrandoPanel, setEntrandoPanel] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setMarcas(await listarMarcasPlataforma());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function crearMarca(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      await crearMarcaPlataforma(form);
      setForm(formularioVacio);
      setMostrarForm(false);
      setMensaje('Empresa creada correctamente.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function entrarPanelMarca(marca) {
    setEntrandoPanel(marca.id);
    setError(null);
    try {
      const datos = await impersonarMarcaPlataforma(marca.id);
      guardarTokenMarca(datos.token);
      marcarImpersonacion(datos.marcaNombre ?? marca.nombreComercial);
      await recargarSesionMarca();
      navigate(RUTAS_ADMIN.panel);
    } catch (err) {
      setError(err.message);
    } finally {
      setEntrandoPanel(null);
    }
  }

  async function toggleCampo(marca, campo) {
    setError(null);
    try {
      await actualizarMarcaPlataforma(marca.id, {
        nombre_comercial: marca.nombreComercial,
        slug: marca.slug,
        telefono: marca.telefono,
        whatsapp: marca.whatsapp,
        direccion: marca.direccion,
        activa: campo === 'activa' ? !marca.activa : marca.activa,
        plan_habilitado: campo === 'plan' ? !marca.planHabilitado : marca.planHabilitado,
      });
      await cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  const marcasFiltradas = marcas.filter((marca) => {
    const texto = busqueda.trim().toLowerCase();
    if (!texto) return true;
    return (
      marca.nombreComercial.toLowerCase().includes(texto)
      || marca.slug.toLowerCase().includes(texto)
      || marca.adminCorreo?.toLowerCase().includes(texto)
    );
  });

  if (cargando) return <Cargando />;

  return (
    <div className="marcas-plataforma">
      <header className="marcas-plataforma__cabecera">
        <div>
          <h2>Mis marcas</h2>
          <p>
            Lista de todas las empresas que gestionas. Cada una es independiente:
            DaniSpa, AlejaNails, etc. tienen su propia info, clientes, galeria y calendario.
          </p>
        </div>
        <BotonPrincipal onClick={() => setMostrarForm(!mostrarForm)}>
          {mostrarForm ? 'Cancelar' : '+ Agregar marca'}
        </BotonPrincipal>
      </header>

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {mensaje && <p className="marcas-plataforma__exito">{mensaje}</p>}

      {mostrarForm && (
        <form className="marcas-plataforma__formulario" onSubmit={crearMarca}>
          <h3>Nueva empresa / marca</h3>
          <p className="marcas-plataforma__form-hint">
            Ejemplo: crea &quot;DaniSpa&quot; y luego &quot;AlejaNails&quot; como marcas separadas.
          </p>
          <CampoFormulario etiqueta="Nombre comercial" id="mp-nombre" requerido>
            <InputTexto
              id="mp-nombre"
              capitalizar="palabras"
              value={form.nombre_comercial}
              placeholder="DaniSpa"
              onChange={(e) => setForm({ ...form, nombre_comercial: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Slug URL (opcional)" id="mp-slug">
            <InputTexto
              id="mp-slug"
              capitalizar={false}
              value={form.slug}
              placeholder="danispa"
              onChange={(e) => setForm({ ...form, slug: e.target.value })}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Admin — nombre" id="mp-admin-nombre" requerido>
            <InputTexto
              id="mp-admin-nombre"
              capitalizar="palabras"
              value={form.admin_nombre}
              onChange={(e) => setForm({ ...form, admin_nombre: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Admin — correo" id="mp-admin-correo" requerido>
            <input
              id="mp-admin-correo"
              type="email"
              value={form.admin_correo}
              placeholder="admin@danispa.test"
              onChange={(e) => setForm({ ...form, admin_correo: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Admin — contrasena" id="mp-admin-pass" requerido>
            <input
              id="mp-admin-pass"
              type="password"
              minLength={8}
              value={form.admin_contrasena}
              onChange={(e) => setForm({ ...form, admin_contrasena: e.target.value })}
              required
            />
          </CampoFormulario>
          <label className="marcas-plataforma__check">
            <input
              type="checkbox"
              checked={form.plan_habilitado}
              onChange={(e) => setForm({ ...form, plan_habilitado: e.target.checked })}
            />
            Plan habilitado (puede operar)
          </label>
          <BotonPrincipal tipo="submit" deshabilitado={enviando}>
            {enviando ? 'Creando...' : 'Crear marca'}
          </BotonPrincipal>
        </form>
      )}

      <section className="marcas-plataforma__tabla-seccion">
        <div className="marcas-plataforma__tabla-cabecera">
          <p className="marcas-plataforma__conteo">
            <strong>{marcas.length}</strong> {marcas.length === 1 ? 'marca' : 'marcas'} registradas
          </p>
          {marcas.length > 0 && (
            <input
              type="search"
              className="marcas-plataforma__busqueda"
              placeholder="Buscar por nombre, slug o correo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          )}
        </div>

        {marcas.length === 0 ? (
          <div className="marcas-plataforma__vacio">
            <p>Aun no tienes marcas registradas.</p>
            <p>Crea la primera, por ejemplo <strong>DaniSpa</strong>, y luego agrega <strong>AlejaNails</strong>.</p>
            <BotonPrincipal onClick={() => setMostrarForm(true)}>+ Agregar primera marca</BotonPrincipal>
          </div>
        ) : marcasFiltradas.length === 0 ? (
          <p className="marcas-plataforma__sin-resultados">No hay marcas que coincidan con &quot;{busqueda}&quot;.</p>
        ) : (
          <div className="marcas-plataforma__tabla-wrap">
            <table className="marcas-plataforma__tabla">
              <thead>
                <tr>
                  <th>Empresa</th>
                  <th>Enlaces para el cliente</th>
                  <th>Admin</th>
                  <th>Contacto</th>
                  <th>Actividad</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {marcasFiltradas.map((marca) => (
                  <tr key={marca.id}>
                    <td>
                      <strong className="marcas-plataforma__nombre">{marca.nombreComercial}</strong>
                    </td>
                    <td>
                      <EnlacesEntregaMarca marca={marca} />
                    </td>
                    <td>
                      {marca.adminNombre && <span className="marcas-plataforma__admin-nombre">{marca.adminNombre}</span>}
                      {marca.adminCorreo && (
                        <span className="marcas-plataforma__admin-correo">{marca.adminCorreo}</span>
                      )}
                    </td>
                    <td className="marcas-plataforma__contacto">
                      {marca.telefono || marca.whatsapp || marca.direccion ? (
                        <>
                          {marca.telefono && <span>{marca.telefono}</span>}
                          {marca.whatsapp && <span>WA: {marca.whatsapp}</span>}
                          {marca.direccion && <span>{marca.direccion}</span>}
                        </>
                      ) : (
                        <span className="marcas-plataforma__sin-dato">Sin datos</span>
                      )}
                    </td>
                    <td>
                      {marca.totalCitas} citas
                      <br />
                      {marca.totalUsuarios} usuarios
                    </td>
                    <td>
                      <EstadoBadge activa={marca.activa} planHabilitado={marca.planHabilitado} />
                    </td>
                    <td>
                      <div className="marcas-plataforma__acciones-tabla">
                        <button
                          type="button"
                          className="marcas-plataforma__panel"
                          onClick={() => entrarPanelMarca(marca)}
                          disabled={entrandoPanel === marca.id}
                        >
                          {entrandoPanel === marca.id ? 'Entrando...' : 'Entrar al panel'}
                        </button>
                        <Link to={RUTAS_PLATAFORMA.editarMarca(marca.id)}>Editar</Link>
                        <button type="button" onClick={() => toggleCampo(marca, 'activa')}>
                          {marca.activa ? 'Suspender' : 'Activar'}
                        </button>
                        <button type="button" onClick={() => toggleCampo(marca, 'plan')}>
                          {marca.planHabilitado ? 'Quitar plan' : 'Habilitar plan'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
