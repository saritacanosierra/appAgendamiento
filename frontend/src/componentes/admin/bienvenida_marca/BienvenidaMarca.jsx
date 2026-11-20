import { useState } from 'react';
import { BotonPrincipal, CampoFormulario, InputTexto } from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { obtenerConfiguracionMarca, actualizarConfiguracionMarca } from '../../../modulos/configuracion_marca/servicios/configuracionServicio';
import { crearServicio } from '../../../modulos/reservas/servicios/serviciosServicio';
import '../../../estilos/componentes/bienvenida_marca/bienvenida_marca.css';

const HORARIO_BASE = {
  lunes: { apertura: '09:00', cierre: '19:00', bloqueos: [] },
  martes: { apertura: '09:00', cierre: '19:00', bloqueos: [] },
  miercoles: { apertura: '09:00', cierre: '19:00', bloqueos: [] },
  jueves: { apertura: '09:00', cierre: '19:00', bloqueos: [] },
  viernes: { apertura: '09:00', cierre: '19:00', bloqueos: [] },
  sabado: { apertura: '09:00', cierre: '19:00', bloqueos: [] },
  domingo: null,
};

function enlacePublico(slug) {
  if (!slug || typeof window === 'undefined') return '';
  return `${window.location.origin}${RUTAS_PUBLICAS.inicioMarca(slug)}`;
}

export default function BienvenidaMarca({ marca, onVerPanel }) {
  const [paso, setPaso] = useState(2);
  const [slug, setSlug] = useState(marca?.slug ?? '');
  const [servicio, setServicio] = useState({ nombre: '', duracion: '40', precio: '' });
  const [enlace, setEnlace] = useState(enlacePublico(marca?.slug));
  const [aviso, setAviso] = useState('');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  async function guardarOficio(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      const datos = await actualizarConfiguracionMarca({ slug });
      const nuevoSlug = datos?.slug ?? slug;
      setSlug(nuevoSlug);
      setEnlace(enlacePublico(nuevoSlug));
      setPaso(3);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function guardarServicio(evento) {
    evento.preventDefault();
    setGuardando(true);
    setError('');
    try {
      await crearServicio({
        nombre: servicio.nombre,
        duracion_minutos: Number(servicio.duracion),
        precio: Number(servicio.precio),
        tipo: 'marca',
      });
      const actual = await obtenerConfiguracionMarca();
      const yaTieneHorario = Object.values(actual?.horarios ?? {}).some(Boolean);
      if (!yaTieneHorario) {
        await actualizarConfiguracionMarca({ horarios: HORARIO_BASE });
      }
      setPaso(4);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
    }
  }

  async function copiarEnlace() {
    try {
      await navigator.clipboard.writeText(enlace);
      setAviso('Enlace copiado. Pégalo en tu bio o en el chat.');
    } catch {
      setAviso(enlace);
    }
  }

  function abrirWhatsapp() {
    const texto = `Reserva tu cita aquí: ${enlace}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="bienvenida-marca">
      <p className="bienvenida-marca__etiqueta">Paso {paso - 1} de 3</p>
      {paso === 2 && (
        <form className="bienvenida-marca__paso" onSubmit={guardarOficio}>
          <h1>Tu enlace</h1>
          <p>Sale del nombre del negocio que escribiste al registrarte. Cámbialo si quieres otra dirección.</p>
          <CampoFormulario etiqueta="Tu enlace" id="bienvenida-slug">
            <InputTexto
              id="bienvenida-slug"
              capitalizar={false}
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
            />
          </CampoFormulario>
          <p className="bienvenida-marca__enlace">{enlacePublico(slug)}</p>
          {error && <p className="bienvenida-marca__error" role="alert">{error}</p>}
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={guardando}>
            {guardando ? 'Guardando...' : 'Seguir con el primer servicio'}
          </BotonPrincipal>
        </form>
      )}

      {paso === 3 && (
        <form className="bienvenida-marca__paso" onSubmit={guardarServicio}>
          <h1>Crea tu primer servicio</h1>
          <p>El horario base queda de lunes a sábado, de 9:00 a 19:00. El domingo no abre.</p>
          <CampoFormulario etiqueta="Nombre" id="bienvenida-servicio" requerido>
            <InputTexto
              id="bienvenida-servicio"
              value={servicio.nombre}
              onChange={(e) => setServicio({ ...servicio, nombre: e.target.value })}
              placeholder="Semipermanente"
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Duración en minutos" id="bienvenida-duracion" requerido>
            <input
              id="bienvenida-duracion"
              type="number"
              min="5"
              max="480"
              value={servicio.duracion}
              onChange={(e) => setServicio({ ...servicio, duracion: e.target.value })}
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Precio" id="bienvenida-precio" requerido>
            <input
              id="bienvenida-precio"
              type="number"
              min="0"
              value={servicio.precio}
              onChange={(e) => setServicio({ ...servicio, precio: e.target.value })}
              placeholder="25000"
              required
            />
          </CampoFormulario>
          {error && <p className="bienvenida-marca__error" role="alert">{error}</p>}
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={guardando}>
            {guardando ? 'Guardando...' : 'Dejar lista la primera cita'}
          </BotonPrincipal>
        </form>
      )}

      {paso === 4 && (
        <section className="bienvenida-marca__paso">
          <h1>Tu enlace ya recibe citas.</h1>
          <p>Cópialo y pruébalo como cliente, o pégalo en la bio y en WhatsApp.</p>
          <p className="bienvenida-marca__enlace">{enlace}</p>
          {aviso && <p className="bienvenida-marca__aviso">{aviso}</p>}
          <BotonPrincipal anchoCompleto onClick={copiarEnlace}>
            Copiar mi enlace y probar como cliente
          </BotonPrincipal>
          <button type="button" className="bienvenida-marca__secundario" onClick={abrirWhatsapp}>
            Enviar el enlace por WhatsApp
          </button>
          <button type="button" className="bienvenida-marca__secundario" onClick={onVerPanel}>
            Ver el panel del día
          </button>
        </section>
      )}
    </div>
  );
}
