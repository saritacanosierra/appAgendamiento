import { useState } from 'react';
import { BotonPrincipal, InputTexto, MensajeError } from '../../../compartido/componentes';
import {
  actualizarOpcionCatalogoGaleria,
  crearOpcionCatalogoGaleria,
  eliminarOpcionCatalogoGaleria,
} from '../../../modulos/galeria/servicios/galeriaServicio';
import { catalogoActivoPorTipo } from '../../../modulos/galeria/constantes/galeriaCatalogo';
import '../../../estilos/admin/galeria/galeria_catalogo.css';

function ListaCatalogo({ titulo, tipo, items, onCambio, error: _error, setError }) {
  const [nuevaEtiqueta, setNuevaEtiqueta] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [editEtiqueta, setEditEtiqueta] = useState('');

  const delTipo = items.filter((item) => item.tipo === tipo);

  async function agregar(e) {
    e.preventDefault();
    const etiqueta = nuevaEtiqueta.trim();
    if (!etiqueta) return;

    setGuardando(true);
    setError(null);
    try {
      await crearOpcionCatalogoGaleria({ tipo, etiqueta });
      setNuevaEtiqueta('');
      await onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarEdicion(id) {
    const etiqueta = editEtiqueta.trim();
    if (!etiqueta) return;

    setGuardando(true);
    setError(null);
    try {
      await actualizarOpcionCatalogoGaleria(id, { etiqueta });
      setEditandoId(null);
      await onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function alternarActivo(item) {
    setGuardando(true);
    setError(null);
    try {
      await actualizarOpcionCatalogoGaleria(item.id, { activo: !item.activo });
      await onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar(item) {
    if (!window.confirm(`Eliminar "${item.etiqueta}"?`)) return;

    setGuardando(true);
    setError(null);
    try {
      await eliminarOpcionCatalogoGaleria(item.id);
      await onCambio();
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="galeria-catalogo__bloque">
      <h3>{titulo}</h3>
      <form className="galeria-catalogo__agregar" onSubmit={agregar}>
        <InputTexto
          capitalizar="palabras"
          value={nuevaEtiqueta}
          onChange={(e) => setNuevaEtiqueta(e.target.value)}
          placeholder={`Nueva ${titulo.toLowerCase()}...`}
          maxLength={100}
          disabled={guardando}
        />
        <BotonPrincipal tipo="submit" deshabilitado={guardando || !nuevaEtiqueta.trim()}>
          Agregar
        </BotonPrincipal>
      </form>

      {delTipo.length === 0 ? (
        <p className="galeria-catalogo__vacio">Aun no hay opciones. Agrega la primera arriba.</p>
      ) : (
        <ul className="galeria-catalogo__lista">
          {delTipo.map((item) => (
            <li key={item.id} className={item.activo ? '' : 'galeria-catalogo__item--inactivo'}>
              {editandoId === item.id ? (
                <div className="galeria-catalogo__editar">
                  <InputTexto
                    capitalizar="palabras"
                    value={editEtiqueta}
                    onChange={(e) => setEditEtiqueta(e.target.value)}
                    maxLength={100}
                    disabled={guardando}
                  />
                  <button type="button" onClick={() => guardarEdicion(item.id)} disabled={guardando}>
                    Guardar
                  </button>
                  <button type="button" onClick={() => setEditandoId(null)} disabled={guardando}>
                    Cancelar
                  </button>
                </div>
              ) : (
                <>
                  <span>{item.etiqueta}</span>
                  <div className="galeria-catalogo__acciones">
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(item.id);
                        setEditEtiqueta(item.etiqueta);
                      }}
                      disabled={guardando}
                    >
                      Editar
                    </button>
                    <button type="button" onClick={() => alternarActivo(item)} disabled={guardando}>
                      {item.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button type="button" onClick={() => eliminar(item)} disabled={guardando}>
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function GaleriaCatalogoPanel({ catalogo, onCambio }) {
  const [error, setError] = useState(null);
  const [abierto, setAbierto] = useState(false);

  const categoriasActivas = catalogoActivoPorTipo(catalogo, 'categoria').length;
  const temporadasActivas = catalogoActivoPorTipo(catalogo, 'temporada').length;

  return (
    <section className="galeria-catalogo">
      <button
        type="button"
        className="galeria-catalogo__toggle"
        onClick={() => setAbierto((prev) => !prev)}
        aria-expanded={abierto}
      >
        <span>Categorias y temporadas</span>
        <span className="galeria-catalogo__resumen">
          {categoriasActivas} categorias · {temporadasActivas} temporadas
        </span>
      </button>

      {abierto && (
        <div className="galeria-catalogo__panel">
          <p className="galeria-catalogo__hint">
            Define aqui las opciones que luego apareceran al subir disenos (manicura, pedicura,
            Halloween, Navidad, etc.).
          </p>
          {error && <MensajeError mensaje={error} />}
          <div className="galeria-catalogo__grid">
            <ListaCatalogo
              titulo="Categorias"
              tipo="categoria"
              items={catalogo}
              onCambio={onCambio}
              error={error}
              setError={setError}
            />
            <ListaCatalogo
              titulo="Temporadas"
              tipo="temporada"
              items={catalogo}
              onCambio={onCambio}
              error={error}
              setError={setError}
            />
          </div>
        </div>
      )}
    </section>
  );
}
