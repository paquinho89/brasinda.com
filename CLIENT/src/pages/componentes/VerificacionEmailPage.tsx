import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import API_BASE_URL from "../../utils/api";

export default function VerificacionEmailPage() {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const { login } = useAuth();
  const navigate = useNavigate();
  const [estado, setEstado] = useState<"cargando" | "ok" | "erro">("cargando");
  const [mensaxe, setMensaxe] = useState("");

  useEffect(() => {
    if (!uid || !token) return;
    const verificar = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/organizador/verificar/${uid}/${token}/`);
        const data = await resp.json();
        if (resp.ok && data.access_token) {
          setEstado("ok");
          setMensaxe("Conta verificada correctamente!");
          login(data.organizador, data.access_token, data.refresh_token);
          setTimeout(() => navigate("/panel-organizador"), 2000);
        } else {
          setEstado("erro");
          setMensaxe(data.error || "Non se puido verificar a conta.");
        }
      } catch {
        setEstado("erro");
        setMensaxe("Erro de conexión ao servidor.");
      }
    };
    verificar();
  }, [uid, token]);

  return (
    <div className="container py-5 text-center">
      {estado === "cargando" && <p>Verificando a túa conta...</p>}
      {estado === "ok" && (
        <div className="alert alert-success">{mensaxe}</div>
      )}
      {estado === "erro" && (
        <div className="alert alert-danger">{mensaxe}</div>
      )}
    </div>
  );
}
