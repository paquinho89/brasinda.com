import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./AuthContext";
import API_BASE_URL from "../utils/api";

interface OrganizadorItem {
  id: number;
  email: string;
  nome_organizador: string;
  nome_empresa?: string | null;
  foto_url?: string | null;
  fecha_creacion: string;
  is_active: boolean;
}

export default function SuperAdmin() {
  const { organizador, token, login, logout } = useAuth();
  const navigate = useNavigate();
  const [lista, setLista] = useState<OrganizadorItem[]>([]);
  const [filtro, setFiltro] = useState("");
  const [erro, setErro] = useState("");
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!token || !organizador?.is_superadmin) {
      navigate("/", { replace: true });
      return;
    }
    fetch(`${API_BASE_URL}/organizador/admin/organizadores/`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (resp) => {
        if (!resp.ok) throw new Error();
        setLista(await resp.json());
      })
      .catch(() => setErro("Non se puido cargar a lista de usuarios."))
      .finally(() => setCargando(false));
  }, [token, organizador, navigate]);

  const filtrados = useMemo(() => {
    const q = filtro.trim().toLowerCase();
    if (!q) return lista;
    return lista.filter((o) =>
      [o.email, o.nome_organizador, o.nome_empresa || ""].some((v) => v.toLowerCase().includes(q))
    );
  }, [lista, filtro]);

  const entrarComo = async (o: OrganizadorItem) => {
    if (!token || !organizador) return;
    setErro("");
    try {
      const resp = await fetch(`${API_BASE_URL}/organizador/admin/impersonar/${o.id}/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Erro");

      // Gardamos a sesión do superusuario para poder volver
      localStorage.setItem(
        "superadmin_session",
        JSON.stringify({
          organizador,
          access_token: token,
          refresh_token: localStorage.getItem("refresh_token"),
        })
      );
      login(data.organizador, data.access_token, data.refresh_token);
      navigate("/panel-organizador");
    } catch {
      setErro("Non se puido entrar como este usuario.");
    }
  };

  return (
    <div className="container py-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="m-0">Superusuario · Organizadores</h2>
        <button className="btn btn-outline-secondary" onClick={() => { logout(); navigate("/"); }}>
          Pechar sesión
        </button>
      </div>

      <input
        className="form-control mb-3"
        placeholder="Buscar por email ou nome"
        value={filtro}
        onChange={(e) => setFiltro(e.target.value)}
      />

      {erro && <div className="alert alert-danger">{erro}</div>}
      {cargando && <p>Cargando...</p>}

      <div className="list-group">
        {filtrados.map((o) => (
          <button
            key={o.id}
            type="button"
            className="list-group-item list-group-item-action d-flex align-items-center gap-3"
            onClick={() => entrarComo(o)}
          >
            {o.foto_url ? (
              <img src={o.foto_url} alt="" style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#ddd" }} />
            )}
            <div className="flex-grow-1 text-start">
              <strong>{o.nome_organizador}</strong>
              {o.nome_empresa ? <span className="text-muted"> · {o.nome_empresa}</span> : null}
              <div className="text-muted" style={{ fontSize: 14 }}>{o.email}</div>
            </div>
            <small className="text-muted">{new Date(o.fecha_creacion).toLocaleDateString()}</small>
          </button>
        ))}
        {!cargando && filtrados.length === 0 && <p className="text-muted">Sen resultados.</p>}
      </div>
    </div>
  );
}
