import CampoFormulario from '../campo_formulario/CampoFormulario';

function sinTildes(valor) {
  return String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export function filtrarServiciosPorTexto(servicios, consulta) {
  const texto = sinTildes(consulta).trim();
  if (!texto) return servicios;
  return servicios.filter((servicio) => {
    const campos = [servicio?.nombre, servicio?.descripcion];
    return campos.some((campo) => sinTildes(campo).includes(texto));
  });
}

export default function FiltroServicios({ id, valor, onChange }) {
  return (
    <CampoFormulario etiqueta="Filtrar servicios" id={id}>
      <input
        id={id}
        type="search"
        value={valor}
        onChange={(evento) => onChange(evento.target.value)}
        placeholder="Escribe el nombre del servicio"
        autoComplete="off"
        enterKeyHint="search"
      />
    </CampoFormulario>
  );
}
