import React, { useEffect, useState } from "react";
import "../../../estilos/BotonesAuditorios.css";
import AuditorioOurenseAnfiteatro, { AUDITORIO as AUDITORIO_OURENSE_ANFITEATRO } from "../Planos/auditorioOurense/anfiteatro";
import AuditorioOurenseZonaCentral, { AUDITORIO as AUDITORIO_OURENSE_CENTRAL } from "../Planos/auditorioOurense/zonaCentral";
import AuditorioOurenseDereita, { AUDITORIO as AUDITORIO_OURENSE_DEREITA } from "../Planos/auditorioOurense/ZonaLateralDereita";
import AuditorioOurenseEsquerda, { AUDITORIO as AUDITORIO_OURENSE_ESQUERDA } from "../Planos/auditorioOurense/zonaLateralEsquerda";

type Zona = "anfiteatro" | "esquerda" | "central" | "dereita";

interface Props {
  eventoId?: number;
  onZonaClick?: (zona: Zona) => void; // opcional
  onEntradasUpdate?: () => void;
  onAforoHabilitadoChange?: (value: number) => void;
  openZonaCentralSignal?: number;
}

const countSeats = (layout: (number | null)[][]) =>
  layout.flat().filter((seat) => seat !== null).length;

const AFORO_TOTAL_OURENSE =
  countSeats(AUDITORIO_OURENSE_ANFITEATRO) +
  countSeats(AUDITORIO_OURENSE_CENTRAL) +
  countSeats(AUDITORIO_OURENSE_ESQUERDA) +
  countSeats(AUDITORIO_OURENSE_DEREITA);

const AuditorioSelectorOurense: React.FC<Props> = ({ onZonaClick, onAforoHabilitadoChange, openZonaCentralSignal }) => {
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);

  useEffect(() => {
    onAforoHabilitadoChange?.(AFORO_TOTAL_OURENSE);
  }, [onAforoHabilitadoChange]);

  const handleClick = (zona: Zona) => {
    setZonaSeleccionada(zona);
    if (onZonaClick) onZonaClick(zona);
  };

  useEffect(() => {
    if (!openZonaCentralSignal) return;
    handleClick("central");
  }, [openZonaCentralSignal]);

  const renderEsquema = () => {
    if (!zonaSeleccionada) return null;
    switch (zonaSeleccionada) {
      case "anfiteatro":
        return <AuditorioOurenseAnfiteatro />;
      case "central":
        return <AuditorioOurenseZonaCentral />;
      case "esquerda":
        return <AuditorioOurenseEsquerda />;
      case "dereita":
        return <AuditorioOurenseDereita />;
      default:
        return null;
    }
  };

  return (
    <div className="auditorio-container">
      {/* BOTONES */}
      <button
        className="zona anfiteatro"
        onClick={() => handleClick("anfiteatro")}
      >
        ANFITEATRO
      </button>

      <div className="platea">
        <button className="zona esquerda" onClick={() => handleClick("esquerda")}>
          ESQUERDA
        </button>
        <button className="zona central" onClick={() => handleClick("central")}>
          CENTRAL
        </button>
        <button className="zona dereita" onClick={() => handleClick("dereita")}>
          DEREITA
        </button>
      </div>

      {/* FULL-PAGE SEAT SELECTION (NO MODAL) */}
      {zonaSeleccionada && (
        <div className="fullpage-seat-selection">
          {/* HEADER */}
          <div className="modal-header-custom" style={{ maxWidth: 700, margin: '0 auto', marginTop: 32 }}>
            <div className="modal-title-group">
              <div className="modal-title-nav">
                <button
                  type="button"
                  className="zona-nav-btn"
                  onClick={() => {
                    // Navegación entre zonas Ourense
                    const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
                    const idx = zonas.indexOf(zonaSeleccionada);
                    const prev = idx === 0 ? zonas.length - 1 : idx - 1;
                    setZonaSeleccionada(zonas[prev]);
                  }}
                  aria-label="Ir á zona anterior"
                >
                  {'<'}
                </button>
                <h4 className="modal-title">{zonaSeleccionada.toUpperCase()}</h4>
                <button
                  type="button"
                  className="zona-nav-btn"
                  onClick={() => {
                    const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
                    const idx = zonas.indexOf(zonaSeleccionada);
                    const next = (idx + 1) % zonas.length;
                    setZonaSeleccionada(zonas[next]);
                  }}
                  aria-label="Ir á zona seguinte"
                >
                  {'>'}
                </button>
              </div>
            </div>
            <button className="close-x" onClick={() => setZonaSeleccionada(null)}>✕</button>
          </div>

          {/* BODY */}
          <div className="modal-body-custom" style={{ maxWidth: 700, margin: '0 auto' }}>
            {renderEsquema()}

            {/* BOTONES */}
            <div style={{ marginTop: 20, marginBottom: 20, display: "flex", gap: "10px", justifyContent: "space-between" }}>
              <button className="volver-btn" onClick={() => setZonaSeleccionada(null)}>
                Cerrar
              </button>
              <button className="reserva-entrada-btn">
                Reservar Entradas
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorioSelectorOurense;