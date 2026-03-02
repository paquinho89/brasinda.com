import React, { useEffect, useState } from "react";
import "../../../estilos/BotonesAuditorios.css";
import AuditorioOurenseAnfiteatro, { AUDITORIO as AUDITORIO_OURENSE_ANFITEATRO } from "../Planos/auditorioOurense/anfiteatro";
import AuditorioOurenseZonaCentral, { AUDITORIO as AUDITORIO_OURENSE_CENTRAL } from "../Planos/auditorioOurense/zonaCentral";
import AuditorioOurenseDereita, { AUDITORIO as AUDITORIO_OURENSE_DEREITA } from "../Planos/auditorioOurense/dereita";
import AuditorioOurenseEsquerda, { AUDITORIO as AUDITORIO_OURENSE_ESQUERDA } from "../Planos/auditorioOurense/esquerda";

type Zona = "anfiteatro" | "esquerda" | "central" | "dereita";

interface Props {
  eventoId?: number;
  onZonaClick?: (zona: Zona) => void; // opcional
  onEntradasUpdate?: () => void;
  onAforoHabilitadoChange?: (value: number) => void;
}

const countSeats = (layout: (number | null)[][]) =>
  layout.flat().filter((seat) => seat !== null).length;

const AFORO_TOTAL_OURENSE =
  countSeats(AUDITORIO_OURENSE_ANFITEATRO) +
  countSeats(AUDITORIO_OURENSE_CENTRAL) +
  countSeats(AUDITORIO_OURENSE_ESQUERDA) +
  countSeats(AUDITORIO_OURENSE_DEREITA);

const AuditorioSelectorOurense: React.FC<Props> = ({ onZonaClick, onAforoHabilitadoChange }) => {
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);

  useEffect(() => {
    onAforoHabilitadoChange?.(AFORO_TOTAL_OURENSE);
  }, [onAforoHabilitadoChange]);

  const handleClick = (zona: Zona) => {
    setZonaSeleccionada(zona);
    if (onZonaClick) onZonaClick(zona);
  };

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

      {/* MODAL */}
      {zonaSeleccionada && (
        <div
          className="modal-backdrop"
          onClick={() => setZonaSeleccionada(null)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>

          {/* Header do modal */}
          <div className="modal-header-custom">
            <h4 className="modal-title">
              {zonaSeleccionada.toUpperCase()}
            </h4>

            <button
              className="reserva-entrada-btn"
              onClick={() => setZonaSeleccionada(null)}
            >
              Cerrar
            </button>
          </div>

          {/* Contido */}
          <div className="modal-body-custom">
            {renderEsquema()}
          </div>
          <button
            className="reserva-entrada-btn"
          >
            Reservar Entradas
          </button>

</div>
        </div>
      )}
    </div>
  );
};

export default AuditorioSelectorOurense;