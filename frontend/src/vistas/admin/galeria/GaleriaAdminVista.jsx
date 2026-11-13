import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  EstadoVacio,
  GaleriaFiltrosAcordeon,
  ImagenAmpliable,
  InputTexto,
  MensajeError,
  ModalConfirmacion,
} from '../../../compartido/componentes';
import GaleriaCatalogoPanel from '../../../componentes/admin/galeria_catalogo/GaleriaCatalogoPanel';
import { AyudaPasoTienda } from '../../../componentes/admin/guia_personalizacion/GuiaPersonalizacion';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import { catalogoActivoPorTipo } from '../../../modulos/galeria/constantes/galeriaCatalogo';
import {
  actualizarDiseno,
  crearDiseno,
  crearOpcionCatalogoGaleria,
  eliminarDiseno,
  listarCatalogoGaleriaAdmin,
  listarGaleriaAdmin,
} from '../../../modulos/galeria/servicios/galeriaServicio';
import { listarEstilistasAdmin } from '../../../modulos/reservas/servicios/estilistasServicio';
import { useAvisos } from '../../../aplicacion/proveedores/ProveedorAvisos';
import {
  categoriasUnicas,
  etiquetaDesdeCatalogo,
  filtrarDisenosGaleria,
  temporadasUnicas,
} from '../../../modulos/galeria/utilidades/filtrarDisenosGaleria';
import '../../../estilos/admin/galeria/galeria.css';
import '../../../estilos/admin/galeria/galeria_catalogo.css';
import '../../../estilos/admin/comun/aviso-carrusel.css';

function formularioVacio(catalogo) {
  const primeraCategoria = catalogoActivoPorTipo(catalogo, 'categoria')[0]?.valor ?? '';
  return {
    titulo: '',
    categoria: primeraCategoria,
    categoriaNueva: '',
    temporada: '',
    temporadaNueva: '',
    colores: '',
    imagenRuta: '',
    activo: true,
    enTendencia: false,
    ordenVisualizacion: '0',
    estilistaId: '',
  };
}

