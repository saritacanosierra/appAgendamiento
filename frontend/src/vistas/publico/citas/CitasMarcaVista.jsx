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
      <EncabezadoMarca marca={marca} compacto />

      <div className="citas-hub__intro">
        <h1>¿Qué quieres agendar?</h1>
        <p>Elige el servicio y luego la hora. Con tus datos queda lista la cita.</p>
      </div>

      <ContenidoHubCitas marca={marca} />
    </div>
  );
}
