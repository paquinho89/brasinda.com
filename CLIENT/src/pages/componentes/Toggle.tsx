import { useState } from "react";
import { Button, Card, ListGroup } from "react-bootstrap";
import CreateAccountModal from "./CreacionCuentaCuadro";
import LoginModal from "./InicioSesionCrearEventoCuadro";
import RecuperarEntradaModal from "./RecuperarEntradaCuadro"
import IdiomaModal from "./idiomaModal";
import "../../estilos/Botones.css";
import { FaSignInAlt, FaUserPlus, FaTicketAlt, FaGlobe } from "react-icons/fa";
import { useTranslations } from "../../i18n/useTranslations";


function ToggleHamburguer() {
  const [open, setOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogIn, setShowLogIn] = useState(false);
  const [showRecuperacionEntradas, setShowRecuperacionEntradas] = useState(false);
  const [showIdioma, setShowIdioma] = useState(false);
  const { language, t } = useTranslations();
  const handleOpenCreateAccount = () => setShowCreateAccount(true);
  const handleCloseCreateAccount = () => setShowCreateAccount(false);
  const handleOpenLogIn = () => setShowLogIn(true);
  const handleCloseLogIn = () => setShowLogIn(false);
  const handleOpenRecuperacionEntradas = () => setShowRecuperacionEntradas(true);
  const handleCloseRecuperacionEntradas = () => setShowRecuperacionEntradas(false);

  return (
    <div style={{ position: "relative" }}>
      <Button onClick={() => setOpen(!open)} className= "toggle-hamburguer">
        {/* 3 rayitas */}
        <span className="hamburguer-line" />
        <span className="hamburguer-line" />
        <span className="hamburguer-line" />
      </Button>

      {/* Menú desplegable circular */}
      {open && (
        <>
            <Card className="toggle-card">
            <ListGroup variant="flush">
                <ListGroup.Item action onClick={handleOpenLogIn}>
                  <FaSignInAlt style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.organizerLogin")}
                </ListGroup.Item>
                <ListGroup.Item action onClick={handleOpenCreateAccount}>
                  <FaUserPlus style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.organizerCreate")}
                </ListGroup.Item>
                <ListGroup.Item action onClick={handleOpenRecuperacionEntradas} className="seccion-secundaria">
                  <FaTicketAlt style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.reprintTicket")}
                </ListGroup.Item>
                <ListGroup.Item
                  action
                  onClick={() => {
                    setShowIdioma(true);
                    setOpen(false);
                  }}
                  className="seccion-secundaria"
                >
                  <FaGlobe style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.changeLanguage")}:
                  <span style={{ marginLeft: 10, fontWeight: 600, color: "#ff0093", fontSize: "1.05em" }}>
                    {t(`language.${language}`)}
                  </span>
                </ListGroup.Item>
            </ListGroup>
            </Card>
            <LoginModal show={showLogIn} onClose={handleCloseLogIn} redirectTo="/panel-organizador"/>
            <CreateAccountModal show={showCreateAccount} onClose={handleCloseCreateAccount}/>
            <RecuperarEntradaModal show={showRecuperacionEntradas} onClose={handleCloseRecuperacionEntradas}/>
        </>
      )}
      <IdiomaModal show={showIdioma} onClose={() => setShowIdioma(false)}/>
    </div>
  );
}

export default ToggleHamburguer;
