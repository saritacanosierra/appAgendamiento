/**
 * Cache corta en memoria para lecturas publicas que se repiten.
 * La clave incluye el slug o el marca_id: dos tiendas no comparten entrada.
 * No guarda horarios: esos cambian con cada reserva.
 */
export function crearCache({ ttlMs = 15_000, max = 400 } = {}) {
  const mapa = new Map();

  function recortar() {
    while (mapa.size > max) {
      const primero = mapa.keys().next().value;
      mapa.delete(primero);
    }
  }

  return {
    obtener(clave, cargar) {
      const ahora = Date.now();
      const previo = mapa.get(clave);

      if (previo && !previo.pendiente && previo.vence > ahora) {
        mapa.delete(clave);
        mapa.set(clave, previo);
        return Promise.resolve(previo.valor);
      }

      if (previo?.pendiente) return previo.pendiente;

      const pendiente = Promise.resolve()
        .then(cargar)
        .then((valor) => {
          mapa.delete(clave);
          mapa.set(clave, { valor, vence: Date.now() + ttlMs });
          recortar();
          return valor;
        })
        .catch((error) => {
          const actual = mapa.get(clave);
          if (actual?.pendiente === pendiente) mapa.delete(clave);
          throw error;
        });

      mapa.set(clave, { pendiente, vence: 0 });
      return pendiente;
    },
  };
}

export const cacheLecturasPublicas = crearCache();
