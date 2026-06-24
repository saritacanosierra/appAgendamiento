import ContenidoInstalarPwaAdmin from './ContenidoInstalarPwaAdmin';
import '../../../estilos/componentes/instalar_app_admin/instalar_app_admin.css';

export default function InstalarAppAdminBanner({
  mostrarBanner,
  esIos,
  esStandalone,
  puedeInstalarNativo,
  instalar,
  descartar,
}) {
  if (!mostrarBanner) return null;

  return (
    <aside className="instalar-app-admin" aria-label="Instalar acceso rapido al panel">
      <ContenidoInstalarPwaAdmin
        esIos={esIos}
        esStandalone={esStandalone}
        puedeInstalarNativo={puedeInstalarNativo}
        instalar={instalar}
        onCerrar={descartar}
        variante="banner"
      />
    </aside>
  );
}
