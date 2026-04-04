import { useState } from "react";
import { Button, Card, ListGroup } from "react-bootstrap";
import CreateAccountModal from "./CreacionCuentaCuadro";
import LoginModal from "./InicioSesionCrearEventoCuadro";
import RecuperarEntradaModal from "./RecuperarEntradaCuadro"
import "../../estilos/Botones.css";
import { FaSignInAlt, FaUserPlus, FaTicketAlt, FaGlobe } from "react-icons/fa";
import { useTranslations } from "../../i18n/useTranslations";
import { useLanguage } from "../LanguageContext";
import type { Language } from "../LanguageContext";


function ToggleHamburguer() {
  const [open, setOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogIn, setShowLogIn] = useState(false);
  const [showRecuperacionEntradas, setShowRecuperacionEntradas] = useState(false);
  const { t } = useTranslations();
  const { language, setLanguage } = useLanguage();
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
                <ListGroup.Item action onClick={() => { handleOpenLogIn(); setOpen(false); }}>
                  <FaSignInAlt style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.organizerLogin")}
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => { handleOpenCreateAccount(); setOpen(false); }}>
                  <FaUserPlus style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.organizerCreate")}
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => { handleOpenRecuperacionEntradas(); setOpen(false); }} className="seccion-secundaria">
                  <FaTicketAlt style={{ marginRight: "8px", color: "#ff0093" }} />
                  {t("toggle.reprintTicket")}
                </ListGroup.Item>
                <ListGroup.Item className="seccion-secundaria" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaGlobe style={{ marginRight: "4px", color: "#ff0093" }} />
                  {t("toggle.changeLanguage")}:
                  {(["gl", "es", "en"] as Language[]).map((code) => (
                    <span
                      key={code}
                      onClick={() => setLanguage(code)}
                      style={{
                        cursor: "pointer",
                        fontWeight: language === code ? 700 : 400,
                        color: language === code ? "#ff0093" : "#888",
                        textDecoration: language === code ? "underline" : "none",
                        fontSize: "1.05em",
                      }}
                    >
                      {code.toUpperCase()}
                    </span>
                  ))}
                </ListGroup.Item>
            </ListGroup>
            </Card>
        </>
      )}
      <LoginModal show={showLogIn} onClose={handleCloseLogIn} redirectTo="/panel-organizador"/>
      <CreateAccountModal show={showCreateAccount} onClose={handleCloseCreateAccount}/>
      <RecuperarEntradaModal show={showRecuperacionEntradas} onClose={handleCloseRecuperacionEntradas}/>
    </div>
  );
}

export default ToggleHamburguer;
