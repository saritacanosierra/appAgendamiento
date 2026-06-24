import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  IconoApp,
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
  obtenerMarcaPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import ModalDetalleMarcaPlataforma from '../../../componentes/plataforma/modal_detalle_marca/ModalDetalleMarcaPlataforma';
import '../../../estilos/plataforma/marcas/marcas.css';

const formularioVacio = {
  nombre_comercial: '',
  slug: '',
  admin_nombre: '',
  admin_correo: '',
  admin_contrasena: '',
  plan_habilitado: true,
  plan_tipo: 'mensual',
  activa: true,
};

function EstadoBadgeCompacto({ activa, planHabilitado, suscripcion }) {
  if (!activa) {
    return <span className="marcas-plataforma__badge marcas-plataforma__badge--suspendida">Suspendida</span>;
  }
  if (suscripcion?.vencido) {
    return <span className="marcas-plataforma__badge marcas-plataforma__badge--vencida">Vencida</span>;
  }
  if (suscripcion?.porVencer) {
    return <span className="marcas-plataforma__badge marcas-plataforma__badge--por-vencer">Por vencer</span>;
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
  const [marcaDetalle, setMarcaDetalle] = useState(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);

  async function abrirDetalleMarca(marca) {
    setMarcaDetalle(marca);
    setCargandoDetalle(true);
    try {
      const fresca = await obtenerMarcaPlataforma(marca.id);
      setMarcaDetalle(fresca);
    } catch {
      setMarcaDetalle(marca);
    } finally {
      setCargandoDetalle(false);
    }
  }

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
      if (marcaDetalle?.id === marca.id) {
        const actualizadas = await listarMarcasPlataforma();
        setMarcaDetalle(actualizadas.find((m) => m.id === marca.id) ?? null);
      }
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
            Lista de todas las empresas que gestionas. Toca el icono de cada marca para ver plan,
            enlaces, admin y acciones.
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

      <section className="marcas-plataforma__lista-seccion">
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
          <ul className="marcas-plataforma__lista">
            {marcasFiltradas.map((marca) => (
              <li key={marca.id} className="marcas-plataforma__item">
                <div className="marcas-plataforma__item-info">
                  <strong className="marcas-plataforma__nombre">{marca.nombreComercial}</strong>
                  <EstadoBadgeCompacto
                    activa={marca.activa}
                    planHabilitado={marca.planHabilitado}
                    suscripcion={marca.suscripcion}
                  />
                </div>
                <button
                  type="button"
                  className="marcas-plataforma__ver-detalle"
                  onClick={() => abrirDetalleMarca(marca)}
                  aria-label={`Ver detalle de ${marca.nombreComercial}`}
                >
                  <IconoApp nombre="ojo" tamano="md" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ModalDetalleMarcaPlataforma
        marca={marcaDetalle}
        abierto={Boolean(marcaDetalle)}
        cargando={cargandoDetalle}
        onCerrar={() => setMarcaDetalle(null)}
        entrandoPanel={entrandoPanel}
        onEntrarPanel={entrarPanelMarca}
        onToggleActiva={(marca) => toggleCampo(marca, 'activa')}
        onTogglePlan={(marca) => toggleCampo(marca, 'plan')}
      />
    </div>
  );
}
