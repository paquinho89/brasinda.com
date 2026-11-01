import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import MainNavbar from "../componentes/NavBar";

const ReservaPendente: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { email, metodo, multibanco } = location.state || {};

  return (
    <>
      <MainNavbar />
      <div className="container py-4 text-center">
        <h1 className="mb-4" style={{ color: '#ff0093', fontWeight: 800, fontSize: '2.2rem' }}>
          Pago pendente
        </h1>
        <div style={{ maxWidth: 520, margin: '0 auto', fontSize: '1.15rem', color: '#444', lineHeight: 1.7 }}>
          {metodo === 'multibanco' ? (
            <>
              <p>
                Xerouse a túa referencia <strong>Multibanco</strong> correctamente.
              </p>
              <p>
                Para completar a compra, paga coa <strong>entidade e referencia</strong> que che
                mostramos, no caixeiro automático ou na túa banca online.
              </p>
              {multibanco && (multibanco.entidade || multibanco.referencia) && (
                <div style={{ background: '#fff', border: '2px solid #ff0093', borderRadius: 10, padding: '16px 20px', margin: '16px 0', textAlign: 'left' }}>
                  {multibanco.importe && (
                    <p style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
                      <strong>Importe:</strong> {multibanco.importe} €
                    </p>
                  )}
                  <p style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>
                    <strong>Entidade:</strong> {multibanco.entidade}
                  </p>
                  <p style={{ margin: 0, fontSize: '1.1rem' }}>
                    <strong>Referencia:</strong> {multibanco.referencia}
                  </p>
                </div>
              )}
              {multibanco?.voucherUrl && (
                <p>
                  <a
                    href={multibanco.voucherUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#ff0093', fontWeight: 700 }}
                  >
                    Ver ou descargar o comprobante Multibanco
                  </a>
                </p>
              )}
              <p>
                Cando o pago se confirme, recibirás as túas entradas no correo
                {email ? <> <strong style={{ color: '#ff0093' }}>{email}</strong></> : null}.
              </p>
              <p style={{ background: '#fffbf5', border: '1px solid #ffdbea', borderRadius: 8, padding: '12px 16px', fontSize: '1rem', color: '#555' }}>
                ⏳ Lembra: a referencia Multibanco ten un tempo límite de pago. Se non pagas a tempo,
                a reserva quedará libre.
              </p>
            </>
          ) : (
            <p>
              O teu pago está a procesarse. Cando se confirme, recibirás as túas entradas no correo
              {email ? <> <strong style={{ color: '#ff0093' }}>{email}</strong></> : null}.
            </p>
          )}
        </div>

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

export default ReservaPendente;
