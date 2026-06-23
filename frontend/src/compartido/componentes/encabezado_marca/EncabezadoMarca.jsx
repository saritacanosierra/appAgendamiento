import ImagenAmpliable from '../imagen_ampliable/ImagenAmpliable';
import '../../../estilos/compartido/encabezado_marca/encabezado_marca.css';

export default function EncabezadoMarca({ marca, titulo, compacto = false }) {
  if (!marca) return null;

  const clases = ['encabezado-marca', compacto ? 'encabezado-marca--compacto' : '']
    .filter(Boolean)
    .join(' ');

  return (
    <header className={clases}>
      {marca.logo && (
        <ImagenAmpliable
          className="encabezado-marca__logo"
          src={marca.logo}
          alt={marca.nombreComercial}
        />
      )}
      <div>
        <h1>{titulo ?? marca.nombreComercial}</h1>
        {!titulo && marca.descripcion && <p>{marca.descripcion}</p>}
        {titulo && (
          <p className="encabezado-marca__subtitulo">{marca.nombreComercial}</p>
        )}
      </div>
    </header>
  );
}
