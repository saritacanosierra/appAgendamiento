import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  BotonPrincipal,
  CampoFormulario,
  Cargando,
  InputTexto,
  MensajeError,
} from '../../../compartido/componentes';
import { RUTAS_PLATAFORMA } from '../../../compartido/constantes';
import { formatearFecha } from '../../../compartido/utilidades/temaMarca';
import {
  activarSuscripcionMarcaPlataforma,
  actualizarMarcaPlataforma,
  listarHistorialSuscripcionMarcaPlataforma,
  obtenerMarcaPlataforma,
  renovarSuscripcionMarcaPlataforma,
  resetearContrasenaMarcaPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import { textoDiasDesdeFacturacion, textoDiasParaVencer } from '../../../modulos/plataforma/utilidades/suscripcionMarca';
import '../../../estilos/plataforma/marcas/editar_marca.css';

const PLANES = [
  { valor: 'mensual', etiqueta: 'Mensual' },
  { valor: 'trimestral', etiqueta: 'Trimestral' },
  { valor: 'semestral', etiqueta: 'Semestral' },
  { valor: 'anual', etiqueta: 'Anual' },
];

function ResumenSuscripcion({ suscripcion }) {
  if (!suscripcion?.configurado) {
    return <p className="editar-marca-plataforma__hint">Sin plan configurado. Activa uno para contar la vigencia.</p>;
  }

  return (
    <dl className="editar-marca-plataforma__suscripcion-resumen">
      <div>
        <dt>Plan</dt>
        <dd>{suscripcion.tipoEtiqueta}</dd>
      </div>
      <div>
        <dt>Activado el</dt>
        <dd>{suscripcion.inicioEn ? formatearFecha(suscripcion.inicioEn) : '—'}</dd>
      </div>
      <div>
        <dt>Vence</dt>
        <dd>{formatearFecha(suscripcion.venceEn)}</dd>
      </div>
      <div>
        <dt>Dias desde facturacion</dt>
        <dd>{textoDiasDesdeFacturacion(suscripcion) ?? '—'}</dd>
      </div>
      <div>
        <dt>Faltan para vencer</dt>
        <dd className={suscripcion.vencido ? 'editar-marca-plataforma__vencido' : ''}>
          {textoDiasParaVencer(suscripcion) ?? '—'}
        </dd>
      </div>
      {suscripcion.monto != null && (
        <div>
          <dt>Monto</dt>
          <dd>${Number(suscripcion.monto).toLocaleString('es-CO')}</dd>
        </div>
      )}
    </dl>
  );
}

export default function EditarMarcaPlataformaVista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [suscripcion, setSuscripcion] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [planForm, setPlanForm] = useState({ plan_tipo: 'mensual', monto: '' });
  const [adminCorreo, setAdminCorreo] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [procesandoPlan, setProcesandoPlan] = useState(false);
  const [reseteando, setReseteando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const [marca, historialItems] = await Promise.all([
        obtenerMarcaPlataforma(id),
        listarHistorialSuscripcionMarcaPlataforma(id).catch(() => []),
      ]);
      setAdminCorreo(marca.adminCorreo ?? '');
      setAdminNombre(marca.adminNombre ?? '');
      setSuscripcion(marca.suscripcion ?? null);
      setHistorial(historialItems);
      setPlanForm({
        plan_tipo: marca.suscripcion?.tipo ?? 'mensual',
        monto: marca.suscripcion?.monto ?? '',
      });
      setForm({
        nombre_comercial: marca.nombreComercial,
        slug: marca.slug,
        telefono: marca.telefono ?? '',
        whatsapp: marca.whatsapp ?? '',
        direccion: marca.direccion ?? '',
        activa: marca.activa,
        plan_habilitado: marca.planHabilitado,
        totalCitas: marca.totalCitas,
        totalUsuarios: marca.totalUsuarios,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, [id]);

  async function guardar(e) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    setMensaje(null);
    try {
      await actualizarMarcaPlataforma(id, form);
      setMensaje('Empresa actualizada correctamente.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
    }
  }

  async function activarPlan(e) {
    e.preventDefault();
    setProcesandoPlan(true);
    setError(null);
    setMensaje(null);
    try {
      await activarSuscripcionMarcaPlataforma(id, {
        plan_tipo: planForm.plan_tipo,
        monto: planForm.monto || null,
      });
      setMensaje('Plan activado. El conteo inicia hoy.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoPlan(false);
    }
  }

  async function renovarPlan(e) {
    e.preventDefault();
    setProcesandoPlan(true);
    setError(null);
    setMensaje(null);
    try {
      await renovarSuscripcionMarcaPlataforma(id, {
        plan_tipo: planForm.plan_tipo,
        monto: planForm.monto || null,
      });
      setMensaje('Plan renovado correctamente.');
      await cargar();
    } catch (err) {
      setError(err.message);
    } finally {
      setProcesandoPlan(false);
    }
  }

  async function resetearContrasena(e) {
    e.preventDefault();
    if (!nuevaContrasena || nuevaContrasena.length < 8) {
      setError('La contrasena debe tener al menos 8 caracteres.');
      return;
    }
    setReseteando(true);
    setError(null);
    setMensaje(null);
    try {
      await resetearContrasenaMarcaPlataforma(id, nuevaContrasena);
      setNuevaContrasena('');
      setMensaje(`Contrasena actualizada para ${adminCorreo}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setReseteando(false);
    }
  }

  if (cargando) return <Cargando />;
  if (error && !form) return <MensajeError mensaje={error} onReintentar={cargar} />;
  if (!form) return null;

  return (
    <div className="editar-marca-plataforma">
      <p className="editar-marca-plataforma__volver">
        <Link to={RUTAS_PLATAFORMA.marcas}>← Volver a empresas</Link>
      </p>

      <header className="editar-marca-plataforma__cabecera">
        <div>
          <h2>Editar empresa</h2>
          <p>
            {form.totalCitas} citas · {form.totalUsuarios} usuarios ·{' '}
            <a href={`/m/${form.slug}`} target="_blank" rel="noreferrer">
              Ver sitio publico
            </a>
          </p>
        </div>
      </header>

      {error && <MensajeError mensaje={error} />}
      {mensaje && <p className="editar-marca-plataforma__exito">{mensaje}</p>}

      <section className="editar-marca-plataforma__suscripcion">
        <h3>Suscripcion del servicio</h3>
        <p className="editar-marca-plataforma__hint">
          El tiempo se cuenta desde la activacion o renovacion hasta la fecha de vencimiento.
          Al vencer, se bloquea el panel admin y el sitio publico hasta reactivar.
        </p>

        <ResumenSuscripcion suscripcion={suscripcion} />

        <form className="editar-marca-plataforma__suscripcion-form" onSubmit={suscripcion?.configurado ? renovarPlan : activarPlan}>
          <CampoFormulario etiqueta="Tipo de plan" id="em-plan-tipo" requerido>
            <select
              id="em-plan-tipo"
              value={planForm.plan_tipo}
              onChange={(e) => setPlanForm({ ...planForm, plan_tipo: e.target.value })}
            >
              {PLANES.map((plan) => (
                <option key={plan.valor} value={plan.valor}>{plan.etiqueta}</option>
              ))}
            </select>
          </CampoFormulario>
          <CampoFormulario etiqueta="Monto facturado (opcional)" id="em-plan-monto">
            <input
              id="em-plan-monto"
              type="number"
              min="0"
              step="0.01"
              value={planForm.monto}
              onChange={(e) => setPlanForm({ ...planForm, monto: e.target.value })}
              placeholder="Ej. 150000"
            />
          </CampoFormulario>
          <div className="editar-marca-plataforma__acciones">
            <BotonPrincipal tipo="submit" deshabilitado={procesandoPlan}>
              {procesandoPlan
                ? 'Procesando...'
                : suscripcion?.configurado
                  ? 'Renovar plan'
                  : 'Activar plan'}
            </BotonPrincipal>
          </div>
        </form>

        {historial.length > 0 && (
          <div className="editar-marca-plataforma__historial">
            <h4>Historial de facturacion</h4>
            <ul>
              {historial.map((item) => (
                <li key={item.id}>
                  <strong>{item.accion === 'activacion' ? 'Activacion' : 'Renovacion'}</strong>
                  {' — '}
                  {item.planTipo}, {formatearFecha(item.inicioEn)} → {formatearFecha(item.venceEn)}
                  {item.monto != null && ` · $${Number(item.monto).toLocaleString('es-CO')}`}
                </li>
              ))}
            </ul>
          </div>
        )}
      </section>

      <form className="editar-marca-plataforma__formulario" onSubmit={guardar}>
        <CampoFormulario etiqueta="Nombre comercial" id="em-nombre" requerido>
          <InputTexto
            id="em-nombre"
            capitalizar="palabras"
            value={form.nombre_comercial}
            onChange={(e) => setForm({ ...form, nombre_comercial: e.target.value })}
            required
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="Slug URL" id="em-slug" requerido>
          <InputTexto
            id="em-slug"
            capitalizar={false}
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            required
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="Telefono" id="em-tel">
          <input
            id="em-tel"
            value={form.telefono}
            onChange={(e) => setForm({ ...form, telefono: e.target.value })}
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="WhatsApp" id="em-wa">
          <input
            id="em-wa"
            value={form.whatsapp}
            onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
          />
        </CampoFormulario>
        <CampoFormulario etiqueta="Direccion" id="em-dir">
          <input
            id="em-dir"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
          />
        </CampoFormulario>

        <label className="editar-marca-plataforma__check">
          <input
            type="checkbox"
            checked={form.activa}
            onChange={(e) => setForm({ ...form, activa: e.target.checked })}
          />
          Empresa activa (visible en plataforma)
        </label>
        <label className="editar-marca-plataforma__check">
          <input
            type="checkbox"
            checked={form.plan_habilitado}
            onChange={(e) => setForm({ ...form, plan_habilitado: e.target.checked })}
          />
          Plan habilitado manualmente (usar solo si no hay vigencia configurada)
        </label>

        <div className="editar-marca-plataforma__acciones">
          <BotonPrincipal tipo="submit" deshabilitado={enviando}>
            {enviando ? 'Guardando...' : 'Guardar cambios'}
          </BotonPrincipal>
          <BotonPrincipal tipo="button" variante="secundario" onClick={() => navigate(RUTAS_PLATAFORMA.marcas)}>
            Cancelar
          </BotonPrincipal>
        </div>
      </form>

      <section className="editar-marca-plataforma__admin">
        <h3>Administrador de la marca</h3>
        {adminCorreo ? (
          <>
            <p><strong>{adminNombre}</strong> — {adminCorreo}</p>
            <form className="editar-marca-plataforma__reset" onSubmit={resetearContrasena}>
              <CampoFormulario etiqueta="Nueva contrasena" id="em-pass" requerido>
                <input
                  id="em-pass"
                  type="password"
                  minLength={8}
                  value={nuevaContrasena}
                  onChange={(e) => setNuevaContrasena(e.target.value)}
                  placeholder="Minimo 8 caracteres"
                  required
                />
              </CampoFormulario>
              <BotonPrincipal tipo="submit" variante="secundario" deshabilitado={reseteando}>
                {reseteando ? 'Actualizando...' : 'Resetear contrasena del admin'}
              </BotonPrincipal>
            </form>
          </>
        ) : (
          <p>No hay administrador registrado para esta marca.</p>
        )}
      </section>
    </div>
  );
}
