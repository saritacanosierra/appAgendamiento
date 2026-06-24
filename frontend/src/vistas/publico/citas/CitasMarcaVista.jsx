import { useMarca } from '../../../aplicacion/proveedores/ProveedorMarca';
import { Cargando, EncabezadoMarca, MensajeError } from '../../../compartido/componentes';
import ContenidoHubCitas from '../../../componentes/publico/contenido_hub_citas/ContenidoHubCitas';
import '../../../estilos/publico/citas/citas-hub.css';

export default function CitasMarcaVista() {
  const { marca, cargando, error } = useMarca();

  if (cargando) return <Cargando />;
  if (error) return <MensajeError titulo="Marca no disponible" mensaje={error} />;
  if (!marca) return null;

  return (
    <div className="citas-hub">
      <EncabezadoMarca marca={marca} titulo="Citas" compacto />

      <div className="citas-hub__intro">
        <h2>¿Lista para tu próxima cita?</h2>
        <p>Consulta horarios disponibles, explora servicios y agenda al instante.</p>
      </div>

      <ContenidoHubCitas marca={marca} />
    </div>
  );
}
