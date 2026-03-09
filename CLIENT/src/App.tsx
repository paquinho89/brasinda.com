import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import DescripcionEvento from './pages/reservarEntrada/descripcionEvento';
import ReservarEntrada from './pages/reservarEntrada/reservarEntradaConPlano';
import ReservarEntradaSinPlano from './pages/reservarEntrada/reservarEntradaSinPlano';
import InfoPagamento from './pages/reservarEntrada/infoPagamento';
// import PagoConfirmado from './pages/reservarEntrada/pagoConfirmado';
import PanelOrganizador from './pages/panelOrganizador/panelOrganizador';
import EventoDetalle from './pages/panelOrganizador/eventoDetalle';
import ResumoEvento from './pages/panelOrganizador/resumoEvento';
import CobroEvento from './pages/panelOrganizador/cobroEvento';
import ListadoEntradas from './pages/panelOrganizador/componentes/listadoEntradas';
import SettingsOrganizador from './pages/panelOrganizador/settingsOrganizador';
import VerificacionEmailPage from './pages/componentes/2ConfirmacionEmail';
import IntroducirNuevaContraseña from './pages/componentes/IntroducirNuevaContraseña';
import { CreateEventLayout } from './pages/crearEvento/0ElementoPadre';
import TipoEvento from './pages/crearEvento/1TipoEvento';
import TituloEvento from './pages/crearEvento/2TituloEventoDescripcion';
import Imagen from './pages/crearEvento/3Imagen';
import Fecha from './pages/crearEvento/4Fecha';
import Lugar from './pages/crearEvento/5Lugar';
import Entradas from './pages/crearEvento/6Entradas';
import PrezoContaBancaria from './pages/crearEvento/7PrezoContaBancaria';
import CondicionesLegales from './pages/crearEvento/8CondicionesLegales';
import Resumen from './pages/crearEvento/9Resumen';

import AuditorioOurenseZonaCentral from './pages/planoAuditorios/Planos/auditorioOurense/zonaCentral';
import AuditorioOurenseDereita from './pages/planoAuditorios/Planos/auditorioOurense/dereita';
import AuditorioOurenseEsquerda from './pages/planoAuditorios/Planos/auditorioOurense/esquerda';
import AuditorioOurenseAnfiteatro from './pages/planoAuditorios/Planos/auditorioOurense/anfiteatro';
import AuditorioVerinZonaCentral from './pages/planoAuditorios/Planos/auditorioVerin/zonaCentral';
import AuditorioVerinLateralEsquerda from './pages/planoAuditorios/Planos/auditorioVerin/zonaLateralEsquerda';
import AuditorioVerinLateralDereita from './pages/planoAuditorios/Planos/auditorioVerin/zonaLateralDereita';
import AuditorioVerinAnfiteatro from './pages/planoAuditorios/Planos/auditorioVerin/anfiteatro';
import AuditorioVigoAnfiteatro from './pages/planoAuditorios/Planos/auditorioVigo/anfiteatro';


function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="evento/:id" element={<DescripcionEvento />} />
        <Route path="reservar-entrada/:id" element={<ReservarEntrada />} />
        <Route path="reservar-entrada-sen-plano/:id" element={<ReservarEntradaSinPlano />} />
        <Route path="pago/:eventoId/:zona" element={<InfoPagamento />} />
        {/* <Route path="pago-confirmado" element={<PagoConfirmado />} /> */}

        <Route path="auditorio-ourense-central" element={<AuditorioOurenseZonaCentral />}></Route>
        <Route path="auditorio-ourense-dereita" element={<AuditorioOurenseDereita />}></Route>
        <Route path="auditorio-ourense-esquerda" element={<AuditorioOurenseEsquerda />}></Route>
        <Route path="auditorio-ourense-anfiteatro" element={<AuditorioOurenseAnfiteatro />}></Route>

        <Route path="auditorio-verin-central" element={<AuditorioVerinZonaCentral />}></Route>
        <Route path="auditorio-verin-dereita" element={<AuditorioVerinLateralDereita />}></Route>
        <Route path="auditorio-verin-esquerda" element={<AuditorioVerinLateralEsquerda />}></Route>
        <Route path="auditorio-verin-anfiteatro" element={<AuditorioVerinAnfiteatro />}></Route>
        
        <Route path="auditorio-vigo-anfiteatro" element={<AuditorioVigoAnfiteatro />}></Route>

        <Route path="panel-organizador" element={<PanelOrganizador />} />
        <Route path="panel-organizador/evento/:id" element={<EventoDetalle />} />
        <Route path="panel-organizador/evento/:id/resumo" element={<ResumoEvento />} />
          <Route path="panel-organizador/evento/:id/entradas" element={<ListadoEntradas />} />
        <Route path="panel-organizador/cobro/:id" element={<CobroEvento />} />
        <Route path="panel-organizador/settings" element={<SettingsOrganizador />} />
        <Route path="verificacion/:uid/:token" element={<VerificacionEmailPage />} />
        <Route path="reset-password/:uid/:token" element={<IntroducirNuevaContraseña />} />
        <Route path="crear-evento" element={<CreateEventLayout />}>
          <Route path="tipo" element={<TipoEvento />} />
          <Route path="titulo" element={<TituloEvento />} />
          <Route path="cartel" element={<Imagen />} />
          <Route path="fecha" element={<Fecha />} />
          <Route path="lugar" element={<Lugar />} />
          <Route path="entradas" element={<Entradas />} />
          <Route path="prezo" element={<PrezoContaBancaria />} />
          <Route path="condiciones-legales" element={<CondicionesLegales />} />
          <Route path="resumen" element={<Resumen />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App
