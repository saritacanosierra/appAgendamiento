import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import {
  BotonPrincipal,
  BotonWhatsapp,
  Cargando,
  EncabezadoMarca,
  MensajeError,
} from '../../../compartido/componentes';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { obtenerConfirmacion } from '../../../modulos/reservas/servicios/reservasServicio';
import { guardarTelefonoLocalMarca } from '../../../modulos/reservas/utilidades/credencialesMiCita';
import { descargarArchivoIcs, formatearHoraLegible } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { mensajeConfirmacionCita } from '../../../compartido/utilidades/enlaceWhatsapp';
import { RUTAS_PUBLICAS } from '../../../compartido/constantes';
import '../../../estilos/publico/confirmacion/confirmacion.css';

export default function ConfirmacionReservaVista() {
  const { codigoReserva, slug } = useParams();
  const ubicacion = useLocation();
  const { marca } = useMarca();
  const previa = ubicacion.state?.confirmacion;
  const previaDeEstaTienda = previa?.cita?.marca?.slug === slug ? previa : null;

  const [confirmacion, setConfirmacion] = useState(previaDeEstaTienda);
  const [cargando, setCargando] = useState(!previaDeEstaTienda);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (confirmacion) return;

    setCargando(true);
    obtenerConfirmacion(codigoReserva, slug)
      .then(setConfirmacion)
      .catch((err) => setError(err.message))
      .finally(() => setCargando(false));
  }, [codigoReserva, slug, confirmacion]);

  useEffect(() => {
    const telefonoCliente = confirmacion?.cita?.cliente?.telefono;
    if (!marca?.id || !telefonoCliente) return;
    guardarTelefonoLocalMarca(marca.id, telefonoCliente);
  }, [marca?.id, confirmacion]);

  if (cargando) return <Cargando mensaje="Cargando confirmacion..." />;
  if (error) return <MensajeError titulo="Reserva no encontrada" mensaje={error} />;
  if (!confirmacion) return null;

  const { cita, calendario, mensajeConfirmacion, avisos } = confirmacion;
  const nombreMarca = marca?.nombreComercial ?? cita.marca.nombreComercial;
  const whatsappReserva = marca?.whatsapp ?? avisos?.contacto?.whatsapp;
  const telefonoMarca = marca?.telefono ?? avisos?.contacto?.telefono;
  const slugMarca = marca?.slug ?? cita.marca.slug;
  const paramsGaleria = new URLSearchParams();
  if (cita.id) paramsGaleria.set('cita', String(cita.id));
  if (cita.servicio?.id) paramsGaleria.set('servicio', String(cita.servicio.id));
  const enlaceGaleria = `${RUTAS_PUBLICAS.galeria(slugMarca)}?${paramsGaleria.toString()}`;
  const fallosAviso = (avisos?.resultados ?? []).filter(
    (item) => item.estado === 'error' || item.estado === 'omitido'
  );
  const mostrarContactoDirecto = Boolean(avisos?.contactarDirecto) || fallosAviso.length > 0;

  return (
    <div className="confirmacion-reserva">
      <EncabezadoMarca marca={marca} compacto />

      <div className="confirmacion-reserva__tarjeta tarjeta-app">
        <span className="confirmacion-reserva__icono" aria-hidden="true">✓</span>
        <h1>¡Cita reservada!</h1>
        <p>{mensajeConfirmacion}</p>
        <p className="confirmacion-reserva__sigue">Tu cita sigue activa en la agenda.</p>
      </div>

      {mostrarContactoDirecto && (
        <section className="confirmacion-reserva__aviso" aria-live="polite">
          <h2>No pudimos enviarte el aviso automático</h2>
          {fallosAviso.length > 0 ? (
            <ul>
              {fallosAviso.map((item) => (
                <li key={`${item.canal}-${item.motivoCodigo || item.motivo}`}>
                  {item.canal === 'correo' ? 'Correo' : 'WhatsApp'}: {item.motivo}
                </li>
              ))}
            </ul>
          ) : (
            <p>{avisos?.contacto?.mensaje || 'Comunícate directamente con la marca.'}</p>
          )}
          <p>
            Comunícate directamente con {nombreMarca}
            {telefonoMarca ? ` al ${telefonoMarca}` : ''}
            .
          </p>
        </section>
      )}

      <dl className="confirmacion-reserva__detalle">
        <dt>Codigo</dt>
        <dd className="confirmacion-reserva__codigo">{cita.codigo}</dd>
        <dt>Servicio</dt>
        <dd>{cita.servicio.nombre}</dd>
        {cita.estilista?.nombre && (
          <>
            <dt>Estilista</dt>
            <dd>{cita.estilista.nombre}</dd>
          </>
        )}
        <dt>Fecha y hora</dt>
        <dd>{cita.fecha} · {formatearHoraLegible(cita.horaInicio)}</dd>
        <dt>Precio</dt>
        <dd>
          {cita.descuentoPremio
            ? `${formatearPrecio(cita.descuentoPremio.precio)} · ${cita.descuentoPremio.porcentaje}% de premio`
            : formatearPrecio(cita.servicio.precio)}
        </dd>
        {cita.marca.direccion && (
          <>
            <dt>Ubicacion</dt>
            <dd>{cita.marca.direccion}</dd>
          </>
        )}
      </dl>

      <div className="confirmacion-reserva__calendario">
        <BotonPrincipal
          href={RUTAS_PUBLICAS.miCita(slugMarca)}
          anchoCompleto
        >
          Gestionar mi cita
        </BotonPrincipal>
        <BotonPrincipal href={enlaceGaleria} anchoCompleto variante="secundario">
          Elegir disenos en galeria
        </BotonPrincipal>
        {whatsappReserva && (
          <BotonWhatsapp
            telefono={whatsappReserva}
            codigoPais={marca?.codigoPais}
            anchoCompleto
            mensaje={mensajeConfirmacionCita({
              nombreMarca,
              servicio: cita.servicio.nombre,
              fecha: cita.fecha,
              hora: formatearHoraLegible(cita.horaInicio),
              codigo: cita.codigo,
            })}
          >
            Confirmar por WhatsApp
          </BotonWhatsapp>
        )}
        <BotonPrincipal
          href={calendario.enlaceGoogle}
          anchoCompleto
          variante="secundario"
        >
          Agregar a Google Calendar
        </BotonPrincipal>
        <BotonPrincipal
          variante="texto"
          anchoCompleto
          onClick={() =>
            descargarArchivoIcs(calendario.icsContenido, calendario.nombreArchivoIcs)
          }
        >
          Descargar archivo .ics
        </BotonPrincipal>
      </div>
    </div>
  );
}
