import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Button, Spinner } from "react-bootstrap";
import AuditorioSelectorVerin from "../planoAuditorios/auditorioBotones/auditorioVerin";
import AuditorioSelectorOurense from "../planoAuditorios/auditorioBotones/auditorioOurense";
import API_BASE_URL from "../../utils/api";

const zonasAuditorio = ["Zona A", "Zona B", "Zona C"]; // Exemplo, adaptar ao teu modelo

const SeleccionButacaAuditorio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<any>(location.state?.evento || null);
  const [loading, setLoading] = useState(!location.state?.evento);
  const [error, setError] = useState<string | null>(null);
  const [zonaActual, setZonaActual] = useState(0);

  useEffect(() => {
    if (!evento && id) {
      setLoading(true);
      const token = localStorage.getItem("access_token");
      fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      })
        .then((res) => {
          if (!res.ok) throw new Error(res.status === 401 ? "Acceso non autorizado. Inicia sesión." : "Non se atopou o evento");
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

  const AuditorioComponente = evento?.localizacion?.toLowerCase().includes("verin")
    ? AuditorioSelectorVerin
    : AuditorioSelectorOurense;

  const handleZonaChange = (delta: number) => {
    setZonaActual((prev) => {
      let next = prev + delta;
      if (next < 0) next = zonasAuditorio.length - 1;
      if (next >= zonasAuditorio.length) next = 0;
      return next;
    });
  };

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
      <div className="d-flex justify-content-between align-items-center mb-4" style={{ padding: 24 }}>
        <Button variant="light" onClick={() => handleZonaChange(-1)}>&lt;</Button>
        <h3 style={{ margin: 0 }}>{zonasAuditorio[zonaActual]}</h3>
        <Button variant="light" onClick={() => handleZonaChange(1)}>&gt;</Button>
      </div>
      {evento && evento.id ? (
        <>
          <div style={{ width: "100%", display: "flex", justifyContent: "center" }}>
            <AuditorioComponente eventoId={evento.id} />
          </div>
          <div className="d-flex justify-content-center mt-4">
            <Button className="boton-avance" onClick={() => navigate("/reservar-entrada/datos", { state: { evento, zona: zonasAuditorio[zonaActual] } })}>
              Continuar
            </Button>
          </div>
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#ff0093', marginTop: 40 }}>
          {error || "Non se atopou o evento."}
        </div>
      )}
    </div>
  );
};

export default SeleccionButacaAuditorio;
