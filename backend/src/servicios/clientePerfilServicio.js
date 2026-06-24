import {
  ClienteRepositorio,
  ServicioRepositorio,
} from '../repositorios/index.js';
import { ClienteFavoritosRepositorio } from '../repositorios/clienteFavoritosRepositorio.js';
import { GaleriaRepositorio } from '../repositorios/galeriaRepositorio.js';
import { CitaDisenosGaleriaRepositorio } from '../repositorios/citaDisenosGaleriaRepositorio.js';
import { verificarMarcaOperativa } from '../utilidades/marcaOperativa.js';
import { MarcaRepositorio } from '../repositorios/index.js';
import { requerido, telefono, email, validar } from '../utilidades/validador.js';
import { texto, entero } from '../utilidades/sanitizador.js';

const TIPOS_FAVORITO = ['servicio', 'diseno_galeria'];

function mapearFavorito(fila) {
  return {
    id: fila.id,
    tipo: fila.tipo,
    referenciaId: fila.referencia_id,
    titulo: fila.titulo ?? 'Elemento no disponible',
    imagenRuta: fila.imagen_ruta ?? null,
    precio: fila.precio != null ? Number(fila.precio) : null,
    activo: Boolean(fila.referencia_activa),
    createdAt: fila.created_at,
  };
}

export class ClientePerfilServicio {
  constructor(deps = {}) {
    this.marcaRepo = deps.marcaRepo ?? new MarcaRepositorio();
    this.clienteRepo = deps.clienteRepo ?? new ClienteRepositorio();
    this.favoritosRepo = deps.favoritosRepo ?? new ClienteFavoritosRepositorio();
    this.servicioRepo = deps.servicioRepo ?? new ServicioRepositorio();
    this.galeriaRepo = deps.galeriaRepo ?? new GaleriaRepositorio();
    this.seleccionGaleriaRepo = deps.seleccionGaleriaRepo ?? new CitaDisenosGaleriaRepositorio();
  }

  normalizarCredenciales({ marcaId, telefono, correo }) {
    const tel = texto(telefono).replace(/\D+/g, '');
    const correoNorm = texto(correo).trim().toLowerCase();

    const errores = validar(
      { marca_id: marcaId, telefono: tel, correo: correoNorm },
      {
        marca_id: (v) => (v ? null : 'La marca es obligatoria.'),
        telefono: (v) => requerido(v, 'telefono') ?? telefono(v),
        correo: (v) => requerido(v, 'correo') ?? email(v),
      }
    );

    if (Object.keys(errores).length > 0) {
      return { error: 'Datos incorrectos.', codigoHttp: 422 };
    }

    return { marcaId, telefono: tel, correo: correoNorm };
  }

  async verificarMarca(marcaId) {
    const marca = await this.marcaRepo.buscarPorId(marcaId);
    if (!marca) return { error: 'Marca no encontrada.', codigoHttp: 404 };
    const operativa = verificarMarcaOperativa(marca);
    if (!operativa.ok) return { error: operativa.error, codigoHttp: operativa.codigoHttp };
    return { marca };
  }

  async autenticarCliente(marcaId, telefono, correo) {
    const cliente = await this.clienteRepo.buscarPorTelefonoYCorreo(marcaId, telefono, correo);
    if (!cliente) {
      return { error: 'Datos incorrectos.', codigoHttp: 404 };
    }
    return { cliente };
  }

  async obtenerPerfil(marcaId, clienteId) {
    const [puntos, totalFavoritos, serviciosCompletados, favoritosFilas] = await Promise.all([
      this.favoritosRepo.calcularPuntosCliente(marcaId, clienteId),
      this.favoritosRepo.contarPorCliente(marcaId, clienteId),
      this.favoritosRepo.contarServiciosCompletados(marcaId, clienteId),
      this.favoritosRepo.listarPorCliente(marcaId, clienteId),
    ]);

    return {
      puntos,
      totalFavoritos,
      serviciosCompletados,
      favoritos: favoritosFilas.map(mapearFavorito),
    };
  }

