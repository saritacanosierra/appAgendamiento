import { useCallback, useEffect, useState } from 'react';
import {
  BotonPrincipal,
  Cargando,
  MensajeError,
  SelectorFecha,
} from '../../../compartido/componentes';
import { fechaHoyLocal } from '../../../modulos/reservas/utilidades/calendarioCliente';
import FormularioCitaAdmin from '../../../componentes/admin/formulario_cita_admin/FormularioCitaAdmin';
import TarjetaCitaAdmin from '../../../componentes/admin/tarjeta_cita_admin/TarjetaCitaAdmin';
import {
  actualizarCita,
  cancelarCita,
  obtenerAgenda,
} from '../../../modulos/agenda/servicios/agendaServicio';
import '../../../estilos/admin/agenda/agenda.css';

export default function AgendaVista() {
  const [fecha, setFecha] = useState(fechaHoyLocal());
  const [vista, setVista] = useState('dia');
  const [agenda, setAgenda] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [mostrarFormCita, setMostrarFormCita] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await obtenerAgenda(fecha, vista);
      setAgenda(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [fecha, vista]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function confirmarCita(cita) {
    try {
      await actualizarCita(cita.id, { estado: 'confirmada' });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  async function cancelarCitaHandler(cita) {
    if (!window.confirm(`¿Cancelar cita de ${cita.cliente.nombre}?`)) return;
    try {
      await cancelarCita(cita.id);
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  function cambiarDia(offset) {
    const [y, m, d] = fecha.split('-').map(Number);
    const dt = new Date(y, m - 1, d);
    dt.setDate(dt.getDate() + offset);
    const pad = (n) => String(n).padStart(2, '0');
    setFecha(`${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`);
  }

  return (
    <div className="agenda-vista">
      <header className="agenda-vista__cabecera">
        <h1>Agenda</h1>
        <div className="agenda-vista__cabecera-acciones">
          <div className="agenda-vista__tabs">
            <button
              type="button"
              className={vista === 'dia' ? 'activo' : ''}
              onClick={() => setVista('dia')}
            >
              Dia
            </button>
            <button
              type="button"
              className={vista === 'semana' ? 'activo' : ''}
              onClick={() => setVista('semana')}
            >
              Semana
            </button>
          </div>
          <BotonPrincipal onClick={() => setMostrarFormCita(!mostrarFormCita)}>
            {mostrarFormCita ? 'Cerrar' : '+ Nueva cita'}
          </BotonPrincipal>
        </div>
      </header>

      {mostrarFormCita && (
        <FormularioCitaAdmin
          fechaInicial={fecha}
          onCreada={() => {
            setMostrarFormCita(false);
            cargar();
          }}
          onCancelar={() => setMostrarFormCita(false)}
        />
      )}

      <div className="agenda-vista__navegacion">
        <BotonPrincipal variante="texto" onClick={() => cambiarDia(vista === 'dia' ? -1 : -7)}>
          ← Anterior
        </BotonPrincipal>
        <SelectorFecha valor={fecha} onChange={setFecha} etiqueta="Fecha" />
        <BotonPrincipal variante="texto" onClick={() => cambiarDia(vista === 'dia' ? 1 : 7)}>
          Siguiente →
        </BotonPrincipal>
      </div>

      {agenda?.resumen && (
        <div className="agenda-vista__resumen">
          <span>{agenda.resumen.total} citas</span>
          <span>{agenda.resumen.pendientes} pendientes</span>
          <span>{agenda.resumen.confirmadas} confirmadas</span>
        </div>
      )}

      {error && <MensajeError mensaje={error} onReintentar={cargar} />}
      {cargando && <Cargando />}

      {!cargando && agenda && (
        <div className="agenda-vista__lista">
          {agenda.citas.length === 0 ? (
            <p className="agenda-vista__vacio">No hay citas en este periodo.</p>
          ) : (
            agenda.citas.map((cita) => (
              <div key={cita.id}>
                {vista === 'semana' && (
                  <p className="agenda-vista__fecha-grupo">{cita.fecha}</p>
                )}
                <TarjetaCitaAdmin
                  cita={cita}
                  onConfirmar={confirmarCita}
                  onCancelar={cancelarCitaHandler}
                />
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
