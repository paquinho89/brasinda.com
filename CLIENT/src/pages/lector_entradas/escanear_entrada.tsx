
import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
// ...existing code...
import { Html5QrcodeScanner } from 'html5-qrcode';

import MainNavbar from '../componentes/NavBar';
import '../../estilos/Botones.css';

const API_URL = `${import.meta.env.VITE_API_BASE_URL}/eventos/validar-entrada/`;

const EscanearEntrada: React.FC = () => {
  const [resultado, setResultado] = useState<string | null>(null);
  const [codigoLido, setCodigoLido] = useState<string | null>(null);
  const [escaneando, setEscaneando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showScanTimeout, setShowScanTimeout] = useState(false);
  const [codigoManual, setCodigoManual] = useState('');
  const [manualError, setManualError] = useState<string | null>(null);

  // Validación formato: 3 números, guión, 3 maiúsculas
  // O input interno gárdase sen guión, pero para validar engadimos o guión
  const codigoValido = (codigo: string) => /^[0-9]{3}-[A-Z]{3}$/.test(codigo.slice(0, 3) + '-' + codigo.slice(3, 6));

  const handleManualValidate = async () => {
    setManualError(null);
    setResultado(null);
    setCodigoLido(null);
    const codigoFormatado = codigoManual.slice(0, 3) + '-' + codigoManual.slice(3, 6);
    if (!codigoValido(codigoManual)) {
      setManualError('O código debe ter o formato 365-LPF (3 números, guión, 3 maiúsculas)');
      return;
    }
    setResultado('Validando...');
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: codigoFormatado })
      });
      const data = await res.json();
      if (data.valida) {
        setResultado('✅ Entrada válida: ' + data.motivo);
      } else {
        setResultado('❌ Non válida: ' + data.motivo);
      }
    } catch (e) {
      setResultado('Erro de conexión');
    }
  };

  React.useEffect(() => {
    if (!escaneando) return;
    setShowScanTimeout(false);
    setError(null);
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: 250 },
      false
    );
    let timeoutId: any = null;
    scanner.render(
      async (decodedText: string) => {
        setEscaneando(false);
        scanner.clear();
        setShowScanTimeout(false);
        const codigo = decodedText.trim();
        setCodigoLido(codigo);
        setResultado('Validando...');
        try {
          const res = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ codigo })
          });
          const data = await res.json();
          if (data.valida) {
            setResultado('✅ Entrada válida: ' + data.motivo);
          } else {
            setResultado('❌ Non válida: ' + data.motivo);
          }
        } catch (e) {
          setResultado('Erro de conexión');
        }
      },
      (err: any) => {
        // Non mostrar erros de lectura de QR por defecto
      }
    );
    // Se non se detecta QR en 5 segundos, mostrar mensaxe amigable
    timeoutId = setTimeout(() => {
      setShowScanTimeout(true);
    }, 12000);
    return () => {
      scanner.clear().catch(() => {});
      clearTimeout(timeoutId);
    };
  }, [escaneando]);

  return (
    <>
      <MainNavbar />
      {/* Botón de Whatsapp para compartir o link (baixo da card, centrado) */}
      <div className="container py-5" style={{ maxWidth: 480 }}>
        <div
          style={{
            background: '#fff',
            borderRadius: '16px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
            padding: '32px 24px',
            margin: '0 auto',
          }}
        >
                
          <h2 style={{ fontWeight: 700, textAlign: 'center', marginBottom: 40, color: '#222' }}>Escanear entrada</h2>
          <div className="d-flex justify-content-center" style={{ marginBottom: 32 }}>
            {!escaneando && (
              <button className="reserva-entrada-btn" onClick={() => { setResultado(null); setError(null); setCodigoLido(null); setEscaneando(true); }}>
                Escanear código QR
              </button>
            )}
          </div>
          <div id="qr-reader" style={{ width: '100%', minHeight: 180, margin: '16px 0' }} />

          {/* Input manual */}
          <div style={{ margin: '24px 0 8px 0', textAlign: 'center' }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Ou introduce o código manualmente:</div>
            <div className="d-flex justify-content-center align-items-center" style={{ maxWidth: 320, margin: '0 auto' }}>
              <input
                type="text"
                value={(() => {
                  // Sempre mostra o guión no medio
                  const raw = codigoManual.replace(/[^0-9A-Z]/g, '').toUpperCase();
                  const nums = raw.slice(0, 3);
                  const lets = raw.slice(3, 6);
                  return nums + (raw.length > 3 ? '-' : '-') + lets;
                })()}
                onChange={e => {
                  let val = e.target.value.replace(/[^0-9A-Z]/gi, '').toUpperCase();
                  if (val.length > 6) val = val.slice(0, 6);
                  setCodigoManual(val);
                  setManualError(null);
                }}
                maxLength={7}
                pattern="[0-9]{3}-[A-Z]{3}"
                placeholder="365-LPF"
                className="form-control"
                style={{ borderRadius: 8, textAlign: 'center', fontWeight: 600, letterSpacing: 2, fontSize: 18, width: 130 }}
                autoComplete="off"
              />
              <span style={{ display: 'inline-block', width: 48 }} />
              <button className="reserva-entrada-btn" style={{ minWidth: 90 }} onClick={handleManualValidate}>
                Validar
              </button>
            </div>
            {manualError && <div style={{ color: '#d90429', marginTop: 6 }}>{manualError}</div>}
          </div>
          {codigoLido && (
            <div style={{ fontSize: 16, margin: '8px 0', color: '#555', textAlign: 'center' }}>
              Código lido: <b>{codigoLido}</b>
            </div>
          )}
          {resultado && (
            <div style={{ fontSize: 18, margin: '16px 0', textAlign: 'center', color: resultado.startsWith('✅') ? '#0a7d2c' : '#d90429', fontWeight: 600 }}>
              {resultado}
            </div>
          )}
          {error && (
            <div style={{ color: '#d90429', textAlign: 'center', marginTop: 8 }}>{error}</div>
          )}
          {showScanTimeout && !codigoLido && !resultado && (
            <div style={{ color: '#d90429', textAlign: 'center', marginTop: 8 }}>
              Non se detectou ningún código QR. Asegúrate de que o código está visible e ben enfocado.
            </div>
          )}
        </div>
        {/* Botón de Whatsapp debaixo da card, centrado, non flotante */}
        <div className="d-flex justify-content-center" style={{ maxWidth: 480, margin: '48px auto 0 auto' }}>
          <a
              href={`https://wa.me/?text=${encodeURIComponent('Escaner de entradas Brasinda: ' + ' ' + (window.location.href.endsWith('/') ? window.location.href : window.location.href + '/'))}`}
          target="_blank"
          rel="noopener noreferrer"
          className="boton-avance"
          style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
          <FaWhatsapp size={22} /> Compartir link de escaneo
          </a>
        </div>
      </div>
    </>
  );
};

export default EscanearEntrada;
