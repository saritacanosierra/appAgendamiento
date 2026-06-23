import { Navigate, Route, Routes } from 'react-router-dom';
import LayoutPublico from '../vistas/layout_publico/LayoutPublico';
import LayoutAdmin from '../vistas/layout_admin/LayoutAdmin';
import LayoutPlataforma from '../vistas/layout_plataforma/LayoutPlataforma';
import RutaProtegidaAdmin from './RutaProtegidaAdmin';
import RutaProtegidaPlataforma from './RutaProtegidaPlataforma';
import { SuspenseCarga } from './SuspenseCarga';
import {
  InicioMarcaVista,
  ReservarVista,
  GaleriaPublicaVista,
  BlogListaVista,
  BlogDetalleVista,
  ConfirmacionReservaVista,
  LoginVista,
  PanelVista,
  AgendaVista,
  ClientesVista,
  ServiciosAdminVista,
  BlogAdminVista,
  GaleriaAdminVista,
  ConfiguracionMarcaVista,
  ReportesVista,
  InicioVista,
  MarcasPlataformaVista,
  EditarMarcaPlataformaVista,
  PanelPlataformaVista,
  ReportesPlataformaVista,
} from './vistasLazy';
import { RUTAS_ADMIN } from '../configuracion/api';

export default function RutasApp() {
  return (
    <Routes>
      <Route path="/" element={<SuspenseCarga><InicioVista /></SuspenseCarga>} />

      <Route path="/m/:slug" element={<LayoutPublico />}>
        <Route index element={<SuspenseCarga><InicioMarcaVista /></SuspenseCarga>} />
        <Route path="reservar" element={<SuspenseCarga><ReservarVista /></SuspenseCarga>} />
        <Route path="galeria" element={<SuspenseCarga><GaleriaPublicaVista /></SuspenseCarga>} />
        <Route path="blog" element={<SuspenseCarga><BlogListaVista /></SuspenseCarga>} />
        <Route path="blog/:slugPublicacion" element={<SuspenseCarga><BlogDetalleVista /></SuspenseCarga>} />
        <Route path="confirmacion/:codigoReserva" element={<SuspenseCarga><ConfirmacionReservaVista /></SuspenseCarga>} />
      </Route>

      <Route path="/admin/login" element={<SuspenseCarga><LoginVista key="login-marca" modo="marca" /></SuspenseCarga>} />
      <Route path="/plataforma/login" element={<SuspenseCarga><LoginVista key="login-plataforma" modo="plataforma" /></SuspenseCarga>} />
      <Route path="/plataformas" element={<Navigate to="/plataforma/panel" replace />} />
      <Route path="/plataformas/*" element={<Navigate to="/plataforma/panel" replace />} />

      <Route
        path="/admin"
        element={
          <RutaProtegidaAdmin>
            <LayoutAdmin />
          </RutaProtegidaAdmin>
        }
      >
        <Route index element={<Navigate to={RUTAS_ADMIN.panel} replace />} />
        <Route path="panel" element={<SuspenseCarga><PanelVista /></SuspenseCarga>} />
        <Route path="agenda" element={<SuspenseCarga><AgendaVista /></SuspenseCarga>} />
        <Route path="reportes" element={<SuspenseCarga><ReportesVista /></SuspenseCarga>} />
        <Route path="clientes" element={<SuspenseCarga><ClientesVista /></SuspenseCarga>} />
        <Route path="servicios" element={<SuspenseCarga><ServiciosAdminVista /></SuspenseCarga>} />
        <Route path="blog" element={<SuspenseCarga><BlogAdminVista /></SuspenseCarga>} />
        <Route path="galeria" element={<SuspenseCarga><GaleriaAdminVista /></SuspenseCarga>} />
        <Route path="configuracion-marca" element={<SuspenseCarga><ConfiguracionMarcaVista /></SuspenseCarga>} />
      </Route>

      <Route
        path="/plataforma"
        element={
          <RutaProtegidaPlataforma>
            <LayoutPlataforma />
          </RutaProtegidaPlataforma>
        }
      >
        <Route index element={<Navigate to="/plataforma/panel" replace />} />
        <Route path="panel" element={<SuspenseCarga><PanelPlataformaVista /></SuspenseCarga>} />
        <Route path="marcas" element={<SuspenseCarga><MarcasPlataformaVista /></SuspenseCarga>} />
        <Route path="marcas/:id" element={<SuspenseCarga><EditarMarcaPlataformaVista /></SuspenseCarga>} />
        <Route path="reportes" element={<SuspenseCarga><ReportesPlataformaVista /></SuspenseCarga>} />
      </Route>

      <Route path="*" element={<SuspenseCarga><InicioVista /></SuspenseCarga>} />
    </Routes>
  );
}
