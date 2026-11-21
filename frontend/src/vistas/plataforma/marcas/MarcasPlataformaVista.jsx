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
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { guardarTokenMarca, marcarImpersonacion } from '../../../compartido/utilidades/tokenSesion';
import {
  actualizarMarcaPlataforma,
  crearMarcaPlataforma,
  eliminarMarcaPlataforma,
  impersonarMarcaPlataforma,
  listarMarcasPlataforma,
  obtenerMarcaPlataforma,
  listarCopiasMarca,
  listarCopiasPlataforma,
  guardarCopiaMarca,
  subirCopiaMarca,
  descargarCopiaMarca,
  eliminarCopiaPlataforma,
  restaurarCopiaMarca,
  restaurarCopiaDeMarca,
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
  const [eliminando, setEliminando] = useState(false);
  const [copias, setCopias] = useState([]);
  const [cargandoCopias, setCargandoCopias] = useState(false);
  const [guardandoCopia, setGuardandoCopia] = useState(false);
  const [restaurandoCopia, setRestaurandoCopia] = useState(false);
  const [copiasHuerfanas, setCopiasHuerfanas] = useState([]);
  const [huerfanaPendiente, setHuerfanaPendiente] = useState(null);
  const [eliminandoCopia, setEliminandoCopia] = useState(false);

  async function abrirDetalleMarca(marca) {
    setMarcaDetalle(marca);
    setCargandoDetalle(true);
    setCopias([]);
    setCargandoCopias(true);
    try {
      const fresca = await obtenerMarcaPlataforma(marca.id);
      setMarcaDetalle(fresca);
    } catch {
      setMarcaDetalle(marca);
    } finally {
      setCargandoDetalle(false);
    }
    try {
      setCopias(await listarCopiasMarca(marca.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setCargandoCopias(false);
    }
  }

  async function cargarCopiasHuerfanas() {
    try {
      const todas = await listarCopiasPlataforma();
      setCopiasHuerfanas(todas.filter((copia) => !copia.existeMarca));
    } catch {
      setCopiasHuerfanas([]);
    }
  }

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setMarcas(await listarMarcasPlataforma());
      await cargarCopiasHuerfanas();
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

  async function eliminarMarca(marca) {
    setEliminando(true);
    setError(null);
    try {
      await eliminarMarcaPlataforma(marca.id);
      setMarcaDetalle(null);
      setMensaje(`${marca.nombreComercial} fue eliminada. Si guardaste una copia, puedes volver a crearla sin tocar las demás.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  }

  async function guardarCopia(marca) {
    setGuardandoCopia(true);
    setError(null);
    try {
      const copia = await guardarCopiaMarca(marca.id);
      try {
        await descargarCopiaMarca(copia.archivo, `${marca.slug}-copia.json`);
      } catch {
        // La copia ya quedó guardada aunque el navegador no descargue el archivo.
      }
      setCopias(await listarCopiasMarca(marca.id));
      setMensaje(`Copia de ${marca.nombreComercial} guardada. Solo incluye esa empresa.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoCopia(false);
    }
  }

  async function descargarCopia(copia) {
    setError(null);
    try {
      await descargarCopiaMarca(copia.archivo, `${copia.slug}-copia.json`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function restaurarCopia(copia) {
    if (!marcaDetalle) return;
    setRestaurandoCopia(true);
    setError(null);
    try {
      const restauracion = await restaurarCopiaDeMarca(marcaDetalle.id, copia.archivo);
      const fresca = await obtenerMarcaPlataforma(restauracion.marcaId);
      setMarcaDetalle(fresca);
      setCopias(await listarCopiasMarca(restauracion.marcaId));
      setMensaje(`${restauracion.nombre} volvió a la copia: ${restauracion.clientes} clientas y ${restauracion.citas} citas. Las demás empresas no cambiaron.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setRestaurandoCopia(false);
    }
  }

  async function subirCopia(archivo) {
    setGuardandoCopia(true);
    setError(null);
    try {
      const copia = await subirCopiaMarca(archivo);
      if (!marcaDetalle || copia.marcaId !== marcaDetalle.id) {
        setMensaje(`Esa copia es de ${copia.nombre}. Quedó guardada para esa empresa y no se aplicó aquí.`);
        await cargarCopiasHuerfanas();
        return;
      }
      setCopias(await listarCopiasMarca(marcaDetalle.id));
      setMensaje(`Copia de ${copia.nombre} subida. Si la restauras, solo cambia esa empresa.`);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoCopia(false);
    }
  }

  async function eliminarHuerfana(copia) {
    setEliminandoCopia(true);
    setError(null);
    try {
      await eliminarCopiaPlataforma(copia.archivo);
      setHuerfanaPendiente(null);
      setMensaje(`La copia de ${copia.nombre} se eliminó. Ya no se puede restaurar.`);
      await cargarCopiasHuerfanas();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminandoCopia(false);
    }
  }

  async function restaurarHuerfana(copia) {
    setRestaurandoCopia(true);
    setError(null);
    try {
      const restauracion = await restaurarCopiaMarca(copia.archivo);
      setHuerfanaPendiente(null);
      setMensaje(`${restauracion.nombre} volvió a la copia: ${restauracion.clientes} clientas y ${restauracion.citas} citas. Las demás empresas no cambiaron.`);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setRestaurandoCopia(false);
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

      {copiasHuerfanas.length > 0 && (
        <section className="marcas-plataforma__copias">
          <h3>Copias de empresas que ya no están</h3>
          <p>Restaurar vuelve a crear solo esa empresa. La papelera borra la copia y ya no se puede recuperar.</p>
          <ul>
            {copiasHuerfanas.map((copia) => {
              const pendiente = huerfanaPendiente?.archivo === copia.archivo ? huerfanaPendiente.accion : null;
              const ocupada = restaurandoCopia || eliminandoCopia;
              return (
                <li key={copia.archivo}>
                  <div>
                    <strong>{copia.nombre}</strong>
                    <span>{copia.clientes} clientas · {copia.citas} citas</span>
                  </div>
                  {pendiente === 'restaurar' ? (
                    <div className="marcas-plataforma__copia-confirmar">
                      <p>Se vuelve a crear {copia.nombre} con esta copia. Las demás empresas quedan igual.</p>
                      <button type="button" onClick={() => setHuerfanaPendiente(null)} disabled={ocupada}>
                        Cancelar
                      </button>
                      <button type="button" onClick={() => restaurarHuerfana(copia)} disabled={ocupada}>
                        {restaurandoCopia ? 'Restaurando...' : 'Restaurar esta empresa'}
                      </button>
                    </div>
                  ) : pendiente === 'eliminar' ? (
                    <div className="marcas-plataforma__copia-confirmar marcas-plataforma__copia-confirmar--peligro">
                      <p>Se borra la copia de {copia.nombre}. Esa empresa ya no se puede volver a crear desde aquí.</p>
                      <button type="button" onClick={() => setHuerfanaPendiente(null)} disabled={ocupada}>
                        Cancelar
                      </button>
                      <button type="button" onClick={() => eliminarHuerfana(copia)} disabled={ocupada}>
                        {eliminandoCopia ? 'Eliminando...' : 'Eliminar esta copia'}
                      </button>
                    </div>
                  ) : (
                    <div className="marcas-plataforma__copia-acciones">
                      <button type="button" onClick={() => setHuerfanaPendiente({ archivo: copia.archivo, accion: 'restaurar' })}>
                        Restaurar
                      </button>
                      <button
                        type="button"
                        className="marcas-plataforma__copia-papelera"
                        onClick={() => setHuerfanaPendiente({ archivo: copia.archivo, accion: 'eliminar' })}
                        aria-label={`Eliminar la copia de ${copia.nombre}`}
                        title="Eliminar esta copia"
                      >
                        <IconoApp nombre="eliminar" tamano="md" />
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <ModalDetalleMarcaPlataforma
        marca={marcaDetalle}
        abierto={Boolean(marcaDetalle)}
        cargando={cargandoDetalle}
        onCerrar={() => setMarcaDetalle(null)}
        entrandoPanel={entrandoPanel}
        onEntrarPanel={entrarPanelMarca}
        onToggleActiva={(marca) => toggleCampo(marca, 'activa')}
        onTogglePlan={(marca) => toggleCampo(marca, 'plan')}
        eliminando={eliminando}
        onEliminar={eliminarMarca}
        copias={copias}
        cargandoCopias={cargandoCopias}
        guardandoCopia={guardandoCopia}
        restaurandoCopia={restaurandoCopia}
        onGuardarCopia={guardarCopia}
        onDescargarCopia={descargarCopia}
        onRestaurarCopia={restaurarCopia}
        onSubirCopia={subirCopia}
      />
    </div>
  );
}
