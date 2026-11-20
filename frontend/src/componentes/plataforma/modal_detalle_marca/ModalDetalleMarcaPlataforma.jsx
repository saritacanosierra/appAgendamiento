import { useEffect, useState } from 'react';
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

function textoFechaCopia(iso) {
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) return 'Copia guardada';
  return fecha.toLocaleString('es-CO', { dateStyle: 'medium', timeStyle: 'short' });
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
  eliminando = false,
  onEliminar,
  copias = [],
  cargandoCopias = false,
  guardandoCopia = false,
  restaurandoCopia = false,
  onGuardarCopia,
  onDescargarCopia,
  onRestaurarCopia,
  onSubirCopia,
}) {
  const [confirmarBorrado, setConfirmarBorrado] = useState(false);
  const [copiaConfirmada, setCopiaConfirmada] = useState(null);

  useEffect(() => {
    setConfirmarBorrado(false);
    setCopiaConfirmada(null);
  }, [marca?.id]);

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
              <h3>Copia de esta empresa</h3>
              <p className="modal-marca__copia-ayuda">
                Cada semana se guarda sola una copia de esta empresa. También puedes guardarla ahora. Al restaurarla, las demás no cambian y esta vuelve a la fecha de la copia. Las fotos siguen en su archivo.
              </p>
              <button
                type="button"
                className="modal-marca__copia-guardar"
                onClick={() => onGuardarCopia(marca)}
                disabled={guardandoCopia || restaurandoCopia}
              >
                {guardandoCopia ? 'Guardando copia...' : 'Guardar copia de esta empresa'}
              </button>
              <label className="modal-marca__copia-subir">
                Subir una copia
                <input
                  className="modal-marca__archivo"
                  type="file"
                  accept="application/json,.json"
                  onChange={(e) => {
                    const archivo = e.target.files?.[0];
                    e.target.value = '';
                    if (archivo) onSubirCopia(archivo);
                  }}
                />
              </label>
              {cargandoCopias && <p className="modal-marca__cargando">Buscando copias...</p>}
              {!cargandoCopias && copias.length === 0 && (
                <p className="modal-marca__copia-vacia">Todavía no hay una copia de esta empresa.</p>
              )}
              {copias.length > 0 && (
                <ul className="modal-marca__copias">
                  {copias.map((copia) => (
                    <li key={copia.archivo}>
                      <p>
                        {textoFechaCopia(copia.guardadaEn)}
                        <span>
                          {copia.origen === 'automatica' ? 'Copia automática' : 'Copia manual'}
                          {' · '}
                          {copia.clientes} clientas · {copia.citas} citas
                        </span>
                      </p>
                      {copiaConfirmada === copia.archivo ? (
                        <div className="modal-marca__copia-confirmar">
                          <p>
                            Se devuelve {marca.nombreComercial} a esta copia. Las demás empresas no se tocan. Las citas de esta empresa hechas después se reemplazan.
                          </p>
                          <div className="modal-marca__borrar-acciones">
                            <button type="button" onClick={() => setCopiaConfirmada(null)} disabled={restaurandoCopia}>
                              Cancelar
                            </button>
                            <button
                              type="button"
                              className="modal-marca__copia-restaurar"
                              onClick={() => onRestaurarCopia(copia)}
                              disabled={restaurandoCopia}
                            >
                              {restaurandoCopia ? 'Restaurando...' : 'Restaurar esta copia'}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="modal-marca__copia-acciones">
                          <button type="button" onClick={() => onDescargarCopia(copia)}>
                            Descargar
                          </button>
                          <button type="button" onClick={() => setCopiaConfirmada(copia.archivo)}>
                            Restaurar
                          </button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
            {confirmarBorrado ? (
              <div className="modal-marca__borrar">
                <p>
                  Se elimina {marca.nombreComercial}, su agenda y el acceso del propietario de la marca. No se puede deshacer.
                </p>
                <div className="modal-marca__borrar-acciones">
                  <button type="button" onClick={() => setConfirmarBorrado(false)} disabled={eliminando}>
                    Cancelar
                  </button>
                  <button
                    type="button"
                    className="modal-marca__borrar-confirmar"
                    onClick={() => onEliminar(marca)}
                    disabled={eliminando}
                  >
                    {eliminando ? 'Eliminando...' : 'Eliminar empresa'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                className="modal-marca__eliminar"
                onClick={() => setConfirmarBorrado(true)}
              >
                Eliminar empresa
              </button>
            )}
          </footer>
        </div>
      </div>
    </ModalPortal>
  );
}
