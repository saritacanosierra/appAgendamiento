import bcrypt from 'bcrypt';
import { MarcaPlataformaRepositorio } from '../repositorios/plataformaRepositorio.js';
import { UsuarioRepositorio } from '../repositorios/index.js';
import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { suscripcionMarcaServicio } from './suscripcionMarcaServicio.js';
import { slugUnico } from '../utilidades/slug.js';
import { email, requerido, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

export const DIAS_PRUEBA = 8;
export const PRECIO_MENSUAL_COP = 25000;

export class RegistroMarcaServicio {
  constructor(deps = {}) {
    this.marcaRepo = deps.marcaRepo ?? new MarcaPlataformaRepositorio();
    this.usuarioRepo = deps.usuarioRepo ?? new UsuarioRepositorio();
    this.configRepo = deps.configRepo ?? new ConfiguracionRepositorio();
    this.suscripcion = deps.suscripcion ?? suscripcionMarcaServicio;
  }

  async registrar(datosEntrada) {
    const nombreComercial = texto(
      datosEntrada.nombre_comercial ?? datosEntrada.nombreComercial,
      { capitalizar: 'palabras' }
    );
    const adminNombre = texto(
      datosEntrada.admin_nombre ?? datosEntrada.adminNombre,
      { capitalizar: 'palabras' }
    );
    const adminCorreo = texto(datosEntrada.admin_correo ?? datosEntrada.adminCorreo).toLowerCase();
    const adminContrasena = datosEntrada.admin_contrasena ?? datosEntrada.adminContrasena ?? '';

    const errores = validar(
      { nombreComercial, adminNombre, adminCorreo, adminContrasena },
      {
        nombreComercial: (v) => requerido(v, 'nombre_comercial'),
        adminNombre: (v) => requerido(v, 'admin_nombre'),
        adminCorreo: (v) => requerido(v, 'admin_correo') ?? email(v),
        adminContrasena: (v) => (
          requerido(v, 'admin_contrasena')
          ?? (String(v).length >= 8 ? null : 'Minimo 8 caracteres.')
        ),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Revisa los datos del registro.', errores, codigoHttp: 422 };
    }

    const correoExistente = await this.usuarioRepo.buscarPorCorreo(adminCorreo);
    if (correoExistente) {
      return { error: 'Ya existe una cuenta con ese correo.', codigoHttp: 409 };
    }

    const slug = await slugUnico(nombreComercial, (s) => this.marcaRepo.slugExiste(s));
    const marcaId = await this.marcaRepo.crear({
      nombreComercial,
      slug,
      planHabilitado: true,
      activa: true,
    });
    await this.marcaRepo.crearConfiguracionVisual(marcaId);
    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      whatsapp_api: { codigo_pais: '57', habilitado: false },
    });

    const contrasenaHash = await bcrypt.hash(String(adminContrasena), 10);
    await this.usuarioRepo.crear({
      marcaId,
      nombre: adminNombre,
      correo: adminCorreo,
      contrasenaHash,
      rol: 'admin',
    });

    const prueba = await this.suscripcion.iniciarPrueba(marcaId, DIAS_PRUEBA);
    if (prueba.error) return prueba;

    return {
      marca: {
        id: marcaId,
        nombreComercial,
        slug,
      },
      admin: { nombre: adminNombre, correo: adminCorreo },
      prueba: {
        dias: DIAS_PRUEBA,
        venceEn: prueba.venceEn,
        precioMensual: PRECIO_MENSUAL_COP,
      },
    };
  }
}

export const registroMarcaServicio = new RegistroMarcaServicio();
