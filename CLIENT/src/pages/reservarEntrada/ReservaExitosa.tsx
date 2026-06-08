import React, { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainNavbar from "../componentes/NavBar";

import API_BASE_URL from "../../utils/api";
import confetti from 'canvas-confetti';

const ReservaExitosa: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { ticketId, reservas, email } = location.state || {};

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
        <h1 className="mb-4" style={{ color: '#ff0093', fontWeight: 800, fontSize: '2.4rem' }}>Reserva realizada con éxito!</h1>
        <div className="d-flex justify-content-center mb-4">
          <button
            onClick={handleDownload}
            className="reserva-entrada-btn mt-4"
            style={{ padding: '0.6rem 1.2rem', minWidth: 220, fontSize: '1.25rem' }}
            disabled={!(reservas && reservas.length > 0) && !ticketId}
          >
            {reservas && reservas.length > 1
              ? 'Descargar entradas en PDF'
              : 'Descargar entrada en PDF'}
          </button>
        </div>
        <h3 className="mb-5 mt-5" >Tamén enviamos a entrada ao teu correo electrónico</h3>
          <span style={{ color: '#ff0093', fontWeight: 700, fontSize: '1.5rem' }}>{email || "(descoñecido)"}</span>

        {/* Botón para ir á HomePage */}
        <div className="d-flex justify-content-center mt-4">
          <button
            className="reserva-entrada-btn"
            style={{ padding: '0.35rem 0.9rem', minWidth: 140, fontSize: '1rem' }}
            onClick={() => navigate('/')}
          >
            Ir á páxina principal
          </button>
        </div>
      </div>

    </>
  );
};

export default ReservaExitosa;
