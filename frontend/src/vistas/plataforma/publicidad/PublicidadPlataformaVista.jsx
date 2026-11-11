import { useEffect, useState } from 'react';
import { BotonPrincipal, CampoFormulario, Cargando, MensajeError } from '../../../compartido/componentes';
import {
  actualizarPublicidadPlataforma,
  crearPublicidadPlataforma,
  listarPublicacionesParaPublicidad,
  listarPublicidadPlataforma,
  subirImagenPublicidad,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/publicidad/publicidad.css';

const VACIO = {
  anunciante: '',
  titulo: '',
  tipo: 'imagen',
  texto: '',
  enlaceUrl: '',
  imagen: '',
  activa: true,
  orden: 0,
  publicacionIds: [],
};

export default function PublicidadPlataformaVista() {
  const [anuncios, setAnuncios] = useState([]);
  const [publicaciones, setPublicaciones] = useState([]);
  const [formulario, setFormulario] = useState(VACIO);
  const [editandoId, setEditandoId] = useState(null);
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  useEffect(() => {
    Promise.all([
      listarPublicidadPlataforma(),
      listarPublicacionesParaPublicidad(),
    ])
      .then(([lista, posts]) => {
        setAnuncios(lista);
        setPublicaciones(posts);
      })
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, []);

  function cambiar(campo, valor) {
    setFormulario((actual) => ({ ...actual, [campo]: valor }));
  }

  function editar(anuncio) {
    setEditandoId(anuncio.id);
    setArchivo(null);
    setMensaje(null);
    setFormulario({
      anunciante: anuncio.anunciante,
      titulo: anuncio.titulo,
      tipo: anuncio.tipo === 'imagen' ? 'imagen' : 'enlace',
      texto: anuncio.texto ?? '',
      enlaceUrl: anuncio.enlaceUrl ?? '',
      imagen: anuncio.imagen ?? '',
      activa: anuncio.activa,
      orden: anuncio.orden ?? 0,
      publicacionIds: anuncio.publicacionIds ?? [],
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
    setArchivo(null);
    setFormulario(VACIO);
  }

  async function guardar(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    setMensaje(null);

    try {
      let imagen = formulario.imagen;
      if (archivo) imagen = await subirImagenPublicidad(archivo);

      const datos = {
        anunciante: formulario.anunciante,
        titulo: formulario.titulo,
        tipo: formulario.tipo,
        texto: formulario.texto,
        enlace_url: formulario.enlaceUrl,
        imagen,
        activa: formulario.activa,
        orden: Number(formulario.orden) || 0,
        publicacion_ids: formulario.publicacionIds,
      };

      const anuncio = editandoId
        ? await actualizarPublicidadPlataforma(editandoId, datos)
        : await crearPublicidadPlataforma(datos);

      setAnuncios((lista) => {
        const sinActual = lista.filter((item) => item.id !== anuncio.id);
        return [...sinActual, anuncio].sort((a, b) => a.orden - b.orden || b.id - a.id);
      });
      setMensaje(editandoId ? 'Anuncio actualizado.' : 'Anuncio publicado en el blog.');
      cancelarEdicion();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="publicidad-plataforma">
      <header className="publicidad-plataforma__cabecera">
        <h1>Publicidad del blog</h1>
        <p>Puedes crear varias campañas. Cada una es una imagen que abre un enlace, o un enlace suelto, y eliges en qué publicaciones del blog aparece.</p>
      </header>

      {error && <MensajeError mensaje={error} />}
      {mensaje && <p className="publicidad-plataforma__ok">{mensaje}</p>}

      <form className="publicidad-plataforma__formulario" onSubmit={guardar}>
        <CampoFormulario etiqueta="Quien paga" id="pub-anunciante" requerido>
          <input
            id="pub-anunciante"
            value={formulario.anunciante}
            onChange={(e) => cambiar('anunciante', e.target.value)}
            required
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="Titulo" id="pub-titulo" requerido>
          <input
            id="pub-titulo"
            value={formulario.titulo}
            onChange={(e) => cambiar('titulo', e.target.value)}
            required
          />
        </CampoFormulario>
        <fieldset className="publicidad-plataforma__tipos">
          <legend>Tipo de campaña</legend>
          <label>
            <input
              type="radio"
              name="tipo-campana"
              checked={formulario.tipo === 'imagen'}
              onChange={() => cambiar('tipo', 'imagen')}
            />
            Imagen que redirige
          </label>
          <label>
            <input
              type="radio"
              name="tipo-campana"
              checked={formulario.tipo === 'enlace'}
              onChange={() => cambiar('tipo', 'enlace')}
            />
            Enlace, como Amazon
          </label>
        </fieldset>
        <CampoFormulario etiqueta="Texto corto" id="pub-texto">
          <textarea
            id="pub-texto"
            rows={3}
            value={formulario.texto}
            onChange={(e) => cambiar('texto', e.target.value)}
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="Enlace" id="pub-enlace" requerido ayuda="A dónde lleva el clic. Debe empezar por https://">
          <input
            id="pub-enlace"
            type="url"
            value={formulario.enlaceUrl}
            onChange={(e) => cambiar('enlaceUrl', e.target.value)}
            placeholder="https://"
            required
          />
        </CampoFormulario>
        {formulario.tipo === 'imagen' && (
        <CampoFormulario etiqueta="Imagen" id="pub-imagen" requerido={!formulario.imagen}>
          <input
            id="pub-imagen"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={(e) => setArchivo(e.target.files?.[0] ?? null)}
            required={formulario.tipo === 'imagen' && !formulario.imagen}
          />
        </CampoFormulario>
        )}
        <fieldset className="publicidad-plataforma__posts">
          <legend>Sale en estas publicaciones</legend>
          {publicaciones.length === 0 && <p>Aún no hay publicaciones de blog.</p>}
          {publicaciones.map((post) => (
            <label key={post.id}>
              <input
                type="checkbox"
                checked={formulario.publicacionIds.includes(post.id)}
                onChange={() => {
                  const ya = formulario.publicacionIds.includes(post.id);
                  cambiar(
                    'publicacionIds',
                    ya
                      ? formulario.publicacionIds.filter((id) => id !== post.id)
                      : [...formulario.publicacionIds, post.id]
                  );
                }}
              />
              <span>{post.marcaNombre} — {post.titulo}</span>
            </label>
          ))}
        </fieldset>
        <CampoFormulario etiqueta="Orden" id="pub-orden">
          <input
            id="pub-orden"
            type="number"
            min="0"
            value={formulario.orden}
            onChange={(e) => cambiar('orden', e.target.value)}
          />
        </CampoFormulario>
        <label className="publicidad-plataforma__check">
          <input
            type="checkbox"
            checked={formulario.activa}
            onChange={(e) => cambiar('activa', e.target.checked)}
          />
          Visible en el blog
        </label>
        <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={guardando}>
          {guardando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Publicar anuncio'}
        </BotonPrincipal>
        {editandoId && (
          <button type="button" className="publicidad-plataforma__cancelar" onClick={cancelarEdicion}>
            Cancelar edicion
          </button>
        )}
      </form>

      {cargando ? <Cargando mensaje="Cargando anuncios..." /> : (
        <ul className="publicidad-plataforma__lista">
          {anuncios.length === 0 && <li className="publicidad-plataforma__vacio">Aun no hay anuncios.</li>}
          {anuncios.map((anuncio) => (
            <li key={anuncio.id} className="publicidad-plataforma__item">
              <div>
                <strong>{anuncio.titulo}</strong>
                <p>{anuncio.anunciante} · {anuncio.tipo === 'imagen' ? 'Imagen' : 'Enlace'} · {anuncio.publicacionIds?.length ?? 0} publicaciones</p>
                <span>{anuncio.activa ? 'Visible' : 'Oculto'}</span>
              </div>
              <button type="button" onClick={() => editar(anuncio)}>Editar</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
