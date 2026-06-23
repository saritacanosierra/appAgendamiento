import { useCallback, useEffect, useRef, useState } from 'react';

const CLAVE_STORAGE = 'spa_unas_cronometro';

function leerEstadoPersistido(citaId) {
  try {
    const raw = sessionStorage.getItem(CLAVE_STORAGE);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (data?.citaId !== citaId) return null;
    return data;
  } catch {
    return null;
  }
}

function guardarEstadoPersistido(estado) {
  if (!estado) {
    sessionStorage.removeItem(CLAVE_STORAGE);
    return;
  }
  sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
}

export function formatearCronometro(totalSegundos) {
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function useCronometro(citaId) {
  const [segundos, setSegundos] = useState(0);
  const [activo, setActivo] = useState(false);
  const inicioRef = useRef(null);
  const intervalRef = useRef(null);

  const detenerIntervalo = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const sincronizarTiempo = useCallback(() => {
    if (!inicioRef.current) return;
    const transcurrido = Math.floor((Date.now() - inicioRef.current) / 1000);
    setSegundos(transcurrido);
  }, []);

  useEffect(() => {
    detenerIntervalo();
    setSegundos(0);
    setActivo(false);
    inicioRef.current = null;

    if (!citaId) return undefined;

    const persistido = leerEstadoPersistido(citaId);
    if (persistido?.inicioMs) {
      inicioRef.current = persistido.inicioMs;
      const transcurrido = Math.floor((Date.now() - persistido.inicioMs) / 1000);
      setSegundos(transcurrido);
      if (persistido.activo) {
        setActivo(true);
      }
    }

    return () => detenerIntervalo();
  }, [citaId, detenerIntervalo]);

  useEffect(() => {
    if (!activo) {
      detenerIntervalo();
      return undefined;
    }

    sincronizarTiempo();
    intervalRef.current = setInterval(sincronizarTiempo, 1000);

    return () => detenerIntervalo();
  }, [activo, detenerIntervalo, sincronizarTiempo]);

  const iniciar = useCallback(() => {
    if (activo) return;
    inicioRef.current = Date.now();
    setSegundos(0);
    setActivo(true);
    guardarEstadoPersistido({ citaId, inicioMs: inicioRef.current, activo: true });
  }, [activo, citaId]);

  const pausar = useCallback(() => {
    if (!activo) return;
    setActivo(false);
    guardarEstadoPersistido({
      citaId,
      inicioMs: inicioRef.current,
      activo: false,
      segundosPausados: segundos,
    });
  }, [activo, citaId, segundos]);

  const reanudar = useCallback(() => {
    if (activo) return;
    const persistido = leerEstadoPersistido(citaId);
    const base = persistido?.segundosPausados ?? segundos;
    inicioRef.current = Date.now() - base * 1000;
    setSegundos(base);
    setActivo(true);
    guardarEstadoPersistido({ citaId, inicioMs: inicioRef.current, activo: true });
  }, [activo, citaId, segundos]);

  const reiniciar = useCallback(() => {
    detenerIntervalo();
    inicioRef.current = null;
    setSegundos(0);
    setActivo(false);
    guardarEstadoPersistido(null);
  }, [detenerIntervalo]);

  const minutosRedondeados = Math.max(1, Math.ceil(segundos / 60));

  return {
    segundos,
    activo,
    texto: formatearCronometro(segundos),
    minutosRedondeados,
    iniciar,
    pausar,
    reanudar,
    reiniciar,
    limpiarPersistencia: () => guardarEstadoPersistido(null),
  };
}
