import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  ImagenAmpliable,
  MensajeError,
} from '../../../compartido/componentes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import {
  actualizarDiapositivaCarrusel,
  crearDiapositivaCarrusel,
  listarCarruselAdmin,
} from '../../../modulos/carrusel/servicios/carruselServicio';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import '../../../estilos/admin/carrusel/carrusel-admin.css';

const FORM_VACIO = {
  titulo: '',
  subtitulo: '',
  imagenRuta: '',
  enlaceUrl: '',
  activo: true,
  ordenVisualizacion: '0',
};

export default function CarruselAdminVista() {
  const { marca } = useAuth();
  const [diapositivas, setDiapositivas] = useState([]);
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
      setDiapositivas(await listarCarruselAdmin());
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

  function abrirEditar(item) {
    setEditandoId(item.id);
    setForm({
      titulo: item.titulo,
      subtitulo: item.subtitulo ?? '',
      imagenRuta: item.imagenRuta,
      enlaceUrl: item.enlaceUrl ?? '',
      activo: item.activo,
      ordenVisualizacion: String(item.ordenVisualizacion ?? 0),
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
      const { ruta } = await subirImagenAdmin('carrusel', archivo);
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
      subtitulo: form.subtitulo.trim() || null,
      imagen_ruta: form.imagenRuta,
      enlace_url: form.enlaceUrl.trim() || null,
      activo: form.activo,
      orden_visualizacion: Number(form.ordenVisualizacion) || 0,
    };

    try {
      if (editandoId) {
        await actualizarDiapositivaCarrusel(editandoId, payload);
      } else {
        await crearDiapositivaCarrusel(payload);
      }
      cerrarForm();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  const slug = marca?.slug;

  return (
    <div className="carrusel-admin">
      <header className="carrusel-admin__cabecera">
        <div>
          <h1>Carrusel del inicio</h1>
          <p className="carrusel-admin__intro">
            Sube las fotos y textos que verán tus clientes en el carrusel de la pantalla de inicio.
          </p>
        </div>
        <BotonPrincipal onClick={mostrarForm ? cerrarForm : abrirCrear}>
          {mostrarForm ? 'Cerrar' : '+ Nueva diapositiva'}
        </BotonPrincipal>
      </header>

      {slug && (
        <p className="carrusel-admin__vista-previa">
          <a href={RUTAS_PUBLICAS.inicioMarca(slug)} target="_blank" rel="noopener noreferrer">
            Ver carrusel en la app →
          </a>
        </p>
      )}

      {mostrarForm && (
        <form className="carrusel-admin__formulario tarjeta-app" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar diapositiva' : 'Nueva diapositiva'}</h2>

          <CampoFormulario etiqueta="Titulo" id="car-titulo" requerido>
            <input
              id="car-titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej. Promo verano"
              required
            />
          </CampoFormulario>

          <CampoFormulario etiqueta="Subtitulo (opcional)" id="car-sub">
            <input
              id="car-sub"
              value={form.subtitulo}
              onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
              placeholder="Texto corto sobre la promoción"
            />
          </CampoFormulario>

          <CampoFormulario etiqueta="Imagen del carrusel" id="car-img" requerido>
            <input id="car-img" type="file" accept="image/*" onChange={manejarImagen} />
            {subiendoImagen && <p className="carrusel-admin__subiendo">Subiendo imagen…</p>}
            {form.imagenRuta && (
              <ImagenAmpliable className="carrusel-admin__preview" src={form.imagenRuta} alt="Vista previa" />
            )}
          </CampoFormulario>

          <CampoFormulario etiqueta="Enlace al tocar (opcional)" id="car-link">
            <input
              id="car-link"
              value={form.enlaceUrl}
              onChange={(e) => setForm({ ...form, enlaceUrl: e.target.value })}
              placeholder="/m/tu-marca/citas o https://..."
            />
          </CampoFormulario>

          <div className="carrusel-admin__fila">
            <CampoFormulario etiqueta="Orden" id="car-orden">
              <input
                id="car-orden"
                type="number"
                min="0"
                value={form.ordenVisualizacion}
                onChange={(e) => setForm({ ...form, ordenVisualizacion: e.target.value })}
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Visible" id="car-activo">
              <label className="carrusel-admin__checkbox">
                <input
                  id="car-activo"
                  type="checkbox"
                  checked={form.activo}
                  onChange={(e) => setForm({ ...form, activo: e.target.checked })}
                />
                Mostrar en el carrusel
              </label>
            </CampoFormulario>
          </div>

          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando || !form.imagenRuta}>
            {enviando ? 'Guardando…' : editandoId ? 'Actualizar' : 'Publicar diapositiva'}
          </BotonPrincipal>
        </form>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && !mostrarForm && (
        <div className="carrusel-admin__grid">
          {diapositivas.length === 0 ? (
            <p className="carrusel-admin__vacio">
              Aún no hay fotos en el carrusel. Pulsa <strong>+ Nueva diapositiva</strong> para subir
              la primera.
            </p>
          ) : (
            diapositivas.map((item) => (
              <article key={item.id} className="carrusel-admin__item">
                <ImagenAmpliable src={item.imagenRuta} alt={item.titulo} />
                <div className="carrusel-admin__item-info">
                  <strong>{item.titulo}</strong>
                  {item.subtitulo && <p>{item.subtitulo}</p>}
                  <span className="carrusel-admin__orden">Orden: {item.ordenVisualizacion}</span>
                  {!item.activo && <span className="carrusel-admin__inactivo">Oculta</span>}
                  <BotonPrincipal variante="secundario" onClick={() => abrirEditar(item)}>
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
