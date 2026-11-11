import EquipoEstilistas from '../../../componentes/admin/equipo_estilistas/EquipoEstilistas';
import '../../../estilos/admin/equipo/equipo.css';

export default function EquipoAdminVista() {
  return (
    <div className="equipo-admin">
      <header className="equipo-admin__cabecera">
        <h1>Portafolio del equipo</h1>
        <p>La foto, lo que más destaca de cada profesional y sus mejores trabajos.</p>
      </header>
      <EquipoEstilistas />
    </div>
  );
}
