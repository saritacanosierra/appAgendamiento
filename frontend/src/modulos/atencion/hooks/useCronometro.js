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
  } else {
    sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(estado));
  }
  window.dispatchEvent(new CustomEvent('spa:cronometro-actualizado'));
}

export function leerCronometroGlobal() {
  try {
    const raw = sessionStorage.getItem(CLAVE_STORAGE);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function limpiarCronometroPersistido() {
  guardarEstadoPersistido(null);
}

export function limpiarCronometroSiEsCita(citaId) {
  const data = leerCronometroGlobal();
  if (data && Number(data.citaId) === Number(citaId)) {
    guardarEstadoPersistido(null);
  }
}

export function citaPermiteEstadoEnCurso(estado) {
  return ['pendiente', 'confirmada'].includes(estado);
}

export function sincronizarCronometroConCitasActivas(citas) {
  const data = leerCronometroGlobal();
  if (!data?.citaId) return;

  const idsActivos = new Set(
    (citas ?? [])
      .filter((c) => citaPermiteEstadoEnCurso(c.estado))
      .map((c) => Number(c.id))
  );

  if (!idsActivos.has(Number(data.citaId))) {
    guardarEstadoPersistido(null);
  }
}

export function useCitaEnCurso(citasReferencia = null) {
  const [citaIdEnCurso, setCitaIdEnCurso] = useState(null);

  useEffect(() => {
    function actualizar() {
      const data = leerCronometroGlobal();
      if (!data?.activo) {
        setCitaIdEnCurso(null);
        return;
      }

      const id = Number(data.citaId);
      if (!id) {
        setCitaIdEnCurso(null);
        return;
      }

      if (Array.isArray(citasReferencia)) {
        const cita = citasReferencia.find((c) => Number(c.id) === id);
        if (!cita || !citaPermiteEstadoEnCurso(cita.estado)) {
          setCitaIdEnCurso(null);
          return;
        }
      }

      setCitaIdEnCurso(id);
    }

    actualizar();
    const intervalo = setInterval(actualizar, 1000);
    window.addEventListener('spa:cronometro-actualizado', actualizar);
    window.addEventListener('storage', actualizar);

    return () => {
      clearInterval(intervalo);
      window.removeEventListener('spa:cronometro-actualizado', actualizar);
      window.removeEventListener('storage', actualizar);
    };
  }, [citasReferencia]);

  return citaIdEnCurso;
}

export function formatearCronometro(totalSegundos) {
  const h = Math.floor(totalSegundos / 3600);
  const m = Math.floor((totalSegundos % 3600) / 60);
  const s = totalSegundos % 60;
  const pad = (n) => String(n).padStart(2, '0');
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

export function parsearTiempoCronometro(texto) {
  const limpio = String(texto ?? '').trim();
  if (!limpio) return null;

  if (/^\d+$/.test(limpio)) {
    return Math.max(0, parseInt(limpio, 10));
  }

  const partes = limpio.split(':').map((parte) => parseInt(parte, 10));
  if (partes.some((n) => Number.isNaN(n) || n < 0)) return null;

  if (partes.length === 2) {
    const [minutos, segundos] = partes;
    if (segundos >= 60) return null;
    return minutos * 60 + segundos;
  }

  if (partes.length === 3) {
    const [horas, minutos, segundos] = partes;
    if (minutos >= 60 || segundos >= 60) return null;
    return horas * 3600 + minutos * 60 + segundos;
  }

  return null;
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

  const establecerSegundos = useCallback(
    (nuevoTotal) => {
      const valor = Math.max(0, Math.floor(Number(nuevoTotal) || 0));
      setSegundos(valor);

      if (activo) {
        inicioRef.current = Date.now() - valor * 1000;
        guardarEstadoPersistido({ citaId, inicioMs: inicioRef.current, activo: true });
        return;
      }

      inicioRef.current = valor > 0 ? Date.now() - valor * 1000 : null;
      if (valor === 0) {
        guardarEstadoPersistido(null);
        return;
      }

      guardarEstadoPersistido({
        citaId,
        inicioMs: inicioRef.current,
        activo: false,
        segundosPausados: valor,
      });
    },
    [activo, citaId]
  );

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
    establecerSegundos,
    limpiarPersistencia: limpiarCronometroPersistido,
  };
}
