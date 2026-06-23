import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  ImagenAmpliable,
  MensajeError,
  ModalConfirmacion,
  TarjetaServicio,
  IconoApp,
} from '../../../compartido/componentes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import {
  actualizarServicio,
  crearServicio,
  eliminarServicio,
  obtenerServiciosAdmin,
} from '../../../modulos/reservas/servicios/serviciosServicio';
import '../../../estilos/admin/servicios/servicios.css';

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
  imagenRuta: '',
  duracionMinutos: '60',
  precio: '',
  activo: true,
  ordenVisualizacion: '0',
};

export default function ServiciosAdminVista() {
  const [servicios, setServicios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [servicioAEliminar, setServicioAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setServicios(await obtenerServiciosAdmin());
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  function abrirCrear() {
    setEditandoId(null);
    setForm(FORM_VACIO);
    setMostrarForm(true);
  }

  function abrirEditar(servicio) {
    setEditandoId(servicio.id);
    setForm({
      nombre: servicio.nombre,
      descripcion: servicio.descripcion ?? '',
      imagenRuta: servicio.imagenRuta ?? '',
      duracionMinutos: String(servicio.duracionMinutos),
      precio: String(servicio.precio),
      activo: servicio.activo,
      ordenVisualizacion: String(servicio.ordenVisualizacion ?? 0),
    });
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
  }

  function actualizarCampo(campo, valor) {
    setForm((prev) => ({ ...prev, [campo]: valor }));
  }

  async function manejarImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagen(true);
    setError(null);
    try {
      const { ruta } = await subirImagenAdmin('servicios', archivo);
      setForm((prev) => ({ ...prev, imagenRuta: ruta }));
    } catch (err) {
      setError(err.message);
    } finally {
      setSubiendoImagen(false);
    }
  }

  async function manejarEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
      imagen_ruta: form.imagenRuta.trim() || null,
      duracion_minutos: Number(form.duracionMinutos),
      precio: Number(form.precio),
      activo: form.activo,
      orden_visualizacion: Number(form.ordenVisualizacion) || 0,
    };

    try {
      if (editandoId) {
        await actualizarServicio(editandoId, payload);
      } else {
        await crearServicio(payload);
      }
      cerrarForm();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarEliminar() {
    if (!servicioAEliminar) return;

    setEliminando(true);
    setError(null);
    try {
      await eliminarServicio(servicioAEliminar.id);
      setServicioAEliminar(null);
      if (editandoId === servicioAEliminar.id) {
        cerrarForm();
      }
      await cargar();
    } catch (err) {
      setError(err.message);
      setServicioAEliminar(null);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="servicios-admin">
      <ModalConfirmacion
        abierto={Boolean(servicioAEliminar)}
        titulo="Eliminar servicio"
        mensaje={
          servicioAEliminar
            ? `¿Eliminar "${servicioAEliminar.nombre}"? Esta accion no se puede deshacer.`
            : ''
        }
        textoConfirmar={eliminando ? 'Eliminando...' : 'Si, eliminar'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => !eliminando && setServicioAEliminar(null)}
      />

      <header className="servicios-admin__cabecera">
        <div>
          <h1>Servicios de tu marca</h1>
          <p>Solo ves servicios asociados a tu sesion — aislamiento multi-marca activo.</p>
        </div>
        <BotonPrincipal onClick={mostrarForm ? cerrarForm : abrirCrear}>
          {mostrarForm ? 'Cerrar' : '+ Nuevo servicio'}
        </BotonPrincipal>
      </header>

      {mostrarForm && (
        <form className="servicios-admin__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
          <CampoFormulario etiqueta="Nombre" id="sv-nombre" requerido>
            <input
              id="sv-nombre"
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Descripcion" id="sv-desc">
            <textarea
              id="sv-desc"
              value={form.descripcion}
              onChange={(e) => actualizarCampo('descripcion', e.target.value)}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Imagen del servicio" id="sv-imagen">
            <input id="sv-imagen" type="file" accept="image/*" onChange={manejarImagen} />
            {subiendoImagen && <p className="servicios-admin__hint">Subiendo imagen...</p>}
            {form.imagenRuta && (
              <ImagenAmpliable
                src={form.imagenRuta}
                alt="Vista previa del servicio"
                className="servicios-admin__preview"
              />
            )}
          </CampoFormulario>
          <div className="servicios-admin__fila">
            <CampoFormulario etiqueta="Duracion (min)" id="sv-duracion" requerido>
              <input
                id="sv-duracion"
                type="number"
                min="5"
                max="480"
                value={form.duracionMinutos}
                onChange={(e) => actualizarCampo('duracionMinutos', e.target.value)}
                required
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Precio" id="sv-precio" requerido>
              <input
                id="sv-precio"
                type="number"
                min="0"
                step="0.01"
                value={form.precio}
                onChange={(e) => actualizarCampo('precio', e.target.value)}
                required
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Orden" id="sv-orden">
              <input
                id="sv-orden"
                type="number"
                min="0"
                value={form.ordenVisualizacion}
                onChange={(e) => actualizarCampo('ordenVisualizacion', e.target.value)}
              />
            </CampoFormulario>
          </div>
          <CampoFormulario etiqueta="Activo" id="sv-activo">
            <label className="servicios-admin__checkbox">
              <input
                id="sv-activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) => actualizarCampo('activo', e.target.checked)}
              />
              Visible en reservas publicas
            </label>
          </CampoFormulario>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Guardando...' : editandoId ? 'Actualizar servicio' : 'Crear servicio'}
          </BotonPrincipal>
        </form>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && (
        <>
          {servicios.length === 0 ? (
            <p className="servicios-admin__vacio">No hay servicios registrados.</p>
          ) : (
            <div className="servicios-admin__lista">
              {servicios.map((servicio) => (
                <TarjetaServicio
                  key={servicio.id}
                  servicio={servicio}
                  acciones={
                    <>
                      {!servicio.activo && <span className="badge-fase">Inactivo</span>}
                      <div className="servicios-admin__acciones">
                        <button
                          type="button"
                          className="servicios-admin__accion-icono servicios-admin__accion-icono--editar"
                          onClick={() => abrirEditar(servicio)}
                          aria-label={`Editar ${servicio.nombre}`}
                          title="Editar"
                        >
                          <IconoApp nombre="editar" tamano="sm" />
                        </button>
                        <button
                          type="button"
                          className="servicios-admin__accion-icono servicios-admin__accion-icono--eliminar"
                          onClick={() => setServicioAEliminar(servicio)}
                          aria-label={`Eliminar ${servicio.nombre}`}
                          title="Eliminar"
                        >
                          <IconoApp nombre="eliminar" tamano="sm" />
                        </button>
                      </div>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
