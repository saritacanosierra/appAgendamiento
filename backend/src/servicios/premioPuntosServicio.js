import { ConfiguracionRepositorio } from '../repositorios/configuracionRepositorio.js';
import { PUNTOS_POR_SERVICIO_COMPLETADO } from '../repositorios/clienteFavoritosRepositorio.js';
import {
  asegurarTablaPremios,
  premioPuntosRepositorio,
} from '../repositorios/premioPuntosRepositorio.js';
import { pool } from '../configuracion/baseDatos.js';
import {
  armarResumenPremio,
  precioConDescuento,
  validarPremioConfig,
} from '../utilidades/premioPuntos.js';

function leerConfigJson(json) {
  const premio = json?.premio_puntos;
  if (!premio || typeof premio !== 'object') return null;
  const validado = validarPremioConfig(premio.puntos_necesarios, premio.porcentaje);
  return validado.premio ?? null;
}

export class PremioPuntosServicio {
  constructor(deps = {}) {
    this.configRepo = deps.configRepo ?? new ConfiguracionRepositorio();
    this.repo = deps.repo ?? premioPuntosRepositorio;
  }

  async leerConfig(marcaId) {
    const json = await this.configRepo.obtenerConfiguracionJson(marcaId);
    return leerConfigJson(json);
  }

  async guardarConfig(marcaId, datos) {
    const validado = validarPremioConfig(
      datos.premio_puntos_necesarios ?? datos.premioPuntosNecesarios,
      datos.premio_porcentaje ?? datos.premioPorcentaje
    );
    if (validado.error) return { error: validado.error, codigoHttp: 422 };
    await this.configRepo.actualizarConfiguracionJson(marcaId, {
      premio_puntos: validado.premio
        ? {
          puntos_necesarios: validado.premio.puntosNecesarios,
          porcentaje: validado.premio.porcentaje,
        }
        : null,
    });
    return { premio: validado.premio };
  }

  async resumen(marcaId, clienteId) {
    try {
      await asegurarTablaPremios();
    } catch (error) {
      console.error('[premio] No se pudo preparar la tabla', error.message);
      return armarResumenPremio();
    }
    const config = await this.leerConfig(marcaId);
    const completados = await this.repo.contarCompletados(pool, marcaId, clienteId);
    const canjeados = await this.repo.sumarCanjeados(pool, marcaId, clienteId);
    const pendiente = await this.repo.buscarPendiente(marcaId, clienteId);
    return armarResumenPremio({
      puntosTotales: completados * PUNTOS_POR_SERVICIO_COMPLETADO,
      puntosCanjeados: canjeados,
      serviciosCompletados: completados,
      puntosNecesarios: config?.puntosNecesarios ?? null,
      porcentaje: config?.porcentaje ?? null,
      pendiente,
    });
  }

  async resumenesParaLista(marcaId, clientes) {
    try {
      await asegurarTablaPremios();
    } catch (error) {
      console.error('[premio] No se pudo preparar la tabla', error.message);
      return clientes.map((cliente) => ({ ...cliente, premio: armarResumenPremio() }));
    }
    const config = await this.leerConfig(marcaId);
    const porCliente = await this.repo.resumenesMarca(marcaId);
    return clientes.map((cliente) => {
      const datos = porCliente.get(Number(cliente.id)) ?? { completados: 0, canjeados: 0, pendiente: null };
      return {
        ...cliente,
        premio: armarResumenPremio({
          puntosTotales: datos.completados * PUNTOS_POR_SERVICIO_COMPLETADO,
          puntosCanjeados: datos.canjeados,
          serviciosCompletados: datos.completados,
          puntosNecesarios: config?.puntosNecesarios ?? null,
          porcentaje: config?.porcentaje ?? null,
          pendiente: datos.pendiente,
        }),
      };
    });
  }

  async reservarSiAlcanza(marcaId, clienteId, citaId) {
    try {
      await asegurarTablaPremios();
      const config = await this.leerConfig(marcaId);
      if (!config) return null;
      return await this.repo.reservar(
        marcaId,
        clienteId,
        citaId,
        config.puntosNecesarios,
        config.porcentaje
      );
    } catch (error) {
      console.error('[premio] No se reservó el descuento', error.message);
      return null;
    }
  }

  async liberarCita(marcaId, citaId) {
    try {
      await this.repo.liberarCita(marcaId, citaId);
    } catch (error) {
      console.error('[premio] No se liberó el descuento de la cita', error.message);
    }
  }

  async entregar(marcaId, clienteId) {
    try {
      await asegurarTablaPremios();
    } catch (error) {
      console.error('[premio] No se pudo preparar la tabla', error.message);
      return { error: 'Todavía no se puede guardar el premio.', codigoHttp: 503 };
    }
    const config = await this.leerConfig(marcaId);
    if (!config) {
      return { error: 'El premio por puntos no está activo en esta marca.', codigoHttp: 422 };
    }
    const resultado = await this.repo.entregar(marcaId, clienteId, config);
    if (resultado.error) return resultado;
    return { premio: await this.resumen(marcaId, clienteId) };
  }

  async porCita(marcaId, citaId) {
    try {
      await asegurarTablaPremios();
      return await this.repo.buscarPorCita(marcaId, citaId);
    } catch (error) {
      console.error('[premio] No se pudo leer el descuento de la cita', error.message);
      return null;
    }
  }

  descuentoDe(precio, premio) {
    if (!premio) return null;
    return {
      porcentaje: Number(premio.porcentaje),
      precio: precioConDescuento(precio, premio.porcentaje),
    };
  }
}

export const premioPuntosServicio = new PremioPuntosServicio();
