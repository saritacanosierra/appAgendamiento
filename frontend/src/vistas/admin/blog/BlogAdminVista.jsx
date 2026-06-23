import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  ImagenAmpliable,
  MensajeError,
} from '../../../compartido/componentes';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import {
  actualizarPublicacion,
  crearPublicacion,
  listarBlogAdmin,
} from '../../../modulos/blog/servicios/blogServicio';
import '../../../estilos/admin/blog/blog.css';
import '../../../estilos/admin/comun/aviso-carrusel.css';

const FORM_VACIO = {
  titulo: '',
  extracto: '',
  contenido: '',
  categoria: '',
  estado: 'borrador',
  imagenDestacada: '',
};

export default function BlogAdminVista() {
  const [publicaciones, setPublicaciones] = useState([]);
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
      setPublicaciones(await listarBlogAdmin());
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

  function abrirEditar(pub) {
    setEditandoId(pub.id);
    setForm({
      titulo: pub.titulo,
      extracto: pub.extracto ?? '',
      contenido: pub.contenido ?? '',
      categoria: pub.categoria ?? '',
      estado: pub.estado,
      imagenDestacada: pub.imagenDestacada ?? '',
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
      const { ruta } = await subirImagenAdmin('blog', archivo);
      setForm((prev) => ({ ...prev, imagenDestacada: ruta }));
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
      extracto: form.extracto.trim() || null,
      contenido: form.contenido.trim(),
      categoria: form.categoria.trim() || null,
      estado: form.estado,
      imagen_destacada: form.imagenDestacada || null,
    };

    try {
      if (editandoId) {
        await actualizarPublicacion(editandoId, payload);
      } else {
        await crearPublicacion(payload);
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
    <div className="blog-admin">
      <header className="blog-admin__cabecera">
        <h1>Blog</h1>
        <BotonPrincipal onClick={mostrarForm ? cerrarForm : abrirCrear}>
          {mostrarForm ? 'Cerrar' : '+ Nueva publicacion'}
        </BotonPrincipal>
      </header>

      {!mostrarForm && (
        <p className="admin-aviso-carrusel">
          El blog es independiente del carrusel. Para fotos del inicio ve a{' '}
          <Link to={RUTAS_ADMIN.carruselInicio}>Carrusel</Link>.
        </p>
      )}

      {mostrarForm && (
        <form className="blog-admin__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar publicacion' : 'Nueva publicacion'}</h2>
          <CampoFormulario etiqueta="Titulo" id="blog-titulo" requerido>
            <input
              id="blog-titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Extracto" id="blog-extracto">
            <textarea
              id="blog-extracto"
              value={form.extracto}
              onChange={(e) => setForm({ ...form, extracto: e.target.value })}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Contenido (HTML simple)" id="blog-contenido" requerido>
            <textarea
              id="blog-contenido"
              rows={8}
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              required
            />
          </CampoFormulario>
          <div className="blog-admin__fila">
            <CampoFormulario etiqueta="Categoria" id="blog-categoria">
              <input
                id="blog-categoria"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Estado" id="blog-estado">
              <select
                id="blog-estado"
                value={form.estado}
                onChange={(e) => setForm({ ...form, estado: e.target.value })}
              >
                <option value="borrador">Borrador</option>
                <option value="publicado">Publicado</option>
              </select>
            </CampoFormulario>
          </div>
          <CampoFormulario etiqueta="Imagen destacada" id="blog-imagen">
            <input id="blog-imagen" type="file" accept="image/*" onChange={manejarImagen} />
            {subiendoImagen && <p className="blog-admin__hint">Subiendo imagen...</p>}
            {form.imagenDestacada && (
              <ImagenAmpliable src={form.imagenDestacada} alt="Vista previa" className="blog-admin__preview" />
            )}
          </CampoFormulario>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear publicacion'}
          </BotonPrincipal>
        </form>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && (
        <ul className="blog-admin__lista">
          {publicaciones.length === 0 ? (
            <li className="blog-admin__vacio">No hay publicaciones.</li>
          ) : (
            publicaciones.map((pub) => (
              <li key={pub.id} className="blog-admin__item">
                <div>
                  <strong>{pub.titulo}</strong>
                  <span className={`blog-admin__estado blog-admin__estado--${pub.estado}`}>
                    {pub.estado}
                  </span>
                  {pub.categoria && <span className="blog-admin__meta">{pub.categoria}</span>}
                </div>
                <BotonPrincipal variante="secundario" onClick={() => abrirEditar(pub)}>
                  Editar
                </BotonPrincipal>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
