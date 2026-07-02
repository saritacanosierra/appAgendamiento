import IconoApp from '../../../compartido/componentes/icono_app/IconoApp';
import { formatearPrecio } from '../../../compartido/utilidades/temaMarca';

export default function ResumenDiaAtencion({ resumen }) {
  if (!resumen) return null;

  return (
    <section className="atencion-vista__resumen" aria-label="Resumen del día">
      <div className="atencion-vista__tarjeta atencion-vista__tarjeta--pendiente">
        <div className="atencion-vista__tarjeta-icono" aria-hidden="true">
          <IconoApp nombre="atencion" />
        </div>
        <div className="atencion-vista__tarjeta-texto">
          <span>Pendientes</span>
          <strong>{resumen.pendientes}</strong>
        </div>
      </div>
      <div className="atencion-vista__tarjeta atencion-vista__tarjeta--atendidas">
        <div className="atencion-vista__tarjeta-icono" aria-hidden="true">
          <IconoApp nombre="confirmada" />
        </div>
        <div className="atencion-vista__tarjeta-texto">
          <span>Atendidas</span>
          <strong>{resumen.atendidas}</strong>
        </div>
      </div>
      <div className="atencion-vista__tarjeta atencion-vista__tarjeta--ingreso">
        <div className="atencion-vista__tarjeta-icono" aria-hidden="true">
          <IconoApp nombre="reportes" />
        </div>
        <div className="atencion-vista__tarjeta-texto">
          <span>Ingreso confirmado</span>
          <strong>{formatearPrecio(resumen.ingresoAtendido)}</strong>
        </div>
      </div>
    </section>
  );
}
