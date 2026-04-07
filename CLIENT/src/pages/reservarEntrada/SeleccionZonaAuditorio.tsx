import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import API_BASE_URL from "../../utils/api";

// import SeleccionButacaAuditorio from "./SeleccionButacaAuditorio"; // (unused)

const SeleccionZonaAuditorio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<any>(location.state?.evento || null);
  const [loading, setLoading] = useState(!location.state?.evento);
  const [error, setError] = useState<string | null>(null);
  // Eliminamos o estado local de zonaSeleccionada

  useEffect(() => {
    if (!evento && id) {
      setLoading(true);
      fetch(`${API_BASE_URL}/crear-eventos/publico/${id}/`)
        .then((res) => {
          if (!res.ok) throw new Error("Non se atopou o evento");
          return res.json();
        })
        .then((data) => {
          setEvento(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Erro ao cargar o evento");
          setLoading(false);
        });
    }
  }, [id, evento]);

  if (loading) {
    return (
      <div className="seleccion-butaca-auditorio-fullscreen" style={{ minHeight: "100vh", background: "#f8f9fa", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }



  return (
    <div className="seleccion-butaca-auditorio-fullscreen" style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <MainNavbar />
      <div style={{ maxWidth: 500, margin: "0 auto", padding: 32 }}>
        <h2 style={{ textAlign: "center", marginBottom: 18 }}>Selecciona unha zona</h2>
        {evento?.localizacion && (
          <div style={{ textAlign: "center", fontWeight: 600, fontSize: 20, color: "#ff0093", marginBottom: 22 }}>
            {evento.localizacion}
          </div>
        )}
        <div className="auditorio-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <button className="zona anfiteatro" style={{ margin: "0 auto 25px auto" }} onClick={() => navigate(`/reservar-entrada-auditorio/${id}/anfiteatro`)}>ANFITEATRO</button>
          <div className="platea" style={{ display: "flex", justifyContent: "center", gap: 15 }}>
            <button className="zona esquerda" onClick={() => navigate(`/reservar-entrada-auditorio/${id}/esquerda`)}>ESQUERDA</button>
            <button className="zona central" onClick={() => navigate(`/reservar-entrada-auditorio/${id}/central`)}>CENTRAL</button>
            <button className="zona dereita" onClick={() => navigate(`/reservar-entrada-auditorio/${id}/dereita`)}>DEREITA</button>
          </div>
        </div>
      </div>
      {evento && evento.id ? null : (
        <div style={{ textAlign: 'center', color: '#ff0093', marginTop: 40 }}>
          {error || "Non se atopou o evento."}
        </div>
      )}
    </div>
  );
};

export default SeleccionZonaAuditorio;
