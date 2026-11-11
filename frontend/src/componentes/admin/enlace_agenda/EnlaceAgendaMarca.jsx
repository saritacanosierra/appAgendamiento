import { useState } from 'react';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import '../../../estilos/componentes/enlace_agenda/enlace_agenda.css';

function enlaceAbsoluto(slug) {
  const ruta = RUTAS_PUBLICAS.inicioMarca(slug);
  if (typeof window === 'undefined') return ruta;
  return `${window.location.origin}${ruta}`;
}

export default function EnlaceAgendaMarca({ slug, nombre }) {
  const [copiado, setCopiado] = useState(false);
  if (!slug) return null;

  const enlace = enlaceAbsoluto(slug);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(enlace);
      setCopiado(true);
    } catch {
      setCopiado(false);
    }
  }

  return (
    <section className="enlace-agenda">
      <p className="enlace-agenda__etiqueta">Enlace para tus clientas</p>
      <h2>Comparte la agenda de {nombre || 'tu salon'}</h2>
      <p className="enlace-agenda__ayuda">
        Quien abra este enlace agenda, mira la galeria y consulta su cita. No necesita cuenta.
      </p>
      <p className="enlace-agenda__url">{enlace}</p>
      <div className="enlace-agenda__acciones">
        <button type="button" className="enlace-agenda__copiar" onClick={copiar}>
          {copiado ? 'Enlace copiado' : 'Copiar enlace'}
        </button>
        <a className="enlace-agenda__abrir" href={enlace} target="_blank" rel="noopener noreferrer">
          Abrir agenda
        </a>
      </div>
    </section>
  );
}
