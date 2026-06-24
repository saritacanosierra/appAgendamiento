import { useInstalarPwaAdmin } from '../../../modulos/admin/hooks/useInstalarPwaAdmin';
import BotonAccesoRapidoPwaAdmin from './BotonAccesoRapidoPwaAdmin';
import InstalarAppAdminBanner from './InstalarAppAdminBanner';

export { BotonAccesoRapidoPwaAdmin, InstalarAppAdminBanner, useInstalarPwaAdmin };

export default function InstalarAppAdmin() {
  const pwa = useInstalarPwaAdmin();
  return <InstalarAppAdminBanner {...pwa} mostrarBanner={pwa.mostrar} />;
}
