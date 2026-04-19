
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import MainNavbar from "../componentes/NavBar";
import TarjetaEventoHome from "../componentes/tarjetaEventoHome";
import API_BASE_URL from "../../utils/api";
import confetti from 'canvas-confetti';


const ReservaExitosa: React.FC = () => {
  const location = useLocation();
  const { eventoId } = location.state || {};
  const [evento, setEvento] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  useEffect(() => {
    if (!eventoId) return;
    setLoading(true);
    setError(null);
    fetch(`${API_BASE_URL}/crear-eventos/publico/${eventoId}/`)
      .then((resp) => {
        if (!resp.ok) throw new Error("Erro ao cargar evento");
        return resp.json();
      })
      .then((data) => setEvento(data))
      .catch((e) => setError(e.message || "Erro ao cargar evento"))
      .finally(() => setLoading(false));
  }, [eventoId]);

  return (
    <>
      <MainNavbar />
      <div className="container py-4 text-center">
        <h1 className="mb-4" style={{ color: '#ff0093', fontWeight: 800, fontSize: '2.4rem' }}>Publicación recibida!</h1>
        <div className="mb-4" style={{ fontSize: '1.13em', maxWidth: 600, margin: '0 auto', background: '#ffe6f3', borderRadius: 12, padding: '1.2em 1.5em', color: '#222', boxShadow: '0 2px 8px #0001' }}>
          <span style={{ fontWeight: 600, color: '#ff0093', fontSize: '1.18em' }}>Estamos traballando para comprobar toda a info e publicar o evento o antes posible.</span>
          <br />
          <span style={{ fontSize: '1.05em', display: 'inline-block', marginTop: 8 }}>
            Lembre que pode reservar invitacións ou modificar datos do evento no <span style={{ fontWeight: 500 }}>panel do organizador</span>.
          </span>
        </div>

        {/* Card do evento publicado */}
        {loading && <div className="my-4">Cargando evento...</div>}
        {error && <div className="alert alert-danger my-4">{error}</div>}
        {evento && (
          <div className="d-flex justify-content-center my-4">
            <div style={{ maxWidth: 400, width: '100%' }}>
              <TarjetaEventoHome evento={evento} modoPublicacionExitosa />
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ReservaExitosa;
