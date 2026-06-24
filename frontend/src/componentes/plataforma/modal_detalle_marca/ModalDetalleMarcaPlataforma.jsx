import { Link } from 'react-router-dom';
import { BotonPrincipal, IconoApp } from '../../../compartido/componentes';
import { RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { ModalPortal } from '../../../compartido/utilidades/modalPortal';
import { formatearFecha } from '../../../compartido/utilidades/temaMarca';
import EnlacesEntregaMarca from '../enlaces_entrega_marca/EnlacesEntregaMarca';
import {
  obtenerDiasRestantes,
  textoDiasDesdeFacturacion,
  textoDiasParaVencer,
  estaSuscripcionVencida,
} from '../../../modulos/plataforma/utilidades/suscripcionMarca';
import '../../../estilos/plataforma/marcas/modal_detalle_marca.css';

function EstadoBadge({ activa, planHabilitado, suscripcion }) {
  if (!activa) {
    return <span className="modal-marca__badge modal-marca__badge--suspendida">Suspendida</span>;
  }
  if (suscripcion?.vencido) {
    return <span className="modal-marca__badge modal-marca__badge--vencida">Vencida</span>;
  }
  if (suscripcion?.porVencer) {
    return <span className="modal-marca__badge modal-marca__badge--por-vencer">Por vencer</span>;
  }
  if (!planHabilitado) {
    return <span className="modal-marca__badge modal-marca__badge--plan">Sin plan</span>;
  }
  return <span className="modal-marca__badge modal-marca__badge--activa">Activa</span>;
}

function FilaDetalle({ etiqueta, valor, vacio = 'Sin dato' }) {
  return (
    <div className="modal-marca__fila">
      <dt>{etiqueta}</dt>
      <dd>{valor || <span className="modal-marca__vacio">{vacio}</span>}</dd>
    </div>
  );
}

export default function ModalDetalleMarcaPlataforma({
  marca,
  abierto,
  cargando = false,
  onCerrar,
  entrandoPanel,
  onEntrarPanel,
  onToggleActiva,
  onTogglePlan,
}) {
  if (!marca) return null;

  const sus = marca.suscripcion;
  const diasRestantes = obtenerDiasRestantes(sus);
  const vencido = estaSuscripcionVencida(sus);

  return (
    <ModalPortal abierto={abierto}>
      <div className="modal-marca" role="dialog" aria-modal="true" aria-labelledby="modal-marca-titulo">
        <button type="button" className="modal-marca__fondo" onClick={onCerrar} aria-label="Cerrar" />
        <div className="modal-marca__panel">
          <header className="modal-marca__cabecera">
            <div>
              <h2 id="modal-marca-titulo">{marca.nombreComercial}</h2>
              <p className="modal-marca__slug">/m/{marca.slug}</p>
            </div>
            <button type="button" className="modal-marca__cerrar" onClick={onCerrar} aria-label="Cerrar">
              <IconoApp nombre="cerrar" tamano="sm" />
            </button>
          </header>

          <div className="modal-marca__estado">
            <EstadoBadge
              activa={marca.activa}
              planHabilitado={marca.planHabilitado}
              suscripcion={sus}
            />
          </div>

          <div className="modal-marca__cuerpo">
            {cargando && (
              <p className="modal-marca__cargando">Actualizando datos de suscripcion...</p>
            )}
            <section className="modal-marca__seccion">
              <h3>Suscripcion</h3>

              {sus?.venceEn && !vencido && diasRestantes != null && (
                <div className="modal-marca__cuenta-regresiva" aria-live="polite">
                  <strong className="modal-marca__cuenta-numero">{diasRestantes}</strong>
                  <span className="modal-marca__cuenta-etiqueta">
                    {diasRestantes === 1 ? 'dia para vencer' : 'dias para vencer'}
                  </span>
                </div>
              )}

              <dl className="modal-marca__grid">
                <FilaDetalle
                  etiqueta="Plan"
                  valor={sus?.configurado ? sus.tipoEtiqueta : null}
                  vacio="Sin configurar"
                />
                <FilaDetalle
                  etiqueta="Activado el"
                  valor={sus?.inicioEn ? formatearFecha(sus.inicioEn) : null}
                />
                <FilaDetalle
                  etiqueta="Vence"
                  valor={sus?.venceEn ? formatearFecha(sus.venceEn) : null}
                />
                <FilaDetalle
                  etiqueta="Faltan para vencer"
                  valor={textoDiasParaVencer(sus)}
                />
                <FilaDetalle
                  etiqueta="Dias desde facturacion"
                  valor={textoDiasDesdeFacturacion(sus)}
                />
              </dl>
            </section>

            <section className="modal-marca__seccion">
              <h3>Administrador</h3>
              <dl className="modal-marca__grid">
                <FilaDetalle etiqueta="Nombre" valor={marca.adminNombre} />
                <FilaDetalle etiqueta="Correo" valor={marca.adminCorreo} />
              </dl>
            </section>

            <section className="modal-marca__seccion">
              <h3>Contacto</h3>
              <dl className="modal-marca__grid">
                <FilaDetalle etiqueta="Telefono" valor={marca.telefono} />
                <FilaDetalle etiqueta="WhatsApp" valor={marca.whatsapp} />
                <FilaDetalle etiqueta="Direccion" valor={marca.direccion} />
              </dl>
            </section>

            <section className="modal-marca__seccion">
              <h3>Actividad</h3>
              <dl className="modal-marca__grid">
                <FilaDetalle etiqueta="Citas" valor={String(marca.totalCitas ?? 0)} />
                <FilaDetalle etiqueta="Usuarios" valor={String(marca.totalUsuarios ?? 0)} />
              </dl>
            </section>

            <section className="modal-marca__seccion">
              <h3>Enlaces para el cliente</h3>
              <EnlacesEntregaMarca marca={marca} />
            </section>
          </div>

          <footer className="modal-marca__acciones">
            <BotonPrincipal
              onClick={() => onEntrarPanel(marca)}
              deshabilitado={entrandoPanel === marca.id}
            >
              {entrandoPanel === marca.id ? 'Entrando...' : 'Entrar al panel'}
            </BotonPrincipal>
            <Link to={RUTAS_PLATAFORMA.editarMarca(marca.id)} className="modal-marca__link">
              Editar empresa
            </Link>
            <div className="modal-marca__acciones-secundarias">
              <button type="button" onClick={() => onToggleActiva(marca)}>
                {marca.activa ? 'Suspender marca' : 'Activar marca'}
              </button>
              <button type="button" onClick={() => onTogglePlan(marca)}>
                {marca.planHabilitado ? 'Quitar plan manual' : 'Habilitar plan manual'}
              </button>
            </div>
          </footer>
        </div>
      </div>
    </ModalPortal>
  );
}
