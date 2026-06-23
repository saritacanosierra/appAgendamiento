import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  MensajeError,
} from '../../../compartido/componentes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import {
  actualizarDiseno,
  crearDiseno,
  listarGaleriaAdmin,
} from '../../../modulos/galeria/servicios/galeriaServicio';
import '../../../estilos/admin/galeria/galeria.css';

const FORM_VACIO = {
  titulo: '',
  categoria: '',
  colores: '',
  imagenRuta: '',
  activo: true,
  ordenVisualizacion: '0',
};

export default function GaleriaAdminVista() {
  const [disenos, setDisenos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [enviando, setEnviando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setDisenos(await listarGaleriaAdmin());
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

  function abrirEditar(diseno) {
    setEditandoId(diseno.id);
    setForm({
      titulo: diseno.titulo,
      categoria: diseno.categoria ?? '',
      colores: (diseno.coloresRelacionados ?? []).join(', '),
      imagenRuta: diseno.imagenRuta,
      activo: diseno.activo,
      ordenVisualizacion: String(diseno.ordenVisualizacion ?? 0),
    });
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(FORM_VACIO);
  }

  async function manejarImagen(e) {
    const archivo = e.target.files?.[0];
    if (!archivo) return;

    setSubiendoImagen(true);
    setError(null);
    try {
      const { ruta } = await subirImagenAdmin('galeria', archivo);
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
      titulo: form.titulo.trim(),
      categoria: form.categoria.trim() || null,
      colores_relacionados: form.colores.trim() || null,
      imagen_ruta: form.imagenRuta,
      activo: form.activo,
      orden_visualizacion: Number(form.ordenVisualizacion) || 0,
    };

    try {
      if (editandoId) {
        await actualizarDiseno(editandoId, payload);
      } else {
        await crearDiseno(payload);
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
    <div className="galeria-admin">
      <header className="galeria-admin__cabecera">
        <h1>Galeria</h1>
        <BotonPrincipal onClick={mostrarForm ? cerrarForm : abrirCrear}>
          {mostrarForm ? 'Cerrar' : '+ Nuevo diseno'}
        </BotonPrincipal>
      </header>

      {mostrarForm && (
        <form className="galeria-admin__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar diseno' : 'Nuevo diseno'}</h2>
          <CampoFormulario etiqueta="Titulo" id="gal-titulo" requerido>
            <input
              id="gal-titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Imagen" id="gal-imagen" requerido>
            <input id="gal-imagen" type="file" accept="image/*" onChange={manejarImagen} />
            {subiendoImagen && <p className="galeria-admin__hint">Subiendo imagen...</p>}
            {form.imagenRuta && (
              <img src={form.imagenRuta} alt="" className="galeria-admin__preview" />
            )}
          </CampoFormulario>
          <div className="galeria-admin__fila">
            <CampoFormulario etiqueta="Categoria" id="gal-categoria">
              <input
                id="gal-categoria"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Colores (separados por coma)" id="gal-colores">
              <input
                id="gal-colores"
                value={form.colores}
                onChange={(e) => setForm({ ...form, colores: e.target.value })}
                placeholder="rosa, blanco, nude"
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Orden" id="gal-orden">
              <input
                id="gal-orden"
                type="number"
                min="0"
                value={form.ordenVisualizacion}
                onChange={(e) => setForm({ ...form, ordenVisualizacion: e.target.value })}
              />
            </CampoFormulario>
          </div>
          <CampoFormulario etiqueta="Activo" id="gal-activo">
            <label className="galeria-admin__checkbox">
              <input
                id="gal-activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Visible en la galeria publica
            </label>
          </CampoFormulario>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando || !form.imagenRuta}>
            {enviando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear diseno'}
          </BotonPrincipal>
        </form>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && (
        <div className="galeria-admin__grid">
          {disenos.length === 0 ? (
            <p className="galeria-admin__vacio">No hay disenos registrados.</p>
          ) : (
            disenos.map((diseno) => (
              <article key={diseno.id} className="galeria-admin__item">
                <img src={diseno.imagenRuta} alt={diseno.titulo} />
                <div className="galeria-admin__item-info">
                  <strong>{diseno.titulo}</strong>
                  {!diseno.activo && <span className="badge-fase">Inactivo</span>}
                  <BotonPrincipal variante="secundario" onClick={() => abrirEditar(diseno)}>
                    Editar
                  </BotonPrincipal>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
