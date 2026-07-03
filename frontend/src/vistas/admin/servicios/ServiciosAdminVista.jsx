import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  ImagenAmpliable,
  InputTexto,
  MensajeError,
  ModalConfirmacion,
  TarjetaServicio,
  TextareaTexto,
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
  tipo: 'marca',
  ordenVisualizacion: '0',
};

const FILTROS_TIPO = [
  { id: 'todos', etiqueta: 'Todos' },
  { id: 'marca', etiqueta: 'Reservas' },
  { id: 'adicional', etiqueta: 'Adicionales' },
];

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
  const [filtroTipo, setFiltroTipo] = useState('todos');

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

  function abrirCrear(tipo = 'marca') {
    setEditandoId(null);
    setForm({
      ...FORM_VACIO,
      tipo,
      duracionMinutos: tipo === 'adicional' ? '0' : '60',
    });
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
      tipo: servicio.tipo ?? 'marca',
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

    const vistaPreviaLocal = URL.createObjectURL(archivo);
    setForm((prev) => ({ ...prev, imagenRuta: vistaPreviaLocal }));

    setSubiendoImagen(true);
    setError(null);
    try {
      const { ruta } = await subirImagenAdmin('servicios', archivo);
      setForm((prev) => ({ ...prev, imagenRuta: ruta }));
    } catch (err) {
      setForm((prev) => ({ ...prev, imagenRuta: '' }));
      setError(err.message);
    } finally {
      URL.revokeObjectURL(vistaPreviaLocal);
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
      duracion_minutos: form.tipo === 'adicional' ? 0 : Number(form.duracionMinutos),
      precio: Number(form.precio),
      activo: form.activo,
      tipo: form.tipo,
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

  const serviciosFiltrados =
    filtroTipo === 'todos'
      ? servicios
      : servicios.filter((s) => (s.tipo ?? 'marca') === filtroTipo);

  const esAdicional = form.tipo === 'adicional';

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
          <p>Servicios de reserva (agenda pública) y adicionales (cargos rápidos en Atención). Solo de tu marca.</p>
        </div>
        <div className="servicios-admin__cabecera-acciones">
          <BotonPrincipal variante="secundario" onClick={() => abrirCrear('adicional')}>
            + Adicional
          </BotonPrincipal>
          <BotonPrincipal onClick={mostrarForm ? cerrarForm : () => abrirCrear('marca')}>
            {mostrarForm ? 'Cerrar' : '+ Servicio reserva'}
          </BotonPrincipal>
        </div>
      </header>

      <div className="servicios-admin__filtros" role="tablist" aria-label="Filtrar por tipo">
        {FILTROS_TIPO.map((filtro) => (
          <button
            key={filtro.id}
            type="button"
            role="tab"
            aria-selected={filtroTipo === filtro.id}
            className={`servicios-admin__filtro${filtroTipo === filtro.id ? ' servicios-admin__filtro--activo' : ''}`}
            onClick={() => setFiltroTipo(filtro.id)}
          >
            {filtro.etiqueta}
          </button>
        ))}
      </div>

      {mostrarForm && (
        <form className="servicios-admin__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar servicio' : esAdicional ? 'Nuevo adicional' : 'Nuevo servicio de reserva'}</h2>
          <CampoFormulario etiqueta="Tipo" id="sv-tipo" requerido>
            <select
              id="sv-tipo"
              value={form.tipo}
              onChange={(e) => {
                const tipo = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  tipo,
                  duracionMinutos: tipo === 'adicional' ? '0' : prev.duracionMinutos === '0' ? '60' : prev.duracionMinutos,
                }));
              }}
            >
              <option value="marca">Servicio de reserva (marca)</option>
              <option value="adicional">Servicio adicional (Atención)</option>
            </select>
          </CampoFormulario>
          <CampoFormulario etiqueta="Nombre" id="sv-nombre" requerido>
            <InputTexto
              id="sv-nombre"
              value={form.nombre}
              onChange={(e) => actualizarCampo('nombre', e.target.value)}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Descripcion" id="sv-desc">
            <TextareaTexto
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
            {!esAdicional && (
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
            )}
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
              {esAdicional
                ? 'Disponible como botón rápido en Atención'
                : 'Visible en reservas publicas'}
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
          {serviciosFiltrados.length === 0 ? (
            <p className="servicios-admin__vacio">
              {filtroTipo === 'adicional'
                ? 'No hay servicios adicionales. Crea uno con + Adicional.'
                : 'No hay servicios registrados.'}
            </p>
          ) : (
            <div className="servicios-admin__lista">
              {serviciosFiltrados.map((servicio) => (
                <TarjetaServicio
                  key={servicio.id}
                  servicio={servicio}
                  acciones={
                    <>
                      {(servicio.tipo ?? 'marca') === 'adicional' ? (
                        <span className="servicios-admin__badge servicios-admin__badge--adicional">
                          Adicional
                        </span>
                      ) : (
                        <span className="servicios-admin__badge servicios-admin__badge--marca">
                          Reserva
                        </span>
                      )}
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
