import { useEffect } from 'react';
import { createPortal } from 'react-dom';

export function useModalAbierto(abierto) {
  useEffect(() => {
    if (!abierto) return undefined;

    const overflowPrevio = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = overflowPrevio;
    };
  }, [abierto]);
}

export function ModalPortal({ abierto, children }) {
  useModalAbierto(abierto);

  if (!abierto || typeof document === 'undefined') return null;

  return createPortal(children, document.body);
}
