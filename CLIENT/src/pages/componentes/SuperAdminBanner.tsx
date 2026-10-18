import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function SuperAdminBanner() {
  const { organizador, login } = useAuth();
  const navigate = useNavigate();

  const raw = localStorage.getItem("superadmin_session");
  if (!raw || !organizador || organizador.is_superadmin) return null;

  const volver = () => {
    try {
      const s = JSON.parse(raw);
      localStorage.removeItem("superadmin_session");
      login(s.organizador, s.access_token, s.refresh_token || undefined);
      navigate("/superadmin");
    } catch {
      localStorage.removeItem("superadmin_session");
    }
  };

  return (
    <div
      style={{
        position: "fixed", bottom: 16, right: 16, zIndex: 3000, background: "#212529", color: "#fff",
        padding: "10px 16px", borderRadius: 12, display: "flex", gap: 12, alignItems: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,.3)",
      }}
    >
      <span>Vendo como <strong>{organizador.email}</strong></span>
      <button className="btn btn-sm btn-light" onClick={volver}>Volver a superusuario</button>
    </div>
  );
}
