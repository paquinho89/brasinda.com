import { Navbar, Nav, Button, ListGroup, Card } from "react-bootstrap";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../estilos/NavBar.css";
import { FaSignInAlt, FaTools, FaTicketAlt } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import { useLanguage } from "../LanguageContext";

function MainNavbar() {
  const navigate = useNavigate();
  const { organizador, logout } = useAuth(); // ✅ contexto global
  const { language, setLanguage } = useLanguage();
  const [open, setOpen] = useState(false);

  let organizadorUI = organizador;
  if (!organizadorUI) {
    try {
      const raw = localStorage.getItem("organizador");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed) {
          organizadorUI = {
            nome_organizador: parsed.nome_organizador || parsed.nome || parsed.username || "Organizador",
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
    <Navbar expand="lg" className="main-navbar py-3">
      <div className="nav-container d-flex align-items-center justify-content-between">
        {/* Logo / Home */}
        <Navbar.Brand
          onClick={() => navigate("/")}
          className="site-name"
          style={{ cursor: "pointer" }}
        >
          brasinda.com
        </Navbar.Brand>
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
                      Panel de Xestión de Eventos
                    </ListGroup.Item>
                    <ListGroup.Item
                      action
                      onClick={() => {
                        navigate("/panel-organizador/settings");
                        setOpen(false);
                      }}
                    >
                      <FaTools style={{ marginRight: "8px" }} />
                      Configuración da Conta
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
                      <span style={{ marginRight: "8px" }}>🇪🇸</span> Galego
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
                      <span style={{ marginRight: "8px" }}>🇪🇸</span> Español
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
                      <span style={{ marginRight: "8px" }}>🇬🇧</span> English
                    </ListGroup.Item>
                    <ListGroup.Item action onClick={handleLogout}>
                      <FaSignInAlt style={{ marginRight: "8px" }} />
                      Pechar Sesión
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