import { useId, useState } from 'react';
import {
  etiquetaDesdeCatalogo,
} from '../../../modulos/galeria/constantes/galeriaCatalogo';
import '../../../estilos/compartido/galeria_filtros_acordeon/galeria_filtros_acordeon.css';

export default function GaleriaFiltrosAcordeon({
  busqueda,
  onBusquedaChange,
  categoria,
  onCategoriaChange,
  temporada,
  onTemporadaChange,
  tendencia,
  onTendenciaChange,
  categorias,
  temporadas,
  catalogo = [],
  onLimpiar,
}) {
  const [abierto, setAbierto] = useState(false);
  const panelId = useId();

  const hayFiltros =
    Boolean(busqueda.trim())
    || categoria !== 'todas'
    || temporada !== 'todas'
    || tendencia !== 'todas';

  return (
    <section
      className={`galeria-filtros${abierto ? ' galeria-filtros--abierto' : ''}`}
      aria-label="Filtrar galería"
    >
      <button
        type="button"
        className="galeria-filtros__cabecera"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
        aria-controls={panelId}
      >
        <span className="galeria-filtros__titulo">Filtrar diseños</span>
        {hayFiltros && <span className="galeria-filtros__badge">Activos</span>}
        <span className="galeria-filtros__icono" aria-hidden="true" />
      </button>

      <div
        id={panelId}
        className="galeria-filtros__panel"
        aria-hidden={!abierto}
        inert={abierto ? undefined : ''}
      >
        <div className="galeria-filtros__panel-inner">
          <div className="galeria-filtros__campos">
            <label className="galeria-filtros__campo galeria-filtros__campo--busqueda">
              <span className="galeria-filtros__etiqueta">Buscar</span>
              <input
                type="search"
                value={busqueda}
                onChange={(e) => onBusquedaChange(e.target.value)}
                placeholder="Titulo, categoria, temporada o color..."
                autoComplete="off"
              />
            </label>

            <label className="galeria-filtros__campo">
              <span className="galeria-filtros__etiqueta">Categoria</span>
              <select value={categoria} onChange={(e) => onCategoriaChange(e.target.value)}>
                <option value="todas">Todas</option>
                {categorias.map((cat) => (
                  <option key={cat} value={cat}>
                    {etiquetaDesdeCatalogo(cat, catalogo)}
                  </option>
                ))}
              </select>
            </label>

            <label className="galeria-filtros__campo">
              <span className="galeria-filtros__etiqueta">Temporada</span>
              <select value={temporada} onChange={(e) => onTemporadaChange(e.target.value)}>
                <option value="todas">Todas</option>
                <option value="sin-temporada">Sin temporada</option>
                {temporadas.map((temp) => (
                  <option key={temp} value={temp}>
                    {etiquetaDesdeCatalogo(temp, catalogo)}
                  </option>
                ))}
              </select>
            </label>

            <label className="galeria-filtros__campo">
              <span className="galeria-filtros__etiqueta">Tendencia</span>
              <select value={tendencia} onChange={(e) => onTendenciaChange(e.target.value)}>
                <option value="todas">Todos</option>
                <option value="tendencia">En tendencia</option>
                <option value="sin-tendencia">Sin tendencia</option>
              </select>
            </label>
          </div>

          {hayFiltros && (
            <button type="button" className="galeria-filtros__limpiar" onClick={onLimpiar}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
