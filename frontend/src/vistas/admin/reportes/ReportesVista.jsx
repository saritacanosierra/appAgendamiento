import { useCallback, useEffect, useState } from 'react';
import { BotonPrincipal, Cargando, MensajeError, SelectorFecha } from '../../../compartido/componentes';
import { obtenerReporte } from '../../../modulos/reportes/servicios/reportesServicio';
import '../../../estilos/admin/reportes/reportes.css';

function inicioMesActual() {
  const hoy = new Date();
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  return `${hoy.getFullYear()}-${mes}-01`;
}

function finMesActual() {
  const hoy = new Date();
  const ultimo = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${ultimo.getFullYear()}-${pad(ultimo.getMonth() + 1)}-${pad(ultimo.getDate())}`;
}

function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(valor ?? 0);
}

function formatearFechaLegible(fecha) {
  if (!fecha) return '';
  const [y, m, d] = fecha.split('-');
  const meses = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  return `${Number(d)} ${meses[Number(m) - 1]} ${y}`;
}

export default function ReportesVista() {
  const [desde, setDesde] = useState(inicioMesActual);
  const [hasta, setHasta] = useState(finMesActual);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerReporte(desde, hasta);
      setReporte(datos);
    } catch (err) {
      setError(err.message);
      setReporte(null);
    } finally {
      setCargando(false);
    }
  }, [desde, hasta]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div className="reportes-vista">
      <header className="reportes-vista__cabecera">
        <div>
          <h1>Reportes</h1>
          <p className="reportes-vista__subtitulo">
            Resumen de citas, ingresos y clientes por periodo
          </p>
        </div>
      </header>

      <section className="reportes-vista__filtros">
        <SelectorFecha valor={desde} onChange={setDesde} etiqueta="Desde" />
        <SelectorFecha valor={hasta} onChange={setHasta} etiqueta="Hasta" />
        <BotonPrincipal type="button" onClick={cargar} deshabilitado={cargando}>
          {cargando ? 'Cargando...' : 'Actualizar'}
        </BotonPrincipal>
      </section>

      {error && <MensajeError mensaje={error} />}

      {cargando && !reporte ? (
        <Cargando mensaje="Generando reporte..." />
      ) : reporte ? (
        <>
          <p className="reportes-vista__periodo">
            Periodo: {formatearFechaLegible(reporte.periodo.desde)} —{' '}
            {formatearFechaLegible(reporte.periodo.hasta)}
          </p>

          <section className="reportes-vista__tarjetas">
            <div className="reportes-vista__tarjeta">
              <span>Citas totales</span>
              <strong>{reporte.citas.total}</strong>
            </div>
            <div className="reportes-vista__tarjeta">
              <span>Citas activas</span>
              <strong>{reporte.citas.activas}</strong>
            </div>
            <div className="reportes-vista__tarjeta">
              <span>Clientes nuevas</span>
              <strong>{reporte.clientesNuevas}</strong>
            </div>
            <div className="reportes-vista__tarjeta reportes-vista__tarjeta--destacada">
              <span>Ingreso estimado</span>
              <strong>{formatearMoneda(reporte.ingresos.estimado)}</strong>
              <small>Sin canceladas</small>
            </div>
            <div className="reportes-vista__tarjeta">
              <span>Ingreso realizado</span>
              <strong>{formatearMoneda(reporte.ingresos.realizado)}</strong>
              <small>Citas completadas</small>
            </div>
          </section>

          <section className="reportes-vista__seccion">
            <h2>Por estado</h2>
            <ul className="reportes-vista__estados">
              <li><span>Pendientes</span><strong>{reporte.citas.porEstado.pendiente}</strong></li>
              <li><span>Confirmadas</span><strong>{reporte.citas.porEstado.confirmada}</strong></li>
              <li><span>Completadas</span><strong>{reporte.citas.porEstado.completada}</strong></li>
              <li><span>Canceladas</span><strong>{reporte.citas.porEstado.cancelada}</strong></li>
            </ul>
          </section>

          {reporte.serviciosPopulares?.length > 0 && (
            <section className="reportes-vista__seccion">
              <h2>Servicios mas solicitados</h2>
              <div className="reportes-vista__tabla-wrap">
                <table className="reportes-vista__tabla">
                  <thead>
                    <tr>
                      <th>Servicio</th>
                      <th>Citas</th>
                      <th>Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.serviciosPopulares.map((s) => (
                      <tr key={s.nombre}>
                        <td>{s.nombre}</td>
                        <td>{s.citas}</td>
                        <td>{formatearMoneda(s.ingreso)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {reporte.citasPorDia?.length > 0 && (
            <section className="reportes-vista__seccion">
              <h2>Citas por dia</h2>
              <div className="reportes-vista__tabla-wrap">
                <table className="reportes-vista__tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Citas</th>
                      <th>Ingreso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporte.citasPorDia.map((d) => (
                      <tr key={d.fecha}>
                        <td>{formatearFechaLegible(d.fecha)}</td>
                        <td>{d.total}</td>
                        <td>{formatearMoneda(d.ingreso)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          {reporte.citas.total === 0 && (
            <p className="reportes-vista__vacio">No hay citas en este periodo.</p>
          )}
        </>
      ) : null}
    </div>
  );
}
