import { useEffect } from 'react';
import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { obtenerServiciosPublicos } from '../../../modulos/publico_marca/servicios/marcaServicio';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';

const ID_JSON_LD = 'seo-marca-jsonld';

function ciudadDeMarca(marca) {
  const directa = (marca?.ciudad ?? '').trim();
  if (directa) return directa;
  const direccion = (marca?.direccion ?? '').trim();
  if (!direccion) return 'tu ciudad';
  const partes = direccion.split(',').map((p) => p.trim()).filter(Boolean);
  return partes.length > 1 ? partes[partes.length - 1] : 'tu ciudad';
}

function fijarMeta(nombre, contenido, propiedad = false) {
  const atributo = propiedad ? 'property' : 'name';
  let etiqueta = document.head.querySelector(`meta[${atributo}="${nombre}"]`);
  if (!etiqueta) {
    etiqueta = document.createElement('meta');
    etiqueta.setAttribute(atributo, nombre);
    document.head.appendChild(etiqueta);
  }
  etiqueta.setAttribute('content', contenido);
}

function rangoPrecios(servicios) {
  const precios = (servicios ?? [])
    .map((s) => Number(s.precio))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (precios.length === 0) return null;
  const minimo = Math.min(...precios);
  const maximo = Math.max(...precios);
  if (minimo === maximo) return formatearPrecio(minimo);
  return `${formatearPrecio(minimo)} – ${formatearPrecio(maximo)}`;
}

export default function SeoMarcaPublica() {
  const { marca } = useMarca();

  useEffect(() => {
    if (!marca?.nombreComercial) return undefined;

    let cancelado = false;
    const tituloPrevio = document.title;
    const ciudad = ciudadDeMarca(marca);
    const titulo = `${marca.nombreComercial} - Citas de Uñas y Acrílicas en ${ciudad}`;
    const descripcion = `Reserva online para diseño de uñas, manicure y pedicure en ${ciudad}. ¡Elige tu estilista y agenda en segundos!`;
    const url = window.location.origin + window.location.pathname;

    document.title = titulo;
    fijarMeta('description', descripcion);
    fijarMeta('og:title', titulo, true);
    fijarMeta('og:description', descripcion, true);
    fijarMeta('og:url', url, true);
    if (marca.logo) fijarMeta('og:image', marca.logo, true);

    const script = document.createElement('script');
    script.id = ID_JSON_LD;
    script.type = 'application/ld+json';
    document.head.querySelector(`#${ID_JSON_LD}`)?.remove();
    document.head.appendChild(script);

    const datos = {
      '@context': 'https://schema.org',
      '@type': 'BeautySalon',
      name: marca.nombreComercial,
      description: marca.descripcion || descripcion,
      url,
      telephone: marca.whatsapp || marca.telefono || undefined,
      image: marca.logo || undefined,
      address: {
        '@type': 'PostalAddress',
        streetAddress: marca.direccion || undefined,
        addressLocality: ciudad === 'tu ciudad' ? undefined : ciudad,
      },
    };

    script.textContent = JSON.stringify(datos).replace(/</g, '\\u003c');

    obtenerServiciosPublicos(marca.id)
      .then((servicios) => {
        if (cancelado) return;
        const rango = rangoPrecios(servicios);
        if (!rango) return;
        datos.priceRange = rango;
        script.textContent = JSON.stringify(datos).replace(/</g, '\\u003c');
      })
      .catch(() => {});

    return () => {
      cancelado = true;
      document.title = tituloPrevio;
      document.getElementById(ID_JSON_LD)?.remove();
    };
  }, [marca]);

  return null;
}
