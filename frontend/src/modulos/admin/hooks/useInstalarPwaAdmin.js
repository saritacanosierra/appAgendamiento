import { useCallback, useEffect, useState } from 'react';

const CLAVE_DESCARTADO = 'spa_unas_pwa_admin_descartado';

function esModoStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  );
}

function esDispositivoIos() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

function esPantallaMovil() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export function useInstalarPwaAdmin() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mostrar, setMostrar] = useState(false);
  const [esIos, setEsIos] = useState(false);
  const [esStandalone, setEsStandalone] = useState(false);

  useEffect(() => {
    const standalone = esModoStandalone();
    setEsStandalone(standalone);

    if (standalone || sessionStorage.getItem(CLAVE_DESCARTADO)) {
      return undefined;
    }

    const ios = esDispositivoIos();
    setEsIos(ios);

    if (ios && esPantallaMovil()) {
      setMostrar(true);
    }

    function onBeforeInstall(evento) {
      evento.preventDefault();
      setDeferredPrompt(evento);
      setMostrar(true);
    }

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const instalar = useCallback(async () => {
    if (!deferredPrompt) return false;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);

    if (outcome === 'accepted') {
      setMostrar(false);
      return true;
    }

    return false;
  }, [deferredPrompt]);

  const descartar = useCallback(() => {
    sessionStorage.setItem(CLAVE_DESCARTADO, '1');
    setMostrar(false);
  }, []);

  return {
    mostrar: mostrar && !esStandalone,
    esIos,
    esStandalone,
    puedeInstalarNativo: Boolean(deferredPrompt),
    instalar,
    descartar,
  };
}
