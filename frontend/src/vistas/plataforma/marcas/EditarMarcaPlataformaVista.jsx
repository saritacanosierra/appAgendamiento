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
import {
  actualizarMarcaPlataforma,
  obtenerMarcaPlataforma,
  resetearContrasenaMarcaPlataforma,
} from '../../../modulos/plataforma/servicios/plataformaServicio';
import '../../../estilos/plataforma/marcas/editar_marca.css';

export default function EditarMarcaPlataformaVista() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [adminCorreo, setAdminCorreo] = useState('');
  const [adminNombre, setAdminNombre] = useState('');
  const [nuevaContrasena, setNuevaContrasena] = useState('');
  const [cargando, setCargando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [reseteando, setReseteando] = useState(false);
  const [error, setError] = useState(null);
  const [mensaje, setMensaje] = useState(null);

  async function cargar() {
    setCargando(true);
    setError(null);
    try {
      const marca = await obtenerMarcaPlataforma(id);
      setAdminCorreo(marca.adminCorreo ?? '');
      setAdminNombre(marca.adminNombre ?? '');
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
    } catch (err) {
      setError(err.message);
    } finally {
      setEnviando(false);
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
          Empresa activa (visible y operativa)
        </label>
        <label className="editar-marca-plataforma__check">
          <input
            type="checkbox"
            checked={form.plan_habilitado}
            onChange={(e) => setForm({ ...form, plan_habilitado: e.target.checked })}
          />
          Plan habilitado (puede reservar y usar el panel)
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
