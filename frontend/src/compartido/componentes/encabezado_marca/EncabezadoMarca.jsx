
import '../../../estilos/compartido/encabezado_marca/encabezado_marca.css';
export default function EncabezadoMarca({ marca, titulo }) {
  if (!marca) return null;

  return (
    <header className="encabezado-marca">
      {marca.logo && (
        <img className="encabezado-marca__logo" src={marca.logo} alt={marca.nombreComercial} />
      )}
      <div>
        <h1>{titulo ?? marca.nombreComercial}</h1>
        {!titulo && marca.descripcion && <p>{marca.descripcion}</p>}
        {titulo && marca.descripcion && (
          <p className="encabezado-marca__subtitulo">{marca.nombreComercial}</p>
        )}
      </div>
    </header>
  );
}
