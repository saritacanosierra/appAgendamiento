import { useCallback, useEffect, useState } from 'react';

const CLAVE_DESCARTADO = 'spa_unas_pwa_admin_descartado';

function esModoStandalone() {
  return (
    window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true
  );
}

export function detectarSistemaOperativo() {
  if (typeof navigator === 'undefined') return 'escritorio';

  const agente = navigator.userAgent || '';
  const iosClasico = /iPad|iPhone|iPod/.test(agente) && !window.MSStream;
  const ipadModerno = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  if (iosClasico || ipadModerno) return 'ios';
  if (/Android/i.test(agente)) return 'android';
  return 'escritorio';
}

function esPantallaMovil() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export function useInstalarPwaAdmin() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [mostrar, setMostrar] = useState(false);
  const [sistema, setSistema] = useState('escritorio');
  const [esStandalone, setEsStandalone] = useState(false);

  useEffect(() => {
    const standalone = esModoStandalone();
    const detectado = detectarSistemaOperativo();
    setEsStandalone(standalone);
    setSistema(detectado);

    if (standalone || sessionStorage.getItem(CLAVE_DESCARTADO)) {
      return undefined;
    }

    if ((detectado === 'ios' || detectado === 'android') && esPantallaMovil()) {
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
    sistema,
    esStandalone,
    puedeInstalarNativo: Boolean(deferredPrompt),
    instalar,
    descartar,
  };
}
