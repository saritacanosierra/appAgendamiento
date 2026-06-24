import { Link } from 'react-router-dom';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  GaleriaFiltrosAcordeon,
  ImagenAmpliable,
  InputTexto,
  MensajeError,
} from '../../../compartido/componentes';
import GaleriaCatalogoPanel from '../../../componentes/admin/galeria_catalogo/GaleriaCatalogoPanel';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import { catalogoActivoPorTipo } from '../../../modulos/galeria/constantes/galeriaCatalogo';
import {
  actualizarDiseno,
  crearDiseno,
  listarCatalogoGaleriaAdmin,
  listarGaleriaAdmin,
} from '../../../modulos/galeria/servicios/galeriaServicio';
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
    temporada: '',
    colores: '',
    imagenRuta: '',
    activo: true,
    enTendencia: false,
    ordenVisualizacion: '0',
  };
}

export default function GaleriaAdminVista() {
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
      const [disenosData, catalogoData] = await Promise.all([
        listarGaleriaAdmin(),
        listarCatalogoGaleriaAdmin(),
      ]);
      setDisenos(Array.isArray(disenosData) ? disenosData : []);
      setCatalogo(Array.isArray(catalogoData) ? catalogoData : []);
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
      temporada: diseno.temporada ?? '',
      colores: (diseno.coloresRelacionados ?? []).join(', '),
      imagenRuta: diseno.imagenRuta,
      activo: diseno.activo,
      enTendencia: Boolean(diseno.enTendencia),
      ordenVisualizacion: String(diseno.ordenVisualizacion ?? 0),
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

  async function manejarEnviar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);

    const payload = {
      titulo: form.titulo.trim(),
      categoria: form.categoria || null,
      temporada: form.temporada || null,
      colores_relacionados: form.colores.trim() || null,
      imagen_ruta: form.imagenRuta,
      activo: form.activo,
      en_tendencia: form.enTendencia,
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

  const puedeCrearDiseno = categoriasActivas.length > 0;

  return (
    <div className="galeria-admin">
      <header className="galeria-admin__cabecera">
        <h1>Galeria</h1>
        <BotonPrincipal
          onClick={mostrarForm ? cerrarForm : abrirCrear}
          deshabilitado={!mostrarForm && !puedeCrearDiseno}
        >
          {mostrarForm ? 'Cerrar' : '+ Nuevo diseno'}
        </BotonPrincipal>
      </header>

      {!mostrarForm && (
        <p className="admin-aviso-carrusel">
          La galería es independiente del carrusel. Para fotos del inicio ve a{' '}
          <Link to={RUTAS_ADMIN.carruselInicio}>Carrusel</Link>.
        </p>
      )}

      <GaleriaCatalogoPanel catalogo={catalogo} onCambio={cargarCatalogo} />

      {!mostrarForm && !puedeCrearDiseno && (
        <p className="galeria-admin__aviso-catalogo">
          Agrega al menos una categoria en el panel de arriba antes de subir disenos.
        </p>
      )}

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
          <h2>{editandoId ? 'Editar diseno' : 'Nuevo diseno'}</h2>
          {!puedeCrearDiseno && (
            <p className="galeria-admin__aviso-catalogo">
              Crea categorias en el panel superior antes de guardar.
            </p>
          )}
          <CampoFormulario etiqueta="Titulo" id="gal-titulo" requerido>
            <InputTexto
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
              <ImagenAmpliable src={form.imagenRuta} alt="Vista previa" className="galeria-admin__preview" />
            )}
          </CampoFormulario>
          <div className="galeria-admin__fila">
            <CampoFormulario etiqueta="Categoria" id="gal-categoria" requerido>
              <select
                id="gal-categoria"
                value={form.categoria}
                onChange={(e) => setForm({ ...form, categoria: e.target.value })}
                required
              >
                {categoriasActivas.length === 0 && (
                  <option value="">Sin categorias — agrega una arriba</option>
                )}
                {categoriasActivas.map((item) => (
                  <option key={item.valor} value={item.valor}>
                    {item.etiqueta}
                  </option>
                ))}
              </select>
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
            <CampoFormulario etiqueta="Colores (separados por coma)" id="gal-colores">
              <InputTexto
                id="gal-colores"
                capitalizar="lista"
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
          <CampoFormulario etiqueta="Opciones" id="gal-opciones">
            <label className="galeria-admin__checkbox">
              <input
                id="gal-activo"
                type="checkbox"
                checked={form.activo}
                onChange={(e) => setForm({ ...form, activo: e.target.checked })}
              />
              Visible en la galeria publica
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
            deshabilitado={enviando || !form.imagenRuta || !puedeCrearDiseno}
          >
            {enviando ? 'Guardando...' : editandoId ? 'Actualizar' : 'Crear diseno'}
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
            <p className="galeria-admin__vacio">No hay disenos registrados.</p>
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
