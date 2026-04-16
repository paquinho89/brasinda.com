import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainNavbar from "../componentes/NavBar";

import API_BASE_URL from "../../utils/api";
import confetti from 'canvas-confetti';

const ReservaExitosa: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticketId, reservas, email, eventoId } = location.state || {};

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  // Backend endpoint to download PDF (adjust as needed)
  const handleDownload = () => {
    if (reservas && Array.isArray(reservas) && reservas.length > 0) {
      const ids = reservas.join(',');
      window.open(`${API_BASE_URL}/eventos/pdf-entradas-multipaxina/?reservas=${ids}`, '_blank');
    } else if (ticketId) {
      window.open(`${API_BASE_URL}/descargar-pdf/${ticketId}`, '_blank');
    }
  };

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
        <div className="d-flex flex-column flex-md-row justify-content-center gap-3 mb-5">
          <button
            className="reserva-entrada-btn"
            onClick={() => {
              if (eventoId) {
                window.open(`/panel-organizador/evento/${eventoId}`, '_blank');
              } else {
                window.open('/panel-organizador', '_blank');
              }
            }}
          >
            Xestionar Evento
          </button>
          <button
            className="reserva-entrada-btn"
            onClick={() => {
              if (eventoId) {
                window.open(`/evento/${eventoId}`, '_blank');
              } else {
                window.open('/', '_blank');
              }
            }}
          >
            Ver o seu evento público
          </button>
        </div>
      </div>
    </>
  );
};

export default ReservaExitosa;
