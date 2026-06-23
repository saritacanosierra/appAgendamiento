import { useCallback, useEffect, useRef, useState } from 'react';
import '../../../estilos/compartido/visor_imagen/visor_imagen.css';

const ESCALA_MIN = 1;
const ESCALA_MAX = 4;
const ESCALA_PASO = 0.35;

export default function VisorImagen({ imagen, onCerrar }) {
  const [escala, setEscala] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const arrastrando = useRef(false);
  const ultimoPunto = useRef(null);
  const contenedorRef = useRef(null);

  const abierto = Boolean(imagen?.src);

  const reiniciarVista = useCallback(() => {
    setEscala(1);
    setOffset({ x: 0, y: 0 });
  }, []);

  useEffect(() => {
    if (abierto) reiniciarVista();
  }, [abierto, imagen?.src, reiniciarVista]);

  useEffect(() => {
    if (!abierto) return undefined;

    function manejarTecla(e) {
      if (e.key === 'Escape') onCerrar();
    }

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', manejarTecla);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', manejarTecla);
    };
  }, [abierto, onCerrar]);

  function acercar() {
    setEscala((prev) => Math.min(ESCALA_MAX, prev + ESCALA_PASO));
  }

  function alejar() {
    setEscala((prev) => {
      const siguiente = Math.max(ESCALA_MIN, prev - ESCALA_PASO);
      if (siguiente <= ESCALA_MIN) setOffset({ x: 0, y: 0 });
      return siguiente;
    });
  }

  function manejarRueda(e) {
    e.preventDefault();
    if (e.deltaY < 0) acercar();
    else alejar();
  }

  function iniciarArrastre(clientX, clientY) {
    if (escala <= 1) return;
    arrastrando.current = true;
    ultimoPunto.current = { x: clientX, y: clientY };
  }

  function moverArrastre(clientX, clientY) {
    if (!arrastrando.current || !ultimoPunto.current) return;
    const dx = clientX - ultimoPunto.current.x;
    const dy = clientY - ultimoPunto.current.y;
    ultimoPunto.current = { x: clientX, y: clientY };
    setOffset((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
  }

  function terminarArrastre() {
    arrastrando.current = false;
    ultimoPunto.current = null;
  }

  function manejarDobleClick() {
    if (escala > 1) reiniciarVista();
    else setEscala(2);
  }

  if (!abierto) return null;

  return (
    <div
      className="visor-imagen"
      role="dialog"
      aria-modal="true"
      aria-label={imagen.alt || 'Imagen ampliada'}
    >
      <button type="button" className="visor-imagen__fondo" onClick={onCerrar} aria-label="Cerrar" />

      <div className="visor-imagen__barra">
        <span className="visor-imagen__titulo">{imagen.alt || 'Imagen'}</span>
        <div className="visor-imagen__controles">
          <button type="button" onClick={alejar} aria-label="Alejar" disabled={escala <= ESCALA_MIN}>
            −
          </button>
          <span className="visor-imagen__escala">{Math.round(escala * 100)}%</span>
          <button type="button" onClick={acercar} aria-label="Acercar" disabled={escala >= ESCALA_MAX}>
            +
          </button>
          <button type="button" onClick={reiniciarVista} aria-label="Restablecer zoom" disabled={escala <= 1}>
            ⟲
          </button>
          <button type="button" className="visor-imagen__cerrar" onClick={onCerrar} aria-label="Cerrar">
            ×
          </button>
        </div>
      </div>

      <div
        ref={contenedorRef}
        className="visor-imagen__viewport"
        onWheel={manejarRueda}
        onMouseDown={(e) => iniciarArrastre(e.clientX, e.clientY)}
        onMouseMove={(e) => moverArrastre(e.clientX, e.clientY)}
        onMouseUp={terminarArrastre}
        onMouseLeave={terminarArrastre}
        onTouchStart={(e) => {
          if (e.touches.length === 1) iniciarArrastre(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchMove={(e) => {
          if (e.touches.length === 1) moverArrastre(e.touches[0].clientX, e.touches[0].clientY);
        }}
        onTouchEnd={terminarArrastre}
        onDoubleClick={manejarDobleClick}
      >
        <img
          src={imagen.src}
          alt={imagen.alt || ''}
          className="visor-imagen__img"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${escala})`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