  async agregarFavorito(marcaId, telefono, correo, tipoEntrada, referenciaIdEntrada) {
    const credenciales = this.normalizarCredenciales({ marcaId, telefono, correo });
    if (credenciales.error) return credenciales;

    const marcaOk = await this.verificarMarca(credenciales.marcaId);
    if (marcaOk.error) return marcaOk;

    const auth = await this.autenticarCliente(
      credenciales.marcaId,
      credenciales.telefono,
      credenciales.correo
    );
    if (auth.error) return auth;

    const tipo = texto(tipoEntrada);
    const referenciaId = entero(referenciaIdEntrada);

    if (!TIPOS_FAVORITO.includes(tipo) || !referenciaId) {
      return { error: 'Tipo o referencia invalidos.', codigoHttp: 422 };
    }

    const referenciaValida = await this.verificarReferencia(
      credenciales.marcaId,
      tipo,
      referenciaId
    );
    if (!referenciaValida.ok) {
      return { error: referenciaValida.error, codigoHttp: referenciaValida.codigoHttp };
    }

    const existente = await this.favoritosRepo.existe(
      credenciales.marcaId,
      auth.cliente.id,
      tipo,
      referenciaId
    );
    if (existente) {
      return { error: 'Ya esta en tus favoritos.', codigoHttp: 409 };
    }

    await this.favoritosRepo.agregar({
      marcaId: credenciales.marcaId,
      clienteId: auth.cliente.id,
      tipo,
      referenciaId,
    });

    const perfil = await this.obtenerPerfil(credenciales.marcaId, auth.cliente.id);

    return {
      mensaje: 'Agregado a favoritos.',
      perfil,
    };
  }

  async quitarFavorito(marcaId, telefono, correo, tipoEntrada, referenciaIdEntrada) {
    const credenciales = this.normalizarCredenciales({ marcaId, telefono, correo });
    if (credenciales.error) return credenciales;

    const marcaOk = await this.verificarMarca(credenciales.marcaId);
    if (marcaOk.error) return marcaOk;

    const auth = await this.autenticarCliente(
      credenciales.marcaId,
      credenciales.telefono,
      credenciales.correo
    );
    if (auth.error) return auth;

    const tipo = texto(tipoEntrada);
    const referenciaId = entero(referenciaIdEntrada);

    if (!TIPOS_FAVORITO.includes(tipo) || !referenciaId) {
      return { error: 'Tipo o referencia invalidos.', codigoHttp: 422 };
    }

    const eliminado = await this.favoritosRepo.quitar(
      credenciales.marcaId,
      auth.cliente.id,
      tipo,
      referenciaId
    );

    if (!eliminado) {
      return { error: 'No estaba en tus favoritos.', codigoHttp: 404 };
    }

    if (tipo === 'diseno_galeria') {
      await this.seleccionGaleriaRepo.quitarPorTelefonoYDiseno(
        credenciales.marcaId,
        credenciales.telefono,
        referenciaId
      );
    }

    const perfil = await this.obtenerPerfil(credenciales.marcaId, auth.cliente.id);

    return {
      mensaje: 'Eliminado de favoritos.',
      perfil,
    };
  }

  async verificarReferencia(marcaId, tipo, referenciaId) {
    if (tipo === 'servicio') {
      const servicio = await this.servicioRepo.buscarActivoPorId(marcaId, referenciaId);
      if (!servicio) {
        return { ok: false, error: 'Servicio no encontrado.', codigoHttp: 404 };
      }
      return { ok: true };
    }

    const diseno = await this.galeriaRepo.buscarPorId(marcaId, referenciaId);
    if (!diseno || !diseno.activo) {
      return { ok: false, error: 'Diseno no encontrado.', codigoHttp: 404 };
    }
    return { ok: true };
  }
}