export default function GaleriaAdminVista() {
  const avisos = useAvisos();
  const [disenos, setDisenos] = useState([]);
  const [catalogo, setCatalogo] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(formularioVacio([]));
  const [enviando, setEnviando] = useState(false);
  const [subiendoImagen, setSubiendoImagen] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('todas');
  const [temporada, setTemporada] = useState('todas');
  const [tendencia, setTendencia] = useState('todas');
  const [estilistas, setEstilistas] = useState([]);
  const [disenoAEliminar, setDisenoAEliminar] = useState(null);
  const [eliminando, setEliminando] = useState(false);

  const categoriasActivas = useMemo(
    () => catalogoActivoPorTipo(catalogo, 'categoria'),
    [catalogo]
  );
  const temporadasActivas = useMemo(
    () => catalogoActivoPorTipo(catalogo, 'temporada'),
    [catalogo]
  );

  const cargarCatalogo = useCallback(async () => {
    const items = await listarCatalogoGaleriaAdmin();
    setCatalogo(Array.isArray(items) ? items : []);
    return items;
  }, []);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const [disenosData, catalogoData, estilistasData] = await Promise.all([
        listarGaleriaAdmin(),
        listarCatalogoGaleriaAdmin(),
        listarEstilistasAdmin().catch(() => []),
      ]);
      setDisenos(Array.isArray(disenosData) ? disenosData : []);
      setCatalogo(Array.isArray(catalogoData) ? catalogoData : []);
      setEstilistas(Array.isArray(estilistasData) ? estilistasData : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const categoriasFiltro = useMemo(
    () => categoriasUnicas(disenos, catalogo),
    [disenos, catalogo]
  );
  const temporadasFiltro = useMemo(
    () => temporadasUnicas(disenos, catalogo),
    [disenos, catalogo]
  );

  const disenosFiltrados = useMemo(
    () => filtrarDisenosGaleria(disenos, {
      busqueda,
      categoria,
      temporada,
      tendencia,
      catalogo,
    }),
    [disenos, busqueda, categoria, temporada, tendencia, catalogo]
  );

  function abrirCrear() {
    setEditandoId(null);
    setForm(formularioVacio(catalogo));
    setMostrarForm(true);
  }

  function abrirEditar(diseno) {
    setEditandoId(diseno.id);
    setForm({
      titulo: diseno.titulo,
      categoria: diseno.categoria ?? categoriasActivas[0]?.valor ?? '',
      categoriaNueva: '',
      temporada: diseno.temporada ?? '',
      temporadaNueva: '',
      colores: (diseno.coloresRelacionados ?? []).join(', '),
      imagenRuta: diseno.imagenRuta,
      activo: diseno.activo,
      enTendencia: Boolean(diseno.enTendencia),
      ordenVisualizacion: String(diseno.ordenVisualizacion ?? 0),
      estilistaId: diseno.estilistaId ? String(diseno.estilistaId) : '',
    });
    setMostrarForm(true);
  }

  function cerrarForm() {
    setMostrarForm(false);
    setEditandoId(null);
    setForm(formularioVacio(catalogo));
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

  async function filtroParaGuardar(tipo, seleccionado, nuevo) {
    const etiqueta = nuevo.trim();
    if (!etiqueta) return seleccionado || null;

    const item = await crearOpcionCatalogoGaleria({ tipo, etiqueta });
    return item?.valor ?? null;
  }

  async function manejarEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    let categoriaValor;
    let temporadaValor;
    try {
      categoriaValor = await filtroParaGuardar('categoria', form.categoria, form.categoriaNueva);
      temporadaValor = await filtroParaGuardar('temporada', form.temporada, form.temporadaNueva);
    } catch (err) {
      setError(err.message);
      setEnviando(false);
      return;
    }

    if (!categoriaValor) {
      setError('Elige un filtro o escribe uno nuevo. Así tu clienta puede buscar la foto.');
      setEnviando(false);
      return;
    }

    const payload = {
      titulo: form.titulo.trim(),
      categoria: categoriaValor,
      temporada: temporadaValor,
      colores_relacionados: form.colores.trim() || null,
      imagen_ruta: form.imagenRuta,
      activo: form.activo,
      en_tendencia: form.enTendencia,
      orden_visualizacion: Number(form.ordenVisualizacion) || 0,
      estilista_id: form.estilistaId ? Number(form.estilistaId) : null,
    };

    try {
      if (editandoId) {
        await actualizarDiseno(editandoId, payload);
        avisos.exito('Diseño actualizado');
      } else {
        await crearDiseno(payload);
        avisos.exito('Diseño guardado en la galería');
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
    if (!disenoAEliminar) return;
    setEliminando(true);
    setError(null);
    try {
      await eliminarDiseno(disenoAEliminar.id);
      avisos.exito('Foto eliminada');
      setDisenoAEliminar(null);
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="galeria-admin">
      <ModalConfirmacion
        abierto={Boolean(disenoAEliminar)}
        titulo="Eliminar foto"
        mensaje={
          disenoAEliminar
            ? `¿Eliminar "${disenoAEliminar.titulo}"? Tu clienta ya no podrá verla ni elegirla.`
            : ''
        }
        textoConfirmar={eliminando ? 'Eliminando...' : 'Sí, eliminar'}
        textoCancelar="Cancelar"
        onConfirmar={confirmarEliminar}
        onCancelar={() => !eliminando && setDisenoAEliminar(null)}
      />
      <AyudaPasoTienda paso="galeria" />
      <header className="galeria-admin__cabecera">
        <h1>Galería</h1>
        <BotonPrincipal onClick={mostrarForm ? cerrarForm : abrirCrear}>
          {mostrarForm ? 'Cerrar' : '+ Nueva foto'}
        </BotonPrincipal>
      </header>

      {!mostrarForm && (
        <p className="admin-aviso-carrusel">
          La galería es independiente del carrusel. Para fotos del inicio ve a{' '}
          <Link to={RUTAS_ADMIN.carruselInicio}>Carrusel</Link>.
        </p>
      )}

      <GaleriaCatalogoPanel catalogo={catalogo} onCambio={cargarCatalogo} />

      {!mostrarForm && (
        <GaleriaFiltrosAcordeon
          busqueda={busqueda}
          onBusquedaChange={setBusqueda}
          categoria={categoria}
          onCategoriaChange={setCategoria}
          temporada={temporada}
          onTemporadaChange={setTemporada}
          tendencia={tendencia}
          onTendenciaChange={setTendencia}
          categorias={categoriasFiltro}
          temporadas={temporadasFiltro}
          catalogo={catalogo}
          onLimpiar={() => {
            setBusqueda('');
            setCategoria('todas');
            setTemporada('todas');
            setTendencia('todas');
          }}
        />
      )}

      {mostrarForm && (
        <form className="galeria-admin__formulario" onSubmit={manejarEnviar}>
          <h2>{editandoId ? 'Editar foto' : 'Nueva foto'}</h2>
          <p className="galeria-admin__hint">
            Sube la foto y elige el filtro. Tu clienta la verá y podrá marcarla si le gusta.
          </p>
          <CampoFormulario etiqueta="Título" id="gal-titulo" requerido>
            <InputTexto
              id="gal-titulo"
              value={form.titulo}
              onChange={(e) => setForm({ ...form, titulo: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Foto" id="gal-imagen" requerido>
            <input
              id="gal-imagen"
              className="galeria-admin__archivo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={manejarImagen}
            />
            {subiendoImagen && <p className="galeria-admin__hint">Subiendo imagen...</p>}
            {form.imagenRuta && (
              <ImagenAmpliable src={form.imagenRuta} alt="Vista previa" className="galeria-admin__preview" />
            )}
          </CampoFormulario>
          <div className="galeria-admin__fila">
            <CampoFormulario etiqueta="Filtro" id="gal-categoria" ayuda="Es la categoría con la que tu clienta busca la foto.">
              <select
                id="gal-categoria"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
              >
                <option value="">Elegir un filtro</option>
                {categoriasActivas.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </CampoFormulario>
            <CampoFormulario etiqueta="O un filtro nuevo" id="gal-categoria-nueva" ayuda="Por ejemplo: Uñas, Color, Corte. Se guarda y queda en la lista.">
              <InputTexto
                id="gal-categoria-nueva"
                capitalizar="palabras"
                value={form.categoriaNueva}
                onChange={(e) => setForm({ ...form, categoriaNueva: e.target.value })}
                placeholder="Uñas"
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Temporada" id="gal-temporada">
              <select
                id="gal-temporada"
                value={form.temporada}
                onChange={(e) => setForm({ ...form, temporada: e.target.value })}
              >
                <option value="">Sin temporada</option>
                {temporadasActivas.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
            </CampoFormulario>
            <CampoFormulario etiqueta="O una temporada nueva" id="gal-temporada-nueva">
              <InputTexto
                id="gal-temporada-nueva"
                capitalizar="palabras"
                value={form.temporadaNueva}
                onChange={(e) => setForm({ ...form, temporadaNueva: e.target.value })}
                placeholder="Navidad"
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Colores (separados por coma)" id="gal-colores">
              <InputTexto
                id="gal-colores"
                capitalizar="lista"
                value={form.colores}
                onChange={(e) => setForm({ ...form, colores: e.target.value })}
                placeholder="rosa, blanco, nude"
              />
            </CampoFormulario>
            <CampoFormulario etiqueta="Estilista" id="gal-estilista" ayuda="Si eliges una profesional, esta foto sale en su portafolio como uno de sus mejores trabajos.">
              <select
                id="gal-estilista"
                value={form.estilistaId}
                onChange={(e) => setForm({ ...form, estilistaId: e.target.value })}
              >
                <option value="">Todo el salon</option>
                {estilistas.filter((item) => item.activo).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.nombre}
                  </option>
                ))}
              </select>
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
          <CampoFormulario etiqueta="Opciones" id="gal-opciones">
            <label className="galeria-admin__checkbox">
              <input
                id="gal-activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Visible para tu clienta
            </label>
            <label className="galeria-admin__checkbox">
              <input
                id="gal-tendencia"
                type="checkbox"
                checked={form.enTendencia}
                onChange={(e) => setForm({ ...form, enTendencia: e.target.checked })}
              />
              Marcar como en tendencia
            </label>
          </CampoFormulario>
          <BotonPrincipal
            tipo="submit"
            anchoCompleto
            deshabilitado={enviando || subiendoImagen || !form.imagenRuta}
          >
            {enviando ? 'Guardando...' : editandoId ? 'Guardar cambios' : 'Publicar foto'}
          </BotonPrincipal>
        </form>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && !mostrarForm && disenos.length > 0 && disenosFiltrados.length === 0 && (
        <p className="galeria-admin__vacio">No hay disenos con esos filtros.</p>
      )}

      {!cargando && !mostrarForm && (
        <div className="galeria-admin__grid">
          {disenos.length === 0 ? (
            <EstadoVacio
              titulo="Aún no tienes fotos"
              mensaje="Sube la primera. Elige o escribe un filtro para que tu clienta pueda verla y marcarla."
              textoAccion="Subir la primera foto"
              onAccion={abrirCrear}
            />
          ) : (
            disenosFiltrados.map((diseno) => (
              <article key={diseno.id} className="galeria-admin__item">
                <div className="galeria-admin__item-media">
                  <ImagenAmpliable src={diseno.imagenRuta} alt={diseno.titulo} />
                  {diseno.enTendencia && (
                    <span className="galeria-admin__tendencia">En tendencia</span>
                  )}
                </div>
                <div className="galeria-admin__item-info">
                  <strong>{diseno.titulo}</strong>
                  <div className="galeria-admin__item-meta">
                    {diseno.categoria && (
                      <span className="galeria-admin__item-etiqueta galeria-admin__item-etiqueta--cat">
                        {etiquetaDesdeCatalogo(diseno.categoria, catalogo)}
                      </span>
                    )}
                    {diseno.temporada && (
                      <span className="galeria-admin__item-etiqueta galeria-admin__item-etiqueta--temp">
                        {etiquetaDesdeCatalogo(diseno.temporada, catalogo)}
                      </span>
                    )}
                  </div>
                  {!diseno.activo && <span className="badge-fase">Inactivo</span>}
                  <div className="galeria-admin__item-acciones">
                    <BotonPrincipal variante="secundario" onClick={() => abrirEditar(diseno)}>
                      Editar
                    </BotonPrincipal>
                    <BotonPrincipal variante="secundario" onClick={() => setDisenoAEliminar(diseno)}>
                      Eliminar
                    </BotonPrincipal>
                  </div>
                </div>
              </article>
            ))
          )}
        </div>
      )}
    </div>
  );
}
