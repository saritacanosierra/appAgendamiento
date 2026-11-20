import { useEffect, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  ImagenAmpliable,
  InputTexto,
  MensajeError,
  ModalConfirmacion,
  TextareaTexto,
} from '../../../compartido/componentes';
import {
  actualizarBlogPlataforma,
  crearBlogPlataforma,
  eliminarBlogPlataforma,
  listarBlogPlataforma,
  subirImagenBlogPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/blog/blog.css';

const FORM_VACIO = {
  titulo: '',
  extracto: '',
  contenido: '',
  categoria: '',
  estado: 'publicado',
  imagenDestacada: '',
};

export default function BlogPlataformaVista() {
  const [publicaciones, setPublicaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(FORM_VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [aEliminar, setAEliminar] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      setPublicaciones(await listarBlogPlataforma());
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
      const ruta = await subirImagenBlogPlataforma(archivo);
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
      if (editandoId) await actualizarBlogPlataforma(editandoId, payload);
      else await crearBlogPlataforma(payload);
      cerrarForm();
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function confirmarEliminar() {
    if (!aEliminar) return;
    setError(null);
    try {
      await eliminarBlogPlataforma(aEliminar.id);
      setAEliminar(null);
      await cargar();
    } catch (err) {
      setAEliminar(null);
      setError(err.message);
    }
  }

  return (
    <div className="blog-plataforma">
      <header className="blog-plataforma__cabecera">
        <div>
          <h1>Blog de la app</h1>
          <p>
            Lo que publiques aquí sale en el blog de cada marca, también en una tienda nueva. El propietario de la marca lo ve y no puede editarlo ni borrarlo.
          </p>
        </div>
        <BotonPrincipal onClick={mostrarForm ? cerrarForm : abrirCrear}>
          {mostrarForm ? 'Cerrar' : 'Nueva publicación'}
        </BotonPrincipal>
      </header>

      {mostrarForm && (
        <form className="blog-plataforma__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar publicación' : 'Nueva publicación'}</h2>
          <CampoFormulario etiqueta="Título" id="blog-app-titulo" requerido>
            <InputTexto
              id="blog-app-titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Extracto" id="blog-app-extracto">
            <textarea
              id="blog-app-extracto"
              value={form.extracto}
              onChange={(e) => setForm({ ...form, extracto: e.target.value })}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Contenido" id="blog-app-contenido" requerido>
            <TextareaTexto
              id="blog-app-contenido"
              rows={8}
              value={form.contenido}
              onChange={(e) => setForm({ ...form, contenido: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Categoría" id="blog-app-categoria">
            <InputTexto
              id="blog-app-categoria"
              value={form.categoria}
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Estado" id="blog-app-estado">
            <select
              id="blog-app-estado"
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="publicado">Publicado</option>
              <option value="borrador">Borrador</option>
            </select>
          </CampoFormulario>
          <CampoFormulario etiqueta="Imagen destacada" id="blog-app-imagen">
            <input id="blog-app-imagen" type="file" accept="image/*" onChange={manejarImagen} />
            {subiendoImagen && <p>Subiendo imagen...</p>}
            {form.imagenDestacada && (
              <ImagenAmpliable src={form.imagenDestacada} alt="Vista previa" className="blog-plataforma__preview" />
            )}
          </CampoFormulario>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando}>
            {enviando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Publicar'}
          </BotonPrincipal>
        </form>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && (
        <ul className="blog-plataforma__lista">
          {publicaciones.length === 0 ? (
            <li className="blog-plataforma__vacio">Todavía no hay publicaciones de la app.</li>
          ) : (
            publicaciones.map((pub) => (
              <li key={pub.id} className="blog-plataforma__item">
                <div>
                  <strong>{pub.titulo}</strong>
                  <span className={`blog-plataforma__estado blog-plataforma__estado--${pub.estado}`}>
                    {pub.estado === 'publicado' ? 'Publicado' : 'Borrador'}
                  </span>
                </div>
                <div className="blog-plataforma__acciones">
                  <BotonPrincipal variante="secundario" onClick={() => abrirEditar(pub)}>
                    Editar
                  </BotonPrincipal>
                  <BotonPrincipal variante="secundario" onClick={() => setAEliminar(pub)}>
                    Eliminar
                  </BotonPrincipal>
                </div>
              </li>
            ))
          )}
        </ul>
      )}

      <ModalConfirmacion
        abierto={Boolean(aEliminar)}
        titulo="Eliminar publicación"
        mensaje={aEliminar ? `Se quita «${aEliminar.titulo}» del blog de todas las marcas.` : ''}
        textoConfirmar="Eliminar"
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => setAEliminar(null)}
      />
    </div>
  );
}
