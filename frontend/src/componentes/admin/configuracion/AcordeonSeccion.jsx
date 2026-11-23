export default function AcordeonSeccion({
  id,
  titulo,
  resumen = '',
  abierta,
  onAbrir,
  className = '',
  children,
}) {
  return (
    <section
      id={id}
      className={`configuracion-marca__acordeon ${abierta ? 'configuracion-marca__acordeon--abierta' : ''} ${className}`.trim()}
    >
      <button
        type="button"
        className="configuracion-marca__acordeon-cabecera"
        aria-expanded={abierta}
        onClick={() => onAbrir(id)}
      >
        <span className="configuracion-marca__acordeon-textos">
          <span className="configuracion-marca__acordeon-titulo">{titulo}</span>
          {resumen ? (
            <span className="configuracion-marca__acordeon-resumen">{resumen}</span>
          ) : null}
        </span>
        <span className="configuracion-marca__acordeon-accion">
          {abierta ? 'Cerrar' : 'Abrir'}
        </span>
      </button>
      {abierta ? (
        <div className="configuracion-marca__acordeon-cuerpo">
          {children}
        </div>
      ) : null}
    </section>
  );
}
