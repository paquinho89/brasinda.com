import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import DescripcionEvento from './pages/reservarEntrada/descripcionEvento';
import ReservarEntrada from './pages/reservarEntrada/reservarEntradaConPlano';
import ReservarEntradaSinPlano from './pages/reservarEntrada/reservarEntradaSinPlano';
import InfoPagamento from './pages/reservarEntrada/infoPagamento';
import ReservaExitosa from './pages/reservarEntrada/ReservaExitosa';
import PanelOrganizador from './pages/panelOrganizador/panelOrganizador';
import EventoDetalle from './pages/panelOrganizador/eventoDetalle';
import ResumoEvento from './pages/panelOrganizador/resumoEvento';
import CobroEvento from './pages/panelOrganizador/cobroEvento';
import ListadoEntradas from './pages/panelOrganizador/componentes/listadoEntradas';
import SettingsOrganizador from './pages/panelOrganizador/settingsOrganizador';
import VerificacionEmailPage from './pages/componentes/VerificacionEmailPage';
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

import { useLocation } from 'react-router-dom';
import IntroducirNuevaContraseña from './pages/componentes/IntroducirNuevaContraseña';
import CookieFloatingButton from './pages/componentes/CookieFloatingButton';
import AvisoLegal from './pages/componentes/Políticas/AvisoLegal';
import Nosotros from './pages/componentes/Políticas/Nosotros';
import PoliticaPrivacidad from './pages/componentes/Políticas/PoliticaPrivacidad';
import TerminosCondiciones from './pages/componentes/Políticas/TerminosCondiciones';
import PoliticaCookies from './pages/componentes/Políticas/PolíticaCookies';
import {
  applyCookieConsentEffects,
  COOKIE_CONSENT_UPDATED_EVENT,
  getCookiePreferences,
} from './utils/cookieConsent';

// Wrapper to pass entryPoint prop from query param
function IntroducirNuevaContraseñaWrapper() {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const entryPoint = params.get("entryPoint") === "panel" ? "panel" : "publish";
  return <IntroducirNuevaContraseña entryPoint={entryPoint} />;
}


function App() {
  useEffect(() => {
    const applyCurrentPreferences = () => {
      applyCookieConsentEffects(getCookiePreferences());
    };

    applyCurrentPreferences();
    window.addEventListener(COOKIE_CONSENT_UPDATED_EVENT, applyCurrentPreferences);

    return () => {
      window.removeEventListener(COOKIE_CONSENT_UPDATED_EVENT, applyCurrentPreferences);
    };
  }, []);

  return (
    <Router>
      <>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="evento/:id" element={<DescripcionEvento />} />
          <Route path="reservar-entrada/:id" element={<ReservarEntrada />} />
          <Route path="reservar-entrada-sen-plano/:id" element={<ReservarEntradaSinPlano />} />
          <Route path="pago/:eventoId/:zona" element={<InfoPagamento />} />
          <Route path="info-pagamento/:eventoId/:zona" element={<InfoPagamento />} />

          <Route path="reserva-exitosa" element={<ReservaExitosa />} />

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
          <Route path="reset-password/:uid/:token" element={<IntroducirNuevaContraseñaWrapper />} />
          <Route path="sobre-nos" element={<Nosotros />} />
          <Route path="aviso-legal" element={<AvisoLegal />} />
          <Route path="politica-privacidade" element={<PoliticaPrivacidad />} />
          <Route path="condicions-uso" element={<TerminosCondiciones />} />
          <Route path="cookies" element={<PoliticaCookies />} />
  
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

        <CookieFloatingButton />
      </>
    </Router>
  );
}

export default App;
