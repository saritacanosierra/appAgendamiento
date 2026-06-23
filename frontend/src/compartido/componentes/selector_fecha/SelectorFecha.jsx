import { useEffect, useMemo, useState } from 'react';
import CampoFormulario from '../campo_formulario/CampoFormulario';
import {
  DIAS_SEMANA_CORTO,
  MESES_ANIO,
  fechaHoyLocal,
  formatearFechaLegible,
  generarCeldasCalendario,
  parseFechaLocal,
} from '../../../modulos/reservas/utilidades/calendarioCliente';
import '../../../estilos/compartido/selector_fecha/selector_fecha.css';

function mesVisibleInicial(valor, min) {
  const base = parseFechaLocal(valor) ?? parseFechaLocal(min) ?? parseFechaLocal(fechaHoyLocal());
  return { anio: base.getFullYear(), mes: base.getMonth() };
}

export default function SelectorFecha({
  valor,
  onChange,
  min,
  max,
  etiqueta = 'Fecha',
  modo = 'calendario',
}) {
  const minimo = min ?? fechaHoyLocal();
  const [{ anio, mes }, setVistaMes] = useState(() => mesVisibleInicial(valor, minimo));

  useEffect(() => {
    if (!valor) return;
    const fecha = parseFechaLocal(valor);
    if (!fecha) return;
    setVistaMes({ anio: fecha.getFullYear(), mes: fecha.getMonth() });
  }, [valor]);

  const celdas = useMemo(() => generarCeldasCalendario(anio, mes), [anio, mes]);

  function esDeshabilitada(fecha) {
    if (fecha < minimo) return true;
    if (max && fecha > max) return true;
    return false;
  }

  function mesAnterior() {
    setVistaMes((prev) => {
      if (prev.mes === 0) return { anio: prev.anio - 1, mes: 11 };
      return { anio: prev.anio, mes: prev.mes - 1 };
    });
  }

  function mesSiguiente() {
    setVistaMes((prev) => {
      if (prev.mes === 11) return { anio: prev.anio + 1, mes: 0 };
      return { anio: prev.anio, mes: prev.mes + 1 };
    });
  }

  function seleccionarDia(celda) {
    if (esDeshabilitada(celda.fecha)) return;
    onChange(celda.fecha);
    if (!celda.delMesActual) {
      const fecha = parseFechaLocal(celda.fecha);
      setVistaMes({ anio: fecha.getFullYear(), mes: fecha.getMonth() });
    }
  }

  if (modo === 'nativo') {
    return (
      <CampoFormulario etiqueta={etiqueta} id="selector-fecha">
        <input
          id="selector-fecha"
          type="date"
          className="selector-fecha"
          value={valor}
          min={minimo}
          max={max}
          onChange={(e) => onChange(e.target.value)}
        />
      </CampoFormulario>
    );
  }

  return (
    <div className="calendario-mes">
      {etiqueta && <span className="calendario-mes__etiqueta">{etiqueta}</span>}

      <div className="calendario-mes__cabecera">
        <button type="button" className="calendario-mes__nav" onClick={mesAnterior} aria-label="Mes anterior">
          ‹
        </button>
        <strong className="calendario-mes__titulo">
          {MESES_ANIO[mes]} {anio}
        </strong>
        <button type="button" className="calendario-mes__nav" onClick={mesSiguiente} aria-label="Mes siguiente">
          ›
        </button>
      </div>

      <div className="calendario-mes__semana" aria-hidden="true">
        {DIAS_SEMANA_CORTO.map((dia) => (
          <span key={dia} className="calendario-mes__dia-semana">
            {dia}
          </span>
        ))}
      </div>

      <div className="calendario-mes__tablero" role="grid" aria-label={`Calendario ${MESES_ANIO[mes]} ${anio}`}>
        {celdas.map((celda) => {
          const activo = valor === celda.fecha;
          const deshabilitado = esDeshabilitada(celda.fecha);
          return (
            <button
              key={celda.fecha}
              type="button"
              role="gridcell"
              aria-selected={activo}
              aria-label={formatearFechaLegible(celda.fecha)}
              disabled={deshabilitado}
              className={[
                'calendario-mes__celda',
                !celda.delMesActual ? 'calendario-mes__celda--otro-mes' : '',
                celda.esHoy ? 'calendario-mes__celda--hoy' : '',
                activo ? 'calendario-mes__celda--activa' : '',
                deshabilitado ? 'calendario-mes__celda--deshabilitada' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => seleccionarDia(celda)}
            >
              {celda.dia}
            </button>
          );
        })}
      </div>

      {valor && (
        <p className="calendario-mes__seleccion">
          Seleccionado: <strong>{formatearFechaLegible(valor)}</strong>
        </p>
      )}
    </div>
  );
}
