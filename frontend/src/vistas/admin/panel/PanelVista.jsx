import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import { BotonPrincipal, Cargando } from '../../../compartido/componentes';
import { RUTAS_ADMIN, RUTAS_PUBLICAS } from '../../../compartido/constantes';
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

  const slug = marca?.slug;

  return (
    <div className="panel-admin">
      <h1>Tu app — {marca?.nombreComercial}</h1>
      <p>
        Bienvenida, <strong>{usuario?.nombre}</strong>. Aqui gestionas todo lo de tu empresa
        de forma independiente.
      </p>

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

      <section className="panel-admin__modulos">
        <h2>Gestion de tu marca</h2>
        <div className="panel-admin__modulos-grid">
          <Link to={RUTAS_ADMIN.configuracionMarca} className="panel-admin__modulo">
            <strong>Mi marca</strong>
            <span>Nombre, colores, logo, horarios y Google Calendar</span>
          </Link>
          <Link to={RUTAS_ADMIN.agenda} className="panel-admin__modulo">
            <strong>Agenda</strong>
            <span>Citas y calendario de tu empresa</span>
          </Link>
          <Link to={RUTAS_ADMIN.galeria} className="panel-admin__modulo">
            <strong>Galeria</strong>
            <span>Fotos de disenos y trabajos</span>
          </Link>
          <Link to={RUTAS_ADMIN.blog} className="panel-admin__modulo">
            <strong>Blog</strong>
            <span>Publicaciones y novedades</span>
          </Link>
          <Link to={RUTAS_ADMIN.clientes} className="panel-admin__modulo">
            <strong>Clientes</strong>
            <span>Base de clientes propia</span>
          </Link>
          <Link to={RUTAS_ADMIN.servicios} className="panel-admin__modulo">
            <strong>Servicios</strong>
            <span>Catalogo y precios</span>
          </Link>
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
        {slug && (
          <BotonPrincipal
            href={RUTAS_PUBLICAS.inicioMarca(slug)}
            variante="secundario"
            anchoCompleto
          >
            Ver sitio publico de clientes
          </BotonPrincipal>
        )}
      </div>
    </div>
  );
}
