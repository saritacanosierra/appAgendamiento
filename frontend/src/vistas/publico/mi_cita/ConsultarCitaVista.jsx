import { useEffect, useMemo, useState } from 'react';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  ContactoWhatsappMarca,
  EncabezadoMarca,
  EstadoCita,
  IconoApp,
  ImagenAmpliable,
  MensajeError,
  ModalConfirmacion,
  ModalMensaje,
  SelectorFecha,
  SelectorHora,
  BotonWhatsapp,
} from '../../../compartido/componentes';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import {
  cancelarCitaPublica,
  consultarCitas,
  obtenerDisponibilidad,
  solicitarReagendamiento,
} from '../../../modulos/reservas/servicios/reservasServicio';
import {
  agregarFavorito,
  quitarFavorito,
} from '../../../modulos/reservas/servicios/clientePerfilServicio';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import { listarGaleriaPublica } from '../../../modulos/galeria/servicios/galeriaServicio';
import { formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { mensajeConsultaCita } from '../../../compartido/utilidades/enlaceWhatsapp';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import { Link } from 'react-router-dom';
import '../../../estilos/publico/mi_cita/mi_cita.css';

function primerNombre(nombre) {
  return (nombre ?? '').trim().split(/\s+/)[0] || 'Cliente';
}

function formatearPuntos(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX');
}

function claveFavorito(tipo, referenciaId) {
  return `${tipo}:${referenciaId}`;
}

function ResumenPerfilCliente({ cliente }) {
  return (
    <section className="mi-cita__perfil">
      <header className="mi-cita__saludo">
        <p className="mi-cita__saludo-etiqueta">Tu espacio personal</p>
        <h2>Hola, {primerNombre(cliente.nombre)}</h2>
        <p>Tu oasis de belleza te espera.</p>
      </header>

      <div className="mi-cita__stats">
        <article className="mi-cita__stat tarjeta-app">
          <IconoApp nombre="puntos" tamano="lg" className="mi-cita__stat-icono" />
          <span className="mi-cita__stat-etiqueta">Puntos</span>
          <strong className="mi-cita__stat-valor">{formatearPuntos(cliente.puntos)}</strong>
          {cliente.serviciosCompletados > 0 && (
            <span className="mi-cita__stat-detalle">
              {cliente.serviciosCompletados}{' '}
              {cliente.serviciosCompletados === 1 ? 'servicio' : 'servicios'} completados
            </span>
          )}
        </article>

        <article className="mi-cita__stat tarjeta-app">
          <IconoApp nombre="corazon" tamano="lg" className="mi-cita__stat-icono" />
          <span className="mi-cita__stat-etiqueta">Favoritos</span>
          <strong className="mi-cita__stat-valor">{cliente.totalFavoritos ?? 0}</strong>
        </article>
      </div>

      {cliente.puntos === 0 && (
        <p className="mi-cita__puntos-info">
          Ganas 10 puntos por cada peso de servicios que hayas completado con nosotros.
        </p>
      )}
    </section>
  );
}

function BotonFavorito({ activo, deshabilitado, onClick, etiqueta }) {
  return (
    <button
      type="button"
      className={`mi-cita__btn-favorito${activo ? ' mi-cita__btn-favorito--activo' : ''}`}
      onClick={onClick}
      disabled={deshabilitado}
      aria-label={activo ? `Quitar ${etiqueta} de favoritos` : `Agregar ${etiqueta} a favoritos`}
      aria-pressed={activo}
    >
      <IconoApp nombre="corazon" tamano="sm" />
    </button>
  );
}

function ListaFavoritos({ favoritos, credenciales, marcaId, onActualizarPerfil }) {
  const [procesando, setProcesando] = useState(null);

  async function toggleFavorito(favorito) {
    const clave = claveFavorito(favorito.tipo, favorito.referenciaId);
    setProcesando(clave);
    try {
      const resultado = await quitarFavorito(
        marcaId,
        credenciales,
        favorito.tipo,
        favorito.referenciaId
      );
      onActualizarPerfil(resultado.perfil);
    } finally {
      setProcesando(null);
    }
  }

  if (!favoritos.length) {
    return (
      <section className="mi-cita__favoritos tarjeta-app">
        <h3>Mis favoritos</h3>
        <p className="mi-cita__favoritos-vacio">
          Aun no tienes favoritos. Explora servicios o disenos y toca el corazon para guardarlos.
        </p>
      </section>
    );
  }

  return (
    <section className="mi-cita__favoritos tarjeta-app">
      <h3>Mis favoritos</h3>
      <ul className="mi-cita__favoritos-lista">
        {favoritos.map((favorito) => {
          const clave = claveFavorito(favorito.tipo, favorito.referenciaId);
          return (
            <li key={favorito.id ?? clave} className="mi-cita__favorito-item">
              {favorito.imagenRuta ? (
                <ImagenAmpliable
                  src={favorito.imagenRuta}
                  alt={favorito.titulo}
                  className="mi-cita__favorito-imagen"
                />
              ) : (
                <div className="mi-cita__favorito-imagen mi-cita__favorito-imagen--vacia">
                  <IconoApp nombre={favorito.tipo === 'servicio' ? 'servicios' : 'galeria'} />
                </div>
              )}
              <div className="mi-cita__favorito-info">
                <span className="mi-cita__favorito-tipo">
                  {favorito.tipo === 'servicio' ? 'Servicio' : 'Diseno'}
                </span>
                <strong>{favorito.titulo}</strong>
                {favorito.precio != null && (
                  <span className="mi-cita__favorito-precio">{formatearPrecio(favorito.precio)}</span>
                )}
                {!favorito.activo && (
                  <span className="mi-cita__favorito-inactivo">Ya no esta disponible</span>
                )}
              </div>
              <BotonFavorito
                activo
                deshabilitado={procesando === clave}
                onClick={() => toggleFavorito(favorito)}
                etiqueta={favorito.titulo}
              />
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ExplorarFavoritos({ marcaId, credenciales, favoritos, onActualizarPerfil }) {
  const [tab, setTab] = useState('servicios');
  const [servicios, setServicios] = useState([]);
  const [disenos, setDisenos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState(null);

  useEffect(() => {
    if (!marcaId) return;
    let cancelado = false;
    setCargando(true);

    Promise.all([obtenerServiciosPublicos(marcaId), listarGaleriaPublica(marcaId)])
      .then(([listaServicios, listaDisenos]) => {
        if (!cancelado) {
          setServicios(listaServicios ?? []);
          setDisenos(listaDisenos ?? []);
        }
      })
      .catch(() => {
        if (!cancelado) {
          setServicios([]);
          setDisenos([]);
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });

    return () => {
      cancelado = true;
    };
  }, [marcaId]);

  const idsFavoritos = useMemo(
    () => new Set(favoritos.map((f) => claveFavorito(f.tipo, f.referenciaId))),
    [favoritos]
  );

  async function toggle(tipo, item) {
    const clave = claveFavorito(tipo, item.id);
    const activo = idsFavoritos.has(clave);
    setProcesando(clave);
    try {
      const resultado = activo
        ? await quitarFavorito(marcaId, credenciales, tipo, item.id)
        : await agregarFavorito(marcaId, credenciales, tipo, item.id);
      onActualizarPerfil(resultado.perfil);
    } finally {
      setProcesando(null);
    }
  }

  const items = tab === 'servicios' ? servicios : disenos;
  const tipo = tab === 'servicios' ? 'servicio' : 'diseno_galeria';

  return (
    <section className="mi-cita__explorar tarjeta-app">
      <header className="mi-cita__explorar-cabecera">
        <h3>Agregar a favoritos</h3>
        <div className="mi-cita__tabs" role="tablist" aria-label="Explorar favoritos">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'servicios'}
            className={`mi-cita__tab${tab === 'servicios' ? ' mi-cita__tab--activa' : ''}`}
            onClick={() => setTab('servicios')}
          >
            Servicios
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'disenos'}
            className={`mi-cita__tab${tab === 'disenos' ? ' mi-cita__tab--activa' : ''}`}
            onClick={() => setTab('disenos')}
          >
            Galeria
          </button>
        </div>
      </header>

      {cargando && <Cargando mensaje="Cargando opciones..." />}

      {!cargando && items.length === 0 && (
        <p className="mi-cita__explorar-vacio">
          {tab === 'servicios'
            ? 'No hay servicios disponibles por ahora.'
            : 'No hay disenos en la galeria por ahora.'}
        </p>
      )}

      {!cargando && items.length > 0 && (
        <ul className="mi-cita__explorar-lista">
          {items.map((item) => {
            const clave = claveFavorito(tipo, item.id);
            const activo = idsFavoritos.has(clave);
            const titulo = item.nombre ?? item.titulo;
            const imagen = item.imagenRuta ?? item.imagen_ruta;

            return (
              <li key={item.id} className="mi-cita__explorar-item">
                {imagen ? (
                  <ImagenAmpliable
                    src={imagen}
                    alt={titulo}
                    className="mi-cita__explorar-imagen"
                  />
                ) : (
                  <div className="mi-cita__explorar-imagen mi-cita__explorar-imagen--vacia">
                    <IconoApp nombre={tab === 'servicios' ? 'servicios' : 'galeria'} />
                  </div>
                )}
                <div className="mi-cita__explorar-info">
                  <strong>{titulo}</strong>
                  {item.precio != null && (
                    <span>{formatearPrecio(item.precio)}</span>
                  )}
                </div>
                <BotonFavorito
                  activo={activo}
                  deshabilitado={procesando === clave}
                  onClick={() => toggle(tipo, item)}
                  etiqueta={titulo}
                />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

function TarjetaCitaCliente({ cita, marcaId, telefono, onActualizar, whatsappMarca, nombreMarca }) {
  const [modoReagendar, setModoReagendar] = useState(false);
  const [fechaNueva, setFechaNueva] = useState('');
  const [horaNueva, setHoraNueva] = useState('');
  const [horarios, setHorarios] = useState([]);
  const [cargandoHorarios, setCargandoHorarios] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [mostrarConfirmCancelar, setMostrarConfirmCancelar] = useState(false);
  const [modalMensaje, setModalMensaje] = useState(null);

  useEffect(() => {
    if (!modoReagendar || !fechaNueva || !cita.servicio?.id) {
      setHorarios([]);
      return;
    }

    let cancelado = false;
    setCargandoHorarios(true);
    setModalMensaje(null);

    obtenerDisponibilidad(marcaId, cita.servicio.id, fechaNueva)
      .then((datos) => {
        if (!cancelado) {
          setHorarios(datos.horarios ?? []);
          if (horaNueva && !(datos.horarios ?? []).includes(horaNueva)) {
            setHoraNueva('');
          }
        }
      })
      .catch((err) => {
        if (!cancelado) {
          setModalMensaje({
            titulo: 'Error',
            mensaje: err.message,
            variante: 'error',
          });
        }
      })
      .finally(() => {
        if (!cancelado) setCargandoHorarios(false);
      });

    return () => {
      cancelado = true;
    };
  }, [modoReagendar, fechaNueva, cita.servicio?.id, marcaId, horaNueva]);

  async function ejecutarCancelar() {
    setEnviando(true);
    try {
      await cancelarCitaPublica(marcaId, cita.codigo, telefono);
      setMostrarConfirmCancelar(false);
      setModalMensaje({
        titulo: 'Cita cancelada',
        mensaje: 'Tu cita fue cancelada correctamente.',
        variante: 'exito',
      });
      onActualizar();
    } catch (err) {
      setMostrarConfirmCancelar(false);
      setModalMensaje({
        titulo: 'No se pudo cancelar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setEnviando(false);
    }
  }

  async function manejarReagendar(e) {
    e.preventDefault();
    if (!fechaNueva || !horaNueva) return;
    setEnviando(true);
    try {
      const resultado = await solicitarReagendamiento(
        marcaId,
        cita.codigo,
        telefono,
        fechaNueva,
        horaNueva
      );
      setModoReagendar(false);
      setModalMensaje({
        titulo: 'Solicitud enviada',
        mensaje: resultado.mensaje ?? 'El administrador confirmara tu nuevo horario pronto.',
        variante: 'exito',
      });
      onActualizar();
    } catch (err) {
      setModalMensaje({
        titulo: 'No se pudo reagendar',
        mensaje: err.message,
        variante: 'error',
      });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <>
      <ModalConfirmacion
        abierto={mostrarConfirmCancelar}
        titulo="Cancelar cita"
        mensaje="¿Seguro que deseas cancelar esta cita? Esta accion no se puede deshacer."
        textoConfirmar="Si, cancelar"
        textoCancelar="Volver"
        onConfirmar={ejecutarCancelar}
        onCancelar={() => setMostrarConfirmCancelar(false)}
      />

      <ModalMensaje
        abierto={Boolean(modalMensaje)}
        titulo={modalMensaje?.titulo ?? ''}
        mensaje={modalMensaje?.mensaje}
        variante={modalMensaje?.variante ?? 'exito'}
        onCerrar={() => setModalMensaje(null)}
      />

      <article className="mi-cita__tarjeta tarjeta-app">
        <header className="mi-cita__tarjeta-cabecera">
          <div>
            <h2>{cita.servicio.nombre}</h2>
            <p className="mi-cita__codigo">Codigo: {cita.codigo}</p>
          </div>
          <EstadoCita estado={cita.estado} canceladaPor={cita.canceladaPor} />
        </header>

        <dl className="mi-cita__detalle">
          <dt>Fecha y hora</dt>
          <dd>{cita.fecha} · {formatearHoraLegible(cita.horaInicio)}</dd>
          <dt>Precio</dt>
          <dd>{formatearPrecio(cita.servicio.precio)}</dd>
          <dt>Cliente</dt>
          <dd>{cita.cliente.nombre}</dd>
        </dl>

        {cita.solicitudReagendamiento && (
          <div className="mi-cita__pendiente">
            <strong>Reagendamiento pendiente de aprobacion</strong>
            <p>
              Solicitaste: {cita.solicitudReagendamiento.fechaSolicitada} a las{' '}
              {formatearHoraLegible(cita.solicitudReagendamiento.horaInicioSolicitada)}.
              El administrador confirmara pronto.
            </p>
          </div>
        )}

        {cita.mensajeRestriccion && cita.activa && (
          <p className="mi-cita__aviso">{cita.mensajeRestriccion}</p>
        )}

        {cita.activa && (
          <div className="mi-cita__acciones">
            {cita.puedeCancelar && (
              <BotonPrincipal
                type="button"
                variante="secundario"
                onClick={() => setMostrarConfirmCancelar(true)}
                deshabilitado={enviando}
              >
                Cancelar cita
              </BotonPrincipal>
            )}
            {cita.puedeReagendar && (
              <BotonPrincipal
                type="button"
                onClick={() => {
                  setModoReagendar((v) => !v);
                  setModalMensaje(null);
                }}
                deshabilitado={enviando}
              >
                {modoReagendar ? 'Cerrar reagendar' : 'Reagendar cita'}
              </BotonPrincipal>
            )}
          </div>
        )}

        {whatsappMarca && cita.activa && (
          <BotonWhatsapp
            telefono={whatsappMarca}
            anchoCompleto
            className="mi-cita__whatsapp-cita"
            mensaje={mensajeConsultaCita({
              nombreMarca,
              servicio: cita.servicio.nombre,
              fecha: cita.fecha,
              hora: formatearHoraLegible(cita.horaInicio),
              codigo: cita.codigo,
            })}
          >
            Escribir por WhatsApp
          </BotonWhatsapp>
        )}

        {modoReagendar && cita.puedeReagendar && (
          <form className="mi-cita__reagendar" onSubmit={manejarReagendar}>
            <p className="mi-cita__reagendar-intro">
              Elige la nueva fecha y hora. El administrador debe aprobar el cambio.
            </p>
            <SelectorFecha valor={fechaNueva} onChange={setFechaNueva} />
            {cargandoHorarios && <p className="mi-cita__hint">Cargando horarios...</p>}
            {!cargandoHorarios && fechaNueva && horarios.length === 0 && (
              <p className="mi-cita__hint">No hay horarios disponibles este dia.</p>
            )}
            <SelectorHora valor={horaNueva} onChange={setHoraNueva} opciones={horarios} />
            <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={enviando || !fechaNueva || !horaNueva}>
              {enviando ? 'Enviando...' : 'Enviar solicitud de reagendamiento'}
            </BotonPrincipal>
          </form>
        )}
      </article>
    </>
  );
}

export default function ConsultarCitaVista() {
  const { marca } = useMarca();
  const [telefono, setTelefono] = useState('');
  const [correo, setCorreo] = useState('');
  const [resultado, setResultado] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [error, setError] = useState(null);
  const [mostrarBusqueda, setMostrarBusqueda] = useState(true);

  const credenciales = useMemo(
    () => ({
      telefono: telefono.replace(/\D+/g, ''),
      correo: correo.trim().toLowerCase(),
    }),
    [telefono, correo]
  );

  async function buscar(e) {
    e.preventDefault();
    if (!marca?.id) return;
    setBuscando(true);
    setError(null);
    setResultado(null);
    try {
      const datos = await consultarCitas(marca.id, credenciales);
      setResultado(datos);
      setMostrarBusqueda(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBuscando(false);
    }
  }

  async function recargar() {
    if (!marca?.id || !telefono) return;
    try {
      const datos = await consultarCitas(marca.id, credenciales);
      setResultado(datos);
    } catch (err) {
      setError(err.message);
    }
  }

  function actualizarPerfil(perfil) {
    setResultado((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cliente: {
          ...prev.cliente,
          puntos: perfil.puntos,
          totalFavoritos: perfil.totalFavoritos,
          serviciosCompletados: perfil.serviciosCompletados,
        },
        favoritos: perfil.favoritos,
      };
    });
  }

  function cerrarSesion() {
    setResultado(null);
    setMostrarBusqueda(true);
    setError(null);
  }

  return (
    <div className="mi-cita">
      <EncabezadoMarca marca={marca} compacto />

      <header className="mi-cita__cabecera">
        <h1>Mi cita</h1>
        <p>
          {resultado
            ? 'Consulta tus citas, puntos y favoritos.'
            : 'Busca tu reserva con tu telefono y el correo con el que te registraste al reservar.'}
        </p>
      </header>

      {resultado && !mostrarBusqueda && (
        <button type="button" className="mi-cita__cambiar-datos" onClick={() => setMostrarBusqueda(true)}>
          Cambiar telefono o correo
        </button>
      )}

      {(mostrarBusqueda || !resultado) && (
        <form className="mi-cita__busqueda tarjeta-app" onSubmit={buscar}>
          <CampoFormulario etiqueta="Telefono" id="mi-cita-tel" requerido>
            <input
              id="mi-cita-tel"
              type="tel"
              inputMode="tel"
              value={telefono}
              onChange={(e) => setTelefono(e.target.value)}
              placeholder="10 digitos"
              required
            />
          </CampoFormulario>
          <CampoFormulario etiqueta="Correo electronico" id="mi-cita-correo" requerido>
            <input
              id="mi-cita-correo"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </CampoFormulario>
          <BotonPrincipal tipo="submit" anchoCompleto deshabilitado={buscando}>
            {buscando ? 'Buscando...' : resultado ? 'Actualizar datos' : 'Buscar mi cita'}
          </BotonPrincipal>
        </form>
      )}

      {error && (
        <MensajeError
          suave
          titulo="Datos incorrectos"
          mensaje="Verifica tu telefono y el correo con el que reservaste e intenta de nuevo."
        />
      )}
      {buscando && <Cargando mensaje="Buscando..." />}

      {resultado && !buscando && (
        <>
          <ResumenPerfilCliente cliente={resultado.cliente} />

          <ListaFavoritos
            favoritos={resultado.favoritos ?? []}
            credenciales={credenciales}
            marcaId={marca.id}
            onActualizarPerfil={actualizarPerfil}
          />

          <ExplorarFavoritos
            marcaId={marca.id}
            credenciales={credenciales}
            favoritos={resultado.favoritos ?? []}
            onActualizarPerfil={actualizarPerfil}
          />

          <ContactoWhatsappMarca marca={marca} mostrarNumero={false} />

          <section className="mi-cita__resultados">
            <h3 className="mi-cita__seccion-titulo">Mis citas activas</h3>
            {resultado.citas.length === 0 ? (
              <p className="mi-cita__vacio">No tienes citas activas en este momento.</p>
            ) : (
              <>
                <p className="mi-cita__resumen">
                  {resultado.citas.length === 1 ? '1 cita activa' : `${resultado.citas.length} citas activas`}.
                  Puedes cancelar hasta la hora del servicio.
                  {resultado.antelacionReagendarHoras
                    ? ` Reagendar requiere al menos ${resultado.antelacionReagendarHoras} horas de anticipacion.`
                    : ''}
                </p>
                {resultado.citas.map((cita) => (
                  <TarjetaCitaCliente
                    key={cita.codigo}
                    cita={cita}
                    marcaId={marca.id}
                    telefono={credenciales.telefono}
                    whatsappMarca={marca.whatsapp}
                    nombreMarca={marca.nombreComercial}
                    onActualizar={recargar}
                  />
                ))}
              </>
            )}
          </section>

          <button type="button" className="mi-cita__cerrar-sesion" onClick={cerrarSesion}>
            Salir de mi cuenta
          </button>
        </>
      )}

      <p className="mi-cita__enlace-reservar">
        ¿Nueva cita? <Link to={RUTAS_PUBLICAS.reservar(marca?.slug)}>Reservar ahora</Link>
      </p>
    </div>
  );
}
