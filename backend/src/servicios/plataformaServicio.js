import bcrypt from 'bcrypt';
import {
  MarcaPlataformaRepositorio,
} from '../repositorios/plataformaRepositorio.js';
import { UsuarioRepositorio } from '../repositorios/index.js';
import { generarSlug, slugUnico } from '../utilidades/slug.js';
import { requerido, email, validar } from '../utilidades/validador.js';
import { texto } from '../utilidades/sanitizador.js';

function mapearMarcaPlataforma(fila) {
  return {
    id: fila.id,
    nombreComercial: fila.nombre_comercial,
    slug: fila.slug,
    activa: Boolean(fila.activa),
    planHabilitado: Boolean(fila.plan_habilitado ?? 1),
    telefono: fila.telefono,
    whatsapp: fila.whatsapp,
    direccion: fila.direccion,
    urlPublica: `/m/${fila.slug}`,
    adminCorreo: fila.admin_correo ?? null,
    adminNombre: fila.admin_nombre ?? null,
    totalUsuarios: Number(fila.total_usuarios ?? 0),
    totalCitas: Number(fila.total_citas ?? 0),
    createdAt: fila.created_at,
  };
}

export class PlataformaServicio {
  constructor(
    marcaRepo = new MarcaPlataformaRepositorio(),
    usuarioRepo = new UsuarioRepositorio()
  ) {
    this.marcaRepo = marcaRepo;
    this.usuarioRepo = usuarioRepo;
  }

  async obtenerResumen() {
    const filas = await this.marcaRepo.obtenerResumen();
    return {
      totalMarcas: Number(filas.total_marcas ?? 0),
      marcasActivas: Number(filas.marcas_activas ?? 0),
      marcasConPlan: Number(filas.marcas_con_plan ?? 0),
      totalCitas: Number(filas.total_citas ?? 0),
      totalUsuariosMarca: Number(filas.total_usuarios_marca ?? 0),
      marcasConGoogle: Number(filas.marcas_con_google ?? 0),
    };
  }

  async listarMarcas() {
    const filas = await this.marcaRepo.listar();
    return filas.map(mapearMarcaPlataforma);
  }

  async obtenerMarca(marcaId) {
    const nombreComercial = texto(datosEntrada.nombre_comercial ?? datosEntrada.nombreComercial);
    const slugBase = texto(datosEntrada.slug) || nombreComercial;
    const adminNombre = texto(datosEntrada.admin_nombre ?? datosEntrada.adminNombre);
    const adminCorreo = texto(datosEntrada.admin_correo ?? datosEntrada.adminCorreo);
    const adminContrasena = datosEntrada.admin_contrasena ?? datosEntrada.adminContrasena ?? '';
    const planHabilitado = datosEntrada.plan_habilitado ?? datosEntrada.planHabilitado ?? true;
    const activa = datosEntrada.activa ?? true;

    const errores = validar(
      { nombreComercial, adminNombre, adminCorreo, adminContrasena },
      {
        nombreComercial: (v) => requerido(v, 'nombre_comercial'),
        adminNombre: (v) => requerido(v, 'admin_nombre'),
        adminCorreo: (v) => requerido(v, 'admin_correo') ?? email(v),
        adminContrasena: (v) => (requerido(v, 'admin_contrasena') ?? (String(v).length >= 8 ? null : 'Minimo 8 caracteres.')),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos invalidos.', errores, codigoHttp: 422 };
    }

    const correoExistente = await this.usuarioRepo.buscarPorCorreo(adminCorreo);
    if (correoExistente) {
      return { error: 'Ya existe un usuario con ese correo.', codigoHttp: 409 };
    }

    const slug = await slugUnico(slugBase, (s) => this.marcaRepo.slugExiste(s));
    const marcaId = await this.marcaRepo.crear({
      nombreComercial,
      slug,
      planHabilitado,
      activa,
    });

    await this.marcaRepo.crearConfiguracionVisual(marcaId);

    const contrasenaHash = await bcrypt.hash(String(adminContrasena), 10);
    await this.usuarioRepo.crear({
      marcaId,
      nombre: adminNombre,
      correo: adminCorreo,
      contrasenaHash,
      rol: 'admin',
    });

    const fila = await this.marcaRepo.buscarPorId(marcaId);
    return {
      marca: mapearMarcaPlataforma({ ...fila, total_usuarios: 1, total_citas: 0 }),
      admin: { correo: adminCorreo, nombre: adminNombre },
    };
  }

  async actualizarMarca(marcaId, datosEntrada) {
    const existente = await this.marcaRepo.buscarPorId(marcaId);
    if (!existente) {
      return { error: 'Marca no encontrada.', codigoHttp: 404 };
    }

    const nombreComercial = texto(datosEntrada.nombre_comercial ?? datosEntrada.nombreComercial ?? existente.nombre_comercial);
    const slugRaw = texto(datosEntrada.slug ?? existente.slug);
    const slug = generarSlug(slugRaw) || existente.slug;

    if (slug !== existente.slug && await this.marcaRepo.slugExiste(slug, marcaId)) {
      return { error: 'Ese slug ya esta en uso.', codigoHttp: 409 };
    }

    await this.marcaRepo.actualizar(marcaId, {
      nombreComercial,
      slug,
      activa: datosEntrada.activa ?? Boolean(existente.activa),
      planHabilitado: datosEntrada.plan_habilitado ?? datosEntrada.planHabilitado ?? Boolean(existente.plan_habilitado ?? 1),
      telefono: datosEntrada.telefono ?? existente.telefono,
      whatsapp: datosEntrada.whatsapp ?? existente.whatsapp,
      direccion: datosEntrada.direccion ?? existente.direccion,
    });

    const fila = await this.marcaRepo.buscarPorId(marcaId);
    return { marca: mapearMarcaPlataforma(fila) };
  }

  async impersonarMarca(marcaId) {
    const existente = await this.marcaRepo.buscarPorId(marcaId);
    if (!existente) {
      return { error: 'Marca no encontrada.', codigoHttp: 404 };
    }

    const admin = await this.usuarioRepo.buscarAdminPrincipalPorMarca(marcaId);
    if (!admin) {
      return { error: 'Esta marca no tiene un administrador activo.', codigoHttp: 404 };
    }

    const { AutenticacionServicio } = await import('./index.js');
    const authServicio = new AutenticacionServicio(this.usuarioRepo);
    const sesion = await authServicio.crearSesionParaUsuario(admin);

    return {
      ...sesion,
      impersonacion: true,
      marcaNombre: existente.nombre_comercial,
    };
  }

  async resetearContrasenaAdmin(marcaId, nuevaContrasena) {
    const existente = await this.marcaRepo.buscarPorId(marcaId);
    if (!existente) {
      return { error: 'Marca no encontrada.', codigoHttp: 404 };
    }

    const admin = await this.usuarioRepo.buscarAdminPrincipalPorMarca(marcaId);
    if (!admin) {
      return { error: 'No hay administrador activo para esta marca.', codigoHttp: 404 };
    }

    const contrasena = String(nuevaContrasena ?? '');
    if (contrasena.length < 8) {
      return { error: 'La contrasena debe tener al menos 8 caracteres.', codigoHttp: 422 };
    }

    const hash = await bcrypt.hash(contrasena, 10);
    await this.usuarioRepo.actualizarContrasena(admin.id, hash);

    return {
      ok: true,
      adminCorreo: admin.correo,
      adminNombre: admin.nombre,
    };
  }
}

export const plataformaServicio = new PlataformaServicio();
