import EquipoEstilistas from '../../../componentes/admin/equipo_estilistas/EquipoEstilistas';
import { AyudaPasoTienda } from '../../../componentes/admin/guia_personalizacion/GuiaPersonalizacion';
import '../../../estilos/admin/equipo/equipo.css';

export default function EquipoAdminVista() {
  return (
    <div className="equipo-admin">
      <AyudaPasoTienda paso="equipo" />
      <header className="equipo-admin__cabecera">
        <h1>Portafolio del equipo</h1>
        <p>La foto, lo que más destaca de cada profesional y sus mejores trabajos.</p>
      </header>
      <EquipoEstilistas />
    </div>
  );
}
