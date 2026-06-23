import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  MensajeError,
  TarjetaServicio,
} from '../../../compartido/componentes';
import {
  actualizarServicio,
  crearServicio,
  obtenerServiciosAdmin,
} from '../../../modulos/reservas/servicios/serviciosServicio';
import '../../../estilos/admin/servicios/servicios.css';

const FORM_VACIO = {
  nombre: '',
  descripcion: '',
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

  async function manejarEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const payload = {
      nombre: form.nombre.trim(),
      descripcion: form.descripcion.trim() || null,
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

  return (
    <div className="servicios-admin">
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
                <div key={servicio.id} className="servicios-admin__item">
                  <TarjetaServicio servicio={servicio} />
                  <div className="servicios-admin__acciones">
                    {!servicio.activo && <span className="badge-fase">Inactivo</span>}
                    <BotonPrincipal variante="secundario" onClick={() => abrirEditar(servicio)}>
                      Editar
                    </BotonPrincipal>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
