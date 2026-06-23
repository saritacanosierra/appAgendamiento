import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { BotonPrincipal, Cargando, MensajeError, SelectorFecha } from '../../../compartido/componentes';
import { RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';
import { obtenerReportePlataforma } from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/reportes/reportes.css';

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

export default function ReportesPlataformaVista() {
  const [desde, setDesde] = useState(inicioMesActual);
  const [hasta, setHasta] = useState(finMesActual);
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      setReporte(await obtenerReportePlataforma(desde, hasta));
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
    <div className="reportes-plataforma">
      <header className="reportes-plataforma__cabecera">
        <div>
          <h2>Reportes globales</h2>
          <p>Resumen de todas las marcas en el periodo seleccionado</p>
        </div>
      </header>

      <section className="reportes-plataforma__filtros">
        <SelectorFecha valor={desde} onChange={setDesde} etiqueta="Desde" modo="nativo" />
        <SelectorFecha valor={hasta} onChange={setHasta} etiqueta="Hasta" modo="nativo" />
        <BotonPrincipal tipo="button" onClick={cargar} deshabilitado={cargando}>
          {cargando ? 'Cargando...' : 'Actualizar'}
        </BotonPrincipal>
      </section>

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}

      {cargando && !reporte ? (
        <Cargando />
      ) : reporte ? (
        <>
          <section className="reportes-plataforma__metricas">
            <article>
              <span>Citas totales</span>
              <strong>{reporte.citas.total}</strong>
            </article>
            <article>
              <span>Ingreso estimado</span>
              <strong>{formatearPrecio(reporte.ingresos.estimado)}</strong>
            </article>
            <article>
              <span>Ingreso realizado</span>
              <strong>{formatearPrecio(reporte.ingresos.realizado)}</strong>
            </article>
            <article>
              <span>Clientes nuevas</span>
              <strong>{reporte.clientesNuevas}</strong>
            </article>
          </section>

          <section className="reportes-plataforma__bloque">
            <h3>Citas por estado</h3>
            <ul>
              <li>Pendientes: {reporte.citas.porEstado.pendiente}</li>
              <li>Confirmadas: {reporte.citas.porEstado.confirmada}</li>
              <li>Completadas: {reporte.citas.porEstado.completada}</li>
              <li>Canceladas: {reporte.citas.porEstado.cancelada}</li>
            </ul>
          </section>

          <section className="reportes-plataforma__bloque">
            <h3>Desglose por marca</h3>
            {reporte.porMarca.length === 0 ? (
              <p>Sin actividad en este periodo.</p>
            ) : (
              <table className="reportes-plataforma__tabla">
                <thead>
                  <tr>
                    <th>Marca</th>
                    <th>Citas</th>
                    <th>Ingreso</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {reporte.porMarca.map((marca) => (
                    <tr key={marca.id}>
                      <td>{marca.nombreComercial}</td>
                      <td>{marca.citas}</td>
                      <td>{formatearPrecio(marca.ingreso)}</td>
                      <td>
                        <Link to={RUTAS_PLATAFORMA.editarMarca(marca.id)}>Editar</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}
