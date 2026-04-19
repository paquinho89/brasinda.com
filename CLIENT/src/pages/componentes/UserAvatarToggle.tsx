import { useState } from "react";
import { Button, Card, ListGroup } from "react-bootstrap";
import { FaSignInAlt, FaTools, FaTicketAlt } from "react-icons/fa";
import { useAuth } from "../AuthContext";
import { useTranslations } from "../../i18n/useTranslations";
import { useNavigate } from "react-router-dom";

export default function UserAvatarToggle({ hideLanguages = false }: { hideLanguages?: boolean }) {
  const navigate = useNavigate();
  const { organizador, logout } = useAuth();
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
  if (!organizadorUI) return null;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <Button onClick={() => setOpen(!open)} className="user-avatar-btn border-0 bg-transparent p-0 me-2" style={{ width: 42, height: 42, borderRadius: '50%', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', padding: 0, minWidth: 0, minHeight: 0, cursor: 'pointer', outline: 'none' }}>
        <img src={organizadorUI.foto_url || "/default-avatar.png"} alt="Foto organizador" style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none', display: 'block' }} />
      </Button>
      {open && (
        <Card className="toggle-card position-absolute mt-2 end-0" style={{ zIndex: 1000, right: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '1.08rem', color: '#ff0093', padding: '12px 18px 6px 18px', borderBottom: '1px solid #ffe6f2', background: 'white', textAlign: 'left' }}>{organizadorUI?.nome_organizador}</div>
          <ListGroup variant="flush">
            <ListGroup.Item action onClick={() => { window.location.href = "/panel-organizador"; setOpen(false); }}>
              <FaTicketAlt style={{ marginRight: "8px" }} /> Xestionar eventos
            </ListGroup.Item>
            <ListGroup.Item action onClick={() => { window.location.href = "/panel-organizador/settings"; setOpen(false); }}>
              <FaTools style={{ marginRight: "8px" }} /> Configuración conta
            </ListGroup.Item>
            {!hideLanguages && (
              <>
                <ListGroup.Item action onClick={() => { localStorage.setItem('language', 'gl'); setOpen(false); }}>
                  <span style={{ marginRight: "8px" }}>🇬🇱</span> Galego
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => { localStorage.setItem('language', 'es'); setOpen(false); }}>
                  <span style={{ marginRight: "8px" }}>🇪🇸</span> Español
                </ListGroup.Item>
                <ListGroup.Item action onClick={() => { localStorage.setItem('language', 'en'); setOpen(false); }}>
                  <span style={{ marginRight: "8px" }}>🇬🇧</span> English
                </ListGroup.Item>
              </>
            )}
            <ListGroup.Item action onClick={() => {
            logout();
            setOpen(false);
            navigate("/");
          }}>
              <FaSignInAlt style={{ marginRight: "8px" }} /> Pechar sesión
            </ListGroup.Item>
          </ListGroup>
        </Card>
      )}
    </div>
  );
}
