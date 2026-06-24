import { Navigate, Route, Routes } from 'react-router-dom';
import LayoutPublico from '../vistas/layout_publico/LayoutPublico';
import LayoutAdmin from '../vistas/layout_admin/LayoutAdmin';
import LayoutPlataforma from '../vistas/layout_plataforma/LayoutPlataforma';
import RutaProtegidaAdmin from './RutaProtegidaAdmin';
import RutaProtegidaPlataforma from './RutaProtegidaPlataforma';
import RedireccionBarraFinal from './RedireccionBarraFinal';
import { SuspenseCarga } from './SuspenseCarga';
import { PLATAFORMA_HABILITADA } from '../../compartido/configuracion/entornoApp';
import {
  InicioMarcaVista,
  ReservarVista,
  GaleriaPublicaVista,
  BlogListaVista,
  BlogDetalleVista,
  ConfirmacionReservaVista,
  ConsultarCitaVista,
  CitasMarcaVista,
  LoginVista,
  PanelVista,
  AgendaVista,
  ClientesVista,
  ServiciosAdminVista,
  BlogAdminVista,
  GaleriaAdminVista,
  ConfiguracionMarcaVista,
  CarruselAdminVista,
  ReportesVista,
  AtencionVista,
  InicioVista,
  MarcasPlataformaVista,
  EditarMarcaPlataformaVista,
  PanelPlataformaVista,
  ReportesPlataformaVista,
} from './vistasLazy';
import { RUTAS_ADMIN, RUTAS_PLATAFORMA } from '../../compartido/constantes';

export default function RutasApp() {
  return (
    <>
      <RedireccionBarraFinal />
      <Routes>
        <Route path="/" element={<SuspenseCarga><InicioVista /></SuspenseCarga>} />

        <Route path="/m/:slug" element={<LayoutPublico />}>
          <Route index element={<SuspenseCarga><InicioMarcaVista /></SuspenseCarga>} />
          <Route path="citas" element={<SuspenseCarga><CitasMarcaVista /></SuspenseCarga>} />
          <Route path="reservar" element={<SuspenseCarga><ReservarVista /></SuspenseCarga>} />
          <Route path="galeria" element={<SuspenseCarga><GaleriaPublicaVista /></SuspenseCarga>} />
          <Route path="blog" element={<SuspenseCarga><BlogListaVista /></SuspenseCarga>} />
          <Route path="blog/:slugPublicacion" element={<SuspenseCarga><BlogDetalleVista /></SuspenseCarga>} />
          <Route path="confirmacion/:codigoReserva" element={<SuspenseCarga><ConfirmacionReservaVista /></SuspenseCarga>} />
          <Route path="mi-cita" element={<SuspenseCarga><ConsultarCitaVista /></SuspenseCarga>} />
        </Route>

        <Route path="/admin">
          <Route index element={<SuspenseCarga><LoginVista key="login-marca" modo="marca" /></SuspenseCarga>} />
          <Route path="login" element={<Navigate to={RUTAS_ADMIN.login} replace />} />
          <Route
            element={
              <RutaProtegidaAdmin>
                <LayoutAdmin />
              </RutaProtegidaAdmin>
            }
          >
            <Route path="panel" element={<SuspenseCarga><PanelVista /></SuspenseCarga>} />
            <Route path="agenda" element={<SuspenseCarga><AgendaVista /></SuspenseCarga>} />
            <Route path="atencion" element={<SuspenseCarga><AtencionVista /></SuspenseCarga>} />
            <Route path="reportes" element={<SuspenseCarga><ReportesVista /></SuspenseCarga>} />
            <Route path="clientes" element={<SuspenseCarga><ClientesVista /></SuspenseCarga>} />
            <Route path="servicios" element={<SuspenseCarga><ServiciosAdminVista /></SuspenseCarga>} />
            <Route path="blog" element={<SuspenseCarga><BlogAdminVista /></SuspenseCarga>} />
            <Route path="galeria" element={<SuspenseCarga><GaleriaAdminVista /></SuspenseCarga>} />
            <Route path="configuracion-marca" element={<SuspenseCarga><ConfiguracionMarcaVista /></SuspenseCarga>} />
            <Route path="carrusel-inicio" element={<SuspenseCarga><CarruselAdminVista /></SuspenseCarga>} />
          </Route>
        </Route>

        {PLATAFORMA_HABILITADA && (
          <>
            <Route path="/plataforma">
              <Route index element={<SuspenseCarga><LoginVista key="login-plataforma" modo="plataforma" /></SuspenseCarga>} />
              <Route path="login" element={<Navigate to={RUTAS_PLATAFORMA.login} replace />} />
              <Route
                element={
                  <RutaProtegidaPlataforma>
                    <LayoutPlataforma />
                  </RutaProtegidaPlataforma>
                }
              >
                <Route path="panel" element={<SuspenseCarga><PanelPlataformaVista /></SuspenseCarga>} />
                <Route path="marcas" element={<SuspenseCarga><MarcasPlataformaVista /></SuspenseCarga>} />
                <Route path="marcas/:id" element={<SuspenseCarga><EditarMarcaPlataformaVista /></SuspenseCarga>} />
                <Route path="reportes" element={<SuspenseCarga><ReportesPlataformaVista /></SuspenseCarga>} />
              </Route>
            </Route>

            <Route path="/plataformas" element={<Navigate to={RUTAS_PLATAFORMA.panel} replace />} />
            <Route path="/plataformas/*" element={<Navigate to={RUTAS_PLATAFORMA.panel} replace />} />
          </>
        )}

        {!PLATAFORMA_HABILITADA && (
          <>
            <Route path="/plataforma/*" element={<Navigate to="/" replace />} />
            <Route path="/plataformas/*" element={<Navigate to="/" replace />} />
          </>
        )}

        <Route path="*" element={<SuspenseCarga><InicioVista /></SuspenseCarga>} />
      </Routes>
    </>
  );
}
