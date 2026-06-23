import { useEffect } from 'react';
import { useVisorImagen } from '../../aplicacion/proveedores/ProveedorVisorImagen';

export function useImagenesEnContenedor(ref, dependencias = []) {
  const { abrirImagen } = useVisorImagen();

  useEffect(() => {
    const contenedor = ref.current;
    if (!contenedor) return undefined;

    function marcarImagenes() {
      contenedor.querySelectorAll('img').forEach((img) => {
        img.classList.add('imagen-ampliable');
      });
    }

    function manejarClick(e) {
      const img = e.target.closest('img');
      if (!img || !contenedor.contains(img)) return;
      e.preventDefault();
      e.stopPropagation();
      abrirImagen({ src: img.src, alt: img.alt || '' });
    }

    marcarImagenes();
    contenedor.addEventListener('click', manejarClick);

    return () => {
      contenedor.removeEventListener('click', manejarClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, abrirImagen, ...dependencias]);
}
