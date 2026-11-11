import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAvisos } from '../../../aplicacion/proveedores/ProveedorAvisos';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { subirImagenAdmin } from '../../../compartido/utilidades/apiCliente';
import {
  actualizarEstilista,
  crearEstilista,
  listarEstilistasAdmin,
} from '../../../modulos/reservas/servicios/estilistasServicio';
import '../../../estilos/componentes/equipo_estilistas/equipo_estilistas.css';

function borradorDe(estilista) {
  return {
    habilidades: (estilista.habilidades ?? []).join(', '),
    descripcion: estilista.descripcion ?? '',
    foto: estilista.foto ?? '',
    archivo: null,
  };
}

function inicial(nombre) {
  return (nombre || '?').trim().charAt(0).toUpperCase();
}

function FotoEquipo({ archivo, foto, nombre }) {
  const [local, setLocal] = useState(null);

  useEffect(() => {
    if (!archivo) {
      setLocal(null);
      return undefined;
    }
    const url = URL.createObjectURL(archivo);
    setLocal(url);
    return () => URL.revokeObjectURL(url);
  }, [archivo]);

  const src = local || foto;
  if (src) return <img src={src} alt="" className="equipo-estilistas__foto" />;
  return (
    <span className="equipo-estilistas__foto equipo-estilistas__foto--vacia" aria-hidden="true">
      {inicial(nombre)}
    </span>
  );
}

export default function EquipoEstilistas() {
  const avisos = useAvisos();
  const [equipo, setEquipo] = useState([]);
  const [borradores, setBorradores] = useState({});
  const [nombre, setNombre] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [guardandoId, setGuardandoId] = useState(null);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    const lista = await listarEstilistasAdmin();
    const filas = Array.isArray(lista) ? lista : [];
    setEquipo(filas);
    setBorradores(Object.fromEntries(filas.map((item) => [item.id, borradorDe(item)])));
  }, []);

  useEffect(() => {
    cargar().catch((err) => setError(err.message));
  }, [cargar]);

  function cambiarBorrador(id, campo, valor) {
    setBorradores((prev) => ({
      ...prev,
      [id]: { ...prev[id], [campo]: valor },
    }));
  }

  async function agregar(e) {
    e.preventDefault();
    const limpio = nombre.trim();
    if (limpio.length < 2) {
      setError('Escribe el nombre de la profesional.');
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await crearEstilista({ nombre: limpio });
      setNombre('');
      await cargar();
      avisos.exito('Profesional agregada. Sube su foto y sus habilidades.');
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function guardar(estilista) {
    const draft = borradores[estilista.id] ?? borradorDe(estilista);
    setGuardandoId(estilista.id);
    setError(null);
    try {
      let foto = draft.foto;
      if (draft.archivo) {
        const subida = await subirImagenAdmin('equipo', draft.archivo);
        foto = subida.ruta;
      }
      await actualizarEstilista(estilista.id, {
        nombre: estilista.nombre,
        activo: estilista.activo,
        foto_ruta: foto,
        habilidades: draft.habilidades,
        descripcion: draft.descripcion,
      });
      await cargar();
      avisos.exito('Portafolio actualizado.');
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardandoId(null);
    }
  }

  async function alternar(estilista) {
    const draft = borradores[estilista.id] ?? borradorDe(estilista);
    try {
      await actualizarEstilista(estilista.id, {
        nombre: estilista.nombre,
        activo: !estilista.activo,
        foto_ruta: draft.foto,
        habilidades: draft.habilidades,
        descripcion: draft.descripcion,
      });
      await cargar();
      avisos.exito(estilista.activo ? 'Oculta en el portafolio y en la reserva' : 'Visible en el portafolio');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <section className="equipo-estilistas" id="equipo">
      <p className="equipo-estilistas__ayuda">
        Si solo hay una profesional visible, el inicio no muestra el equipo: muestra un botón Portafolio con su foto, esta descripción y sus habilidades. Con varias, se ve el equipo. Los mejores trabajos salen de la Galería.
      </p>
      <Link className="equipo-estilistas__enlace" to={RUTAS_ADMIN.galeria}>
        Asignar trabajos en Galería
      </Link>
      {error && <p className="equipo-estilistas__error">{error}</p>}
      {equipo.length === 0 ? (
        <p className="equipo-estilistas__vacio">Aún no hay profesionales. Agrega la primera para armar el portafolio.</p>
      ) : (
        <ul className="equipo-estilistas__lista">
          {equipo.map((estilista) => {
            const draft = borradores[estilista.id] ?? borradorDe(estilista);
            return (
              <li key={estilista.id} className="equipo-estilistas__tarjeta">
                <div className="equipo-estilistas__cabeza">
                  <FotoEquipo archivo={draft.archivo} foto={draft.foto} nombre={estilista.nombre} />
                  <div>
                    <strong>{estilista.nombre}</strong>
                    <span>{estilista.activo ? 'Visible' : 'Oculta'}</span>
                  </div>
                </div>
                <label htmlFor={`foto-${estilista.id}`}>Foto</label>
                <input
                  id={`foto-${estilista.id}`}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={(e) => cambiarBorrador(estilista.id, 'archivo', e.target.files?.[0] ?? null)}
                />
                <label htmlFor={`desc-${estilista.id}`}>Descripción</label>
                <textarea
                  id={`desc-${estilista.id}`}
                  rows={3}
                  maxLength={280}
                  value={draft.descripcion}
                  placeholder="Una frase sobre su trabajo"
                  onChange={(e) => cambiarBorrador(estilista.id, 'descripcion', e.target.value)}
                />
                <label htmlFor={`hab-${estilista.id}`}>Habilidades que más destacan</label>
                <input
                  id={`hab-${estilista.id}`}
                  value={draft.habilidades}
                  maxLength={280}
                  placeholder="Nail art, francesa, acrílico"
                  onChange={(e) => cambiarBorrador(estilista.id, 'habilidades', e.target.value)}
                />
                <div className="equipo-estilistas__acciones">
                  <button type="button" onClick={() => guardar(estilista)} disabled={guardandoId === estilista.id}>
                    {guardandoId === estilista.id ? 'Guardando...' : 'Guardar portafolio'}
                  </button>
                  <button type="button" onClick={() => alternar(estilista)}>
                    {estilista.activo ? 'Ocultar' : 'Mostrar'}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <form className="equipo-estilistas__form" onSubmit={agregar}>
        <label htmlFor="estilista-nombre">Nueva profesional</label>
        <input
          id="estilista-nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          maxLength={120}
          placeholder="Nombre"
        />
        <button type="submit" disabled={enviando}>
          {enviando ? 'Guardando...' : 'Agregar'}
        </button>
      </form>
    </section>
  );
}
