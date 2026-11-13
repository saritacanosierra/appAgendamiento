import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../../aplicacion/proveedores/ProveedorAuth';
import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { RUTAS_ADMIN } from '../../../compartido/constantes';
import '../../../estilos/componentes/guia_personalizacion/guia_personalizacion.css';

export function claveGuiaTienda(marcaId) {
  return `spa_unas_guia_tienda_${marcaId}`;
}

export function guiaTiendaOculta(marcaId) {
  if (!marcaId) return false;
  try {
    return localStorage.getItem(claveGuiaTienda(marcaId)) === 'oculta';
  } catch {
    return false;
  }
}

const PASOS = [
  {
    id: 'cuenta',
    numero: '1',
    titulo: 'Tu cuenta',
    detalle: 'Ya estás dentro del panel. Los siguientes pasos dejan la tienda a tu gusto.',
    to: null,
    icono: 'inicio',
  },
  {
    id: 'marca',
    numero: '2',
    titulo: 'Tu marca',
    detalle: 'Logo, colores, WhatsApp y los días que atiendes.',
    to: RUTAS_ADMIN.configuracionMarca,
    icono: 'config',
  },
  {
    id: 'servicios',
    numero: '3',
    titulo: 'Tus servicios',
    detalle: 'Qué ofreces, cuánto dura y el precio.',
    to: RUTAS_ADMIN.servicios,
    icono: 'servicios',
  },
  {
    id: 'equipo',
    numero: '4',
    titulo: 'Quién atiende',
    detalle: 'Agrega a cada profesional. Si trabajas sola, ponte tú.',
    to: RUTAS_ADMIN.equipo,
    icono: 'clientes',
  },
  {
    id: 'galeria',
    numero: '5',
    titulo: 'Fotos de tus trabajos',
    detalle: 'Tu clienta las ve y puede elegir el diseño.',
    to: RUTAS_ADMIN.galeria,
    icono: 'galeria',
  },
  {
    id: 'enlace',
    numero: '6',
    titulo: 'El enlace para tu clienta',
    detalle: 'Pulsa «Copiar enlace» en el recuadro de arriba y pégalo en WhatsApp. Ella no crea cuenta.',
    to: null,
    icono: 'externo',
  },
];

const PASOS_DE_TIENDA = ['marca', 'servicios', 'equipo', 'galeria'];

export default function GuiaPersonalizacion({
  hechos = {},
  permitirOcultar = true,
  onOcultar,
}) {
  const siguiente = PASOS_DE_TIENDA.find((id) => !hechos[id]) ?? 'enlace';
  const listos = PASOS_DE_TIENDA.filter((id) => hechos[id]).length;
  const tiendaLista = listos === PASOS_DE_TIENDA.length;

  return (
    <section className="guia-tienda" aria-labelledby="guia-tienda-titulo">
      <div className="guia-tienda__cabecera">
        <p className="guia-tienda__etiqueta">Personaliza tu tienda</p>
        <h2 id="guia-tienda-titulo">
          {tiendaLista ? 'Ya puedes enviarle el enlace a tu clienta.' : 'Sigue estos pasos, en orden.'}
        </h2>
        <p>
          Misma lista que en la página de inicio: del 2 al 6. {listos} de 4 pantallas listas. Tu clienta no entra aquí.
        </p>
      </div>

      <ol className="guia-tienda__pasos">
        {PASOS.map((paso) => {
          const hecho = paso.id === 'cuenta' || (paso.id !== 'enlace' && Boolean(hechos[paso.id]));
          const actual = paso.id === siguiente;
          const clase = [
            'guia-tienda__paso',
            hecho ? 'guia-tienda__paso--hecho' : '',
            actual ? 'guia-tienda__paso--actual' : '',
          ].filter(Boolean).join(' ');
          const cuerpo = (
            <>
              <span className="guia-tienda__numero">{hecho ? 'Ok' : paso.numero}</span>
              <span className="guia-tienda__icono">
                <IconoApp nombre={paso.icono} />
              </span>
              <span className="guia-tienda__texto">
                <strong>{paso.titulo}</strong>
                <span>{hecho ? 'Listo. Puedes volver a editarlo.' : paso.detalle}</span>
                {actual && <span className="guia-tienda__ahora">Ahora</span>}
              </span>
              {paso.to && <IconoApp nombre="flecha" className="guia-tienda__flecha" />}
            </>
          );

          return (
            <li key={paso.id}>
              {paso.to ? (
                <Link to={paso.to} className={clase}>
                  {cuerpo}
                </Link>
              ) : (
                <div className={clase}>{cuerpo}</div>
              )}
            </li>
          );
        })}
      </ol>

      {permitirOcultar && (
        <button type="button" className="guia-tienda__ocultar" onClick={onOcultar}>
          Ocultar esta guía
        </button>
      )}
    </section>
  );
}

export function AyudaPasoTienda({ paso }) {
  const { marcaActiva } = useAuth();
  const [visible, setVisible] = useState(true);
  const indice = PASOS.findIndex((item) => item.id === paso);
  const actual = PASOS[indice];
  const siguiente = PASOS[indice + 1];

  useEffect(() => {
    setVisible(!guiaTiendaOculta(marcaActiva?.id));
  }, [marcaActiva?.id]);

  if (!actual || !visible) return null;

  return (
    <aside className="guia-tienda-paso" aria-label={`Paso ${actual.numero} de 6`}>
      <p className="guia-tienda-paso__indice">Paso {actual.numero} de 6</p>
      <strong>{actual.titulo}</strong>
      <p>{actual.detalle}</p>
      {siguiente && (
        <Link className="guia-tienda-paso__siguiente" to={siguiente.to ?? RUTAS_ADMIN.panel}>
          Siguiente: {siguiente.titulo}
        </Link>
      )}
    </aside>
  );
}
