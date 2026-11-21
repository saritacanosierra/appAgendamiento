import bcrypt from 'bcrypt';
import { MarcaPlataformaRepositorio } from '../repositorios/plataformaRepositorio.js';
import { UsuarioRepositorio } from '../repositorios/index.js';
import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { suscripcionMarcaServicio } from './suscripcionMarcaServicio.js';
import { PRECIO_MES_COP } from '../utilidades/suscripcionMarca.js';
import { slugUnico } from '../utilidades/slug.js';
import { email, requerido, telefono, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

export const DIAS_PRUEBA = 8;
export const PRECIO_MENSUAL_COP = PRECIO_MES_COP;

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
      datosEntrada.admin_nombre ?? datosEntrada.adminNombre ?? nombreComercial,
      { capitalizar: 'palabras' }
    ) || nombreComercial;
    const adminCorreo = texto(datosEntrada.admin_correo ?? datosEntrada.adminCorreo ?? '').toLowerCase();
    const adminContrasena = datosEntrada.admin_contrasena ?? datosEntrada.adminContrasena ?? '';
    const whatsapp = String(datosEntrada.whatsapp ?? '').replace(/\D+/g, '');
    const codigoPais = String(datosEntrada.codigo_pais ?? datosEntrada.codigoPais ?? '').replace(/\D+/g, '');
    const correoCuenta = adminCorreo || whatsapp;

    const errores = validar(
      { nombreComercial, adminNombre, adminContrasena, whatsapp, adminCorreo, codigoPais },
      {
        nombreComercial: (v) => requerido(v, 'nombre_comercial'),
        adminNombre: (v) => requerido(v, 'admin_nombre'),
        adminCorreo: (v) => (v ? email(v) : null),
        adminContrasena: (v) => (
          requerido(v, 'admin_contrasena')
          ?? (String(v).length >= 8 ? null : 'Minimo 8 caracteres.')
        ),
        whatsapp: (v) => requerido(v, 'whatsapp') ?? telefono(v),
        codigoPais: (v) => (
          /^\d{1,3}$/.test(v) ? null : 'Elige el indicativo del pais.'
        ),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Revisa los datos del registro.', errores, codigoHttp: 422 };
    }

    const correoExistente = await this.usuarioRepo.buscarPorCorreo(correoCuenta);
    if (correoExistente) {
      return { error: 'Ya existe una cuenta con ese correo.', codigoHttp: 409 };
    }

    const slug = await slugUnico(nombreComercial, (s) => this.marcaRepo.slugExiste(s));
    const marcaId = await this.marcaRepo.crear({
      nombreComercial,
      slug,
      planHabilitado: true,
      activa: true,
      telefono: whatsapp,
      whatsapp,
    });
    await this.marcaRepo.crearConfiguracionVisual(marcaId);
    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      whatsapp_api: { codigo_pais: codigoPais, habilitado: false },
    });

    const contrasenaHash = await bcrypt.hash(String(adminContrasena), 10);
    await this.usuarioRepo.crear({
      marcaId,
      nombre: adminNombre,
      correo: correoCuenta,
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
      admin: { nombre: adminNombre, correo: correoCuenta, whatsapp },
      prueba: {
        dias: DIAS_PRUEBA,
        venceEn: prueba.venceEn,
        precioMensual: PRECIO_MENSUAL_COP,
      },
    };
  }
}

export const registroMarcaServicio = new RegistroMarcaServicio();
