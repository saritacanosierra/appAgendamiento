import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { BotonPrincipal, Cargando } from '../../../compartido/componentes';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import { fechaHoyLocal } from '../../../modulos/reservas/utilidades/calendarioCliente';
import { obtenerAgenda } from '../../../modulos/agenda/servicios/agendaServicio';
import PanelNotificaciones from '../../../componentes/admin/panel_notificaciones/PanelNotificaciones';
import '../../../estilos/admin/panel/panel.css';

export default function PanelVista() {
  const { usuario, marca } = useAuth();
  const [agenda, setAgenda] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    obtenerAgenda(fechaHoyLocal(), 'dia')
      .then(setAgenda)
      .catch(() => setAgenda(null))
      .finally(() => setCargando(false));
  }, []);

  return (
    <div className="panel-admin">
      <h1>Panel principal</h1>
      <p>Bienvenida, <strong>{usuario?.nombre}</strong> — {marca?.nombreComercial}</p>

      <section className="panel-admin__resumen">
        <div className="panel-admin__tarjeta">
          <span>Citas hoy</span>
          <strong>{cargando ? '...' : agenda?.resumen?.total ?? 0}</strong>
        </div>
        <div className="panel-admin__tarjeta">
          <span>Pendientes</span>
          <strong>{cargando ? '...' : agenda?.resumen?.pendientes ?? 0}</strong>
        </div>
        <div className="panel-admin__tarjeta">
          <span>Confirmadas</span>
          <strong>{cargando ? '...' : agenda?.resumen?.confirmadas ?? 0}</strong>
        </div>
      </section>

      <PanelNotificaciones />

      {!cargando && agenda?.citas?.length > 0 && (
        <section className="panel-admin__proximas">
          <h2>Proximas citas de hoy</h2>
          <ul>
            {agenda.citas.slice(0, 5).map((c) => (
              <li key={c.id}>
                <strong>{c.horaInicio}</strong> — {c.cliente.nombre} · {c.servicio.nombre}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="panel-admin__acciones">
        <BotonPrincipal href={RUTAS_ADMIN.agenda} anchoCompleto>
          Ver agenda completa
        </BotonPrincipal>
        <BotonPrincipal href={RUTAS_ADMIN.reportes} variante="secundario" anchoCompleto>
          Ver reportes del mes
        </BotonPrincipal>
        <Link to={RUTAS_ADMIN.clientes}>Gestionar clientes</Link>
      </div>
    </div>
  );
}
