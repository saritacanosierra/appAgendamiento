import { useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import {
  crearReserva,
  obtenerDisponibilidad,
} from '../../../modulos/reservas/servicios/reservasServicio';
import { fechaHoyLocal, formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  EncabezadoMarca,
  MensajeError,
  SelectorFecha,
  SelectorHora,
  TarjetaServicio,
} from '../../../compartido/componentes';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import '../../../estilos/publico/reservar/reservar.css';

const PASOS = ['Servicio', 'Fecha y hora', 'Tus datos', 'Confirmar'];

export default function ReservarVista() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { marca, cargando: cargandoMarca } = useMarca();

  const [paso, setPaso] = useState(0);
  const [servicios, setServicios] = useState([]);
  const [servicio, setServicio] = useState(null);
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [prefillListo, setPrefillListo] = useState(false);

  const [cargandoServicios, setCargandoServicios] = useState(false);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!marca?.id) return;
    setCargandoServicios(true);
    obtenerServiciosPublicos(marca.id)
      .then(setServicios)
      .catch(() => setError('No se pudieron cargar los servicios.'))
      .finally(() => setCargandoServicios(false));
  }, [marca?.id]);

  useEffect(() => {
    if (!servicios.length || prefillListo) return;

    const sid = searchParams.get('servicio');
    const f = searchParams.get('fecha');
    const h = searchParams.get('hora');

    if (!sid) {
      setPrefillListo(true);
      return;
    }

    const seleccionado = servicios.find((s) => String(s.id) === String(sid));
    if (!seleccionado) {
      setPrefillListo(true);
      return;
    }

    setServicio(seleccionado);
    const minimo = fechaHoyLocal();
    if (f && f >= minimo) setFecha(f);
    if (h) setHora(h);

    if (f && h) setPaso(2);
    else if (f) setPaso(1);
    else setPaso(1);

    setPrefillListo(true);
  }, [servicios, searchParams, prefillListo]);

  useEffect(() => {
    if (!marca?.id || !servicio?.id || !fecha) {
      setHorarios([]);
      setHora('');
      return;
    }

    setCargandoHorarios(true);
    setError(null);
    obtenerDisponibilidad(marca.id, servicio.id, fecha)
      .then((datos) => {
        const lista = datos.horarios ?? [];
        setHorarios(lista);
        setHora((prev) => (prev && lista.includes(prev) ? prev : ''));
      })
      .catch((err) => {
        setHorarios([]);
        setError(err.message);
      })
      .finally(() => setCargandoHorarios(false));
  }, [marca?.id, servicio?.id, fecha]);

  function seleccionarServicio(s) {
    setServicio(s);
    setPaso(1);
    setError(null);
  }

  function avanzarDesdeFechaHora() {
    if (!fecha || !hora) {
      setError('Selecciona fecha y hora.');
      return;
    }
    setError(null);
    setPaso(2);
  }

  function avanzarDesdeDatos() {
    if (!nombre.trim() || !telefono.trim()) {
      setError('Nombre y telefono son obligatorios.');
      return;
    }
    setError(null);
    setPaso(3);
  }

  async function confirmarReserva() {
    setEnviando(true);
    setError(null);

    try {
      const confirmacion = await crearReserva({
        marcaId: marca.id,
        servicioId: servicio.id,
        fecha,
        horaInicio: hora,
        nombre: nombre.trim(),
        telefono: telefono.trim(),
        correo: correo.trim(),
      });

      navigate(RUTAS_PUBLICAS.confirmacion(slug, confirmacion.cita.codigo), {
        state: { confirmacion },
      });
    } catch (err) {
      setError(err.message ?? 'No se pudo completar la reserva.');
    } finally {
      setEnviando(false);
    }
  }

  if (cargandoMarca) return <Cargando />;

  return (
    <div className="reservar-vista">
      <EncabezadoMarca marca={marca} titulo="Agendar cita" compacto />

      <p className="paso-indicador reservar-vista__indicador">
        Paso {paso + 1} de {PASOS.length}
      </p>

      {error && <MensajeError mensaje={error} />}

      {paso === 0 && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Elige un servicio</h2>
          {cargandoServicios && <Cargando mensaje="Cargando servicios..." />}
          <div className="reservar-vista__lista">
            {servicios.map((s) => (
              <TarjetaServicio key={s.id} servicio={s} onSeleccionar={seleccionarServicio} />
            ))}
          </div>
        </section>
      )}

      {paso === 1 && servicio && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Fecha y hora</h2>
          <p className="reservar-vista__resumen-servicio">
            {servicio.nombre} · {servicio.duracionMinutos} min · {formatearPrecio(servicio.precio)}
          </p>

          <SelectorFecha
            valor={fecha}
            min={fechaHoyLocal()}
            onChange={setFecha}
            modo="calendario"
            etiqueta="Selecciona un dia"
          />

          {fecha && (
            <>
              {cargandoHorarios && <Cargando mensaje="Buscando horarios..." />}
              {!cargandoHorarios && horarios.length === 0 && (
                <p className="reservar-vista__sin-horarios">No hay horarios disponibles este dia.</p>
              )}
              {!cargandoHorarios && horarios.length > 0 && (
                <SelectorHora valor={hora} opciones={horarios} onChange={setHora} />
              )}
            </>
          )}

          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(0)}>Atras</BotonPrincipal>
            <BotonPrincipal onClick={avanzarDesdeFechaHora} anchoCompleto>
              Continuar
            </BotonPrincipal>
          </div>
        </section>
      )}

      {paso === 2 && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Tus datos</h2>
          <CampoFormulario etiqueta="Nombre completo" id="nombre" requerido>
            <input
              id="nombre"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              autoComplete="name"
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Telefono" id="telefono" requerido>
            <input
              id="telefono"
              type="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              autoComplete="tel"
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Correo (opcional)" id="correo">
            <input
              id="correo"
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              autoComplete="email"
            />
          </CampoFormulario>
          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(1)}>Atras</BotonPrincipal>
            <BotonPrincipal onClick={avanzarDesdeDatos} anchoCompleto>
              Continuar
            </BotonPrincipal>
          </div>
        </section>
      )}

      {paso === 3 && (
        <section className="reservar-vista__seccion tarjeta-app">
          <h2>Confirma tu cita</h2>
          <dl className="reservar-vista__resumen-final">
            <dt>Servicio</dt>
            <dd>{servicio.nombre}</dd>
            <dt>Fecha</dt>
            <dd>{fecha}</dd>
            <dt>Hora</dt>
            <dd>{formatearHoraLegible(hora)}</dd>
            <dt>Nombre</dt>
            <dd>{nombre}</dd>
            <dt>Telefono</dt>
            <dd>{telefono}</dd>
            {correo && (
              <>
                <dt>Correo</dt>
                <dd>{correo}</dd>
              </>
            )}
          </dl>
          <div className="reservar-vista__acciones">
            <BotonPrincipal variante="texto" onClick={() => setPaso(2)}>Atras</BotonPrincipal>
            <BotonPrincipal onClick={confirmarReserva} anchoCompleto deshabilitado={enviando}>
              {enviando ? 'Reservando...' : 'Confirmar reserva'}
            </BotonPrincipal>
          </div>
        </section>
      )}
    </div>
  );
}
