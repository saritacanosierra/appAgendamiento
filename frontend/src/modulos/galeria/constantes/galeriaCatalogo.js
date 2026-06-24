/** Etiqueta legible a partir del catalogo cargado desde la API. */
export function etiquetaDesdeCatalogo(valor, catalogo = []) {
  if (!valor) return '';
  const item = catalogo.find((entry) => entry.valor === valor);
  return item?.etiqueta ?? valor;
}

export function catalogoActivoPorTipo(catalogo, tipo) {
  return catalogo
    .filter((item) => item.tipo === tipo && item.activo)
    .sort((a, b) => {
      const orden = (a.ordenVisualizacion ?? 0) - (b.ordenVisualizacion ?? 0);
      if (orden !== 0) return orden;
      return a.etiqueta.localeCompare(b.etiqueta, 'es');
    });
}
