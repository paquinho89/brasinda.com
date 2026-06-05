import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import MainNavbar from "../componentes/NavBar";
import confetti from 'canvas-confetti';

const ReservaExitosa: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  return (
    <>
      <MainNavbar />
      <div className="container py-4 text-center">
        <h1 className="mb-4" style={{ color: '#ff0093', fontWeight: 800, fontSize: '2.4rem' }}>¡O seu diñeiro está en camiño!</h1>
  
        <h3 className="mb-3 mt-5" >O diñeiro será ingresado na súa conta nun prazo máximo de 24 horas.</h3>
        <div style={{ fontSize: "5rem", lineHeight: 1 }} className="mb-5">💵</div>

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
