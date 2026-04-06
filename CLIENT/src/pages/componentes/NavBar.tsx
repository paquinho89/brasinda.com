import { Navbar } from "react-bootstrap";
import logo2 from "../../estilos/branding/logo.png";
import React, { useContext } from "react";
// Contexto para mensaxes globais na NavBar
export const NavBarMessageContext = React.createContext<{
  message: string;
  setMessage: (msg: string) => void;
}>({ message: "", setMessage: () => {} });
import { useNavigate } from "react-router-dom";
import "../../estilos/NavBar.css";
import { FaSignInAlt, FaTools, FaTicketAlt } from "react-icons/fa";
// import { useAuth } from "../AuthContext";
// import { useLanguage } from "../LanguageContext";
// import { useTranslations } from "../../i18n/useTranslations";

function MainNavbar() {
  const { message } = useContext(NavBarMessageContext);
  const navigate = useNavigate();
  // const { organizador, logout } = useAuth(); // ✅ contexto global
  // const { language, setLanguage } = useLanguage();
  // const { t } = useTranslations();
  // const [open, setOpen] = useState(false); // If open/setOpen are not used, remove this line.

  // let organizadorUI = organizador; // removed, as organizador is not defined
  let organizadorUI = null;
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

  // Remove handleLogout if not used in the JSX below
  // const handleLogout = () => {
  //   logout();      // borra sesión global
  //   navigate("/"); // redirixe a Home
  //   setOpen(false); // pecha o toggle
  // };

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
          <span className="d-none d-md-inline" style={{ fontWeight: 800, fontSize: "1.5rem", color: "#ff0093", marginBottom: "1rem", display: "inline-block", transform: "translateY(10px)" }}>rasinda.com</span>
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

        {/* Ocultamos o botón de usuario aquí para evitar duplicados cando se mostra na Home */}
        {/* {organizadorUI && ( ... )} */}
      </div>
    </Navbar>
  );
}

export default MainNavbar;