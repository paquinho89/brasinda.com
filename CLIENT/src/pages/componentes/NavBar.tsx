import { Navbar, Nav, Button, ListGroup, Card } from "react-bootstrap";
import logo2 from "../../estilos/branding/logo.png";
import React, { useState, useContext } from "react";
// Contexto para mensaxes globais na NavBar
export const NavBarMessageContext = React.createContext<{
  message: string;
  setMessage: (msg: string) => void;
}>({ message: "", setMessage: () => {} });
import { useNavigate } from "react-router-dom";
import "../../estilos/NavBar.css";
import { FaSignInAlt, FaTools, FaTicketAlt, FaHome } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";
import { useTranslations } from "../../i18n/useTranslations";

function MainNavbar() {
  const { message } = useContext(NavBarMessageContext);
  const navigate = useNavigate();
  const { organizador, logout } = useAuth(); // ✅ contexto global
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslations();
  const [open, setOpen] = useState(false);

  let organizadorUI = organizador;
  if (!organizadorUI) {
    try {
      const raw = localStorage.getItem("organizador");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          organizadorUI = {
            nome_organizador: parsed.nome_organizador || parsed.nome || parsed.username || t("navbar.organizerFallback"),
            foto_url: parsed.foto_url || parsed.foto_organizador || null,
            email: parsed.email,
            id: parsed.id,
          };
        }
      }
    } catch {
      organizadorUI = null;
    }
  }

  const handleLogout = () => {
    logout();      // borra sesión global
    navigate("/"); // redirixe a Home
    setOpen(false); // pecha o toggle
  };

  return (
    <Navbar expand="lg" className="main-navbar py-3" style={{paddingLeft: "15px", marginLeft: 0, position: 'relative'}}>
      <div className="nav-container d-flex align-items-center justify-content-start" style={{ paddingLeft: 0, marginLeft: 0, width: '100%' }}>
        {/* Logo / Home */}
        <Navbar.Brand
          onClick={() => navigate("/")}
          className="site-name d-flex align-items-center"
          style={{ cursor: "pointer" }}
        >
          <img
            src={logo2}
            alt="Logo brasinda"
            style={{ height: "54px", width: "54px", marginRight: "-3px", marginLeft: "-2px", verticalAlign: "middle", transform: "translateY(-7px)" }}
          />
          <span style={{ fontWeight: 800, fontSize: "1.5rem", color: "#ff0093", marginBottom: "1rem", display: "inline-block", transform: "translateY(10px)" }}>rasinda.com</span>
        </Navbar.Brand>

        {/* Mensaxe centrada na NavBar */}
        {message && (
          <div style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#1a9c3c',
            fontWeight: 600,
            fontSize: '1.15rem',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 8,
            padding: '6px 24px',
            zIndex: 2000,
            boxShadow: '0 2px 8px rgba(26,156,60,0.08)'
          }}>
            {message}
          </div>
        )}

        {!message && (
          <Button
            className="reserva-entrada-btn"
            onClick={() => navigate("/")}
            aria-label={t("navbar.homeAria")}
            title={t("navbar.homeTitle")}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 1500,
              minWidth: "56px",
              width: "56px",
              height: "56px",
              padding: 0,
              borderRadius: "50%",
              border: "none",
              background: "transparent",
              boxShadow: "none",
              color: "#ff0093",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <FaHome size={30} />
          </Button>
        )}

        <Nav className={`ms-auto d-flex align-items-center position-relative ${organizadorUI ? "organizador-nav-group" : ""}`}>
          {organizadorUI && (
            <>
              {/* Foto do organizador */}
              <img
                src={organizadorUI.foto_url || "/default-avatar.png"}
                alt="Foto organizador"
                className="rounded-circle me-2"
                style={{ width: "38px", height: "38px", objectFit: "cover" }}
              />

              {/* Botón co nome */}
              <Button
                className="reserva-entrada-btn"
                onClick={() => setOpen(!open)}
              >
                {organizadorUI.nome_organizador}
              </Button>

              {/* Toggle menú */}
              {open && (
                <Card
                  className="toggle-card position-absolute mt-2 end-0"
                  style={{ zIndex: 1000 }} // garante que está encima doutros elementos
                >
                  <ListGroup variant="flush">
                    <ListGroup.Item
                      action
                      onClick={() => {
                        navigate("/panel-organizador");
                        setOpen(false);
                      }}
                    >
                      <FaTicketAlt style={{ marginRight: "8px" }} />
                      {t("navbar.eventsManagement")}
                    </ListGroup.Item>
                    <ListGroup.Item
                      action
                      onClick={() => {
                        navigate("/panel-organizador/settings");
                        setOpen(false);
                      }}
                    >
                      <FaTools style={{ marginRight: "8px" }} />
                      {t("navbar.accountSettings")}
                    </ListGroup.Item>
                    <ListGroup.Item
                      action
                      onClick={() => {
                        setLanguage("gl");
                      }}
                      style={{
                        backgroundColor: language === "gl" ? "#ffe6f2" : "transparent",
                        color: language === "gl" ? "#ff0093" : "#222222",
                      }}
                    >
                      <span style={{ marginRight: "8px" }}>🇬🇱</span> {t("language.gl")}
                    </ListGroup.Item>
                    <ListGroup.Item
                      action
                      onClick={() => {
                        setLanguage("es");
                      }}
                      style={{
                        backgroundColor: language === "es" ? "#ffe6f2" : "transparent",
                        color: language === "es" ? "#ff0093" : "#222222",
                      }}
                    >
                      <span style={{ marginRight: "8px" }}>🇪🇸</span> {t("language.es")}
                    </ListGroup.Item>
                    <ListGroup.Item
                      action
                      onClick={() => {
                        setLanguage("en");
                      }}
                      style={{
                        backgroundColor: language === "en" ? "#ffe6f2" : "transparent",
                        color: language === "en" ? "#ff0093" : "#222222",
                      }}
                    >
                      <span style={{ marginRight: "8px" }}>🇬🇧</span> {t("language.en")}
                    </ListGroup.Item>
                    <ListGroup.Item action onClick={handleLogout}>
                      <FaSignInAlt style={{ marginRight: "8px" }} />
                      {t("navbar.logout")}
                    </ListGroup.Item>
                  </ListGroup>
                </Card>
              )}
            </>
          )}
        </Nav>
      </div>
    </Navbar>
  );
}

export default MainNavbar;