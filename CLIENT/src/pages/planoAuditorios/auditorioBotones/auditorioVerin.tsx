import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../../../estilos/BotonesAuditorios.css";
import "../../../estilos/infoPagamento.css";
import AuditorioVerinAnfiteatro, { AUDITORIO as AUDITORIO_VERIN_ANFITEATRO } from "../Planos/auditorioVerin/anfiteatro";
import AuditorioVerinZonaCentral, { AUDITORIO as AUDITORIO_VERIN_CENTRAL } from "../Planos/auditorioVerin/zonaCentral";
import AuditorioVerinLateralDereita, { AUDITORIO as AUDITORIO_VERIN_DEREITA } from "../Planos/auditorioVerin/zonaLateralDereita";
import AuditorioVerinLateralEsquerda, { AUDITORIO as AUDITORIO_VERIN_ESQUERDA } from "../Planos/auditorioVerin/zonaLateralEsquerda";
import { FaTrash, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { useAuth } from "../../AuthContext";

const API_BASE_URL = "http://localhost:8000";

type Zona = "anfiteatro" | "esquerda" | "central" | "dereita";
type Variant = "rosa" | "verde";

const countSeats = (layout: (number | null)[][]) =>
  layout.flat().filter((seat) => seat !== null).length;

const AFORO_ZONA_VERIN: Record<Zona, number> = {
  anfiteatro: countSeats(AUDITORIO_VERIN_ANFITEATRO),
  esquerda: countSeats(AUDITORIO_VERIN_ESQUERDA),
  central: countSeats(AUDITORIO_VERIN_CENTRAL),
  dereita: countSeats(AUDITORIO_VERIN_DEREITA),
};

interface SelectedSeat {
  row: number;
  seat: number;
}

interface Props {
  eventoId: number;
  onZonaClick?: (zona: Zona) => void;
  variant?: Variant;
  onEntradasUpdate?: () => void;
  onAforoHabilitadoChange?: (value: number) => void;
}

const AuditorioSelectorVerin: React.FC<Props> = ({
  eventoId,
  onZonaClick,
  variant = "rosa",
  onEntradasUpdate,
  onAforoHabilitadoChange,
}) => {
  const navigate = useNavigate();
  const [areaActiva, setAreaActiva] = useState<Record<Zona, boolean>>({
    anfiteatro: true,
    esquerda: true,
    central: true,
    dereita: true,
  });
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);
  const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<SelectedSeat[]>([]);
  const [entradasReservadas, setEntradasReservadas] = useState<SelectedSeat[]>([]);
  const [misReservas, setMisReservas] = useState<SelectedSeat[]>([]);
  const [entradasDisponibles, setEntradasDisponibles] = useState<number>(0);

  const { token } = useAuth();
  const authToken = token ?? localStorage.getItem("access_token");

  useEffect(() => {
    if (eventoId == null) return;
    const fetchEntradas = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        const data = await response.json();
        setEntradasDisponibles(data.entradas_venta - data.entradas_reservadas);
      } catch (err) {
        console.error("Erro ao obter entradas dispoñibles:", err);
      }
    };
    fetchEntradas();
  }, [eventoId, token]);

  useEffect(() => {
    if (eventoId == null || !zonaSeleccionada) return;
    const fetchReservas = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/crear-eventos/${eventoId}/reservas/?zona=${zonaSeleccionada}`
        );
        const data = await response.json();
        setEntradasReservadas(data.reservas || []);
      } catch (err) {
        console.error("Erro ao obter reservas:", err);
      }
    };
    const fetchMisReservas = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/crear-eventos/${eventoId}/mis-reservas/?zona=${zonaSeleccionada}`,
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          }
        );
        const data = await response.json();
        setMisReservas(data.mis_reservas || []);
      } catch (err) {
        console.error("Erro ao obter miñas reservas:", err);
      }
    };
    fetchReservas();
    fetchMisReservas();
  }, [eventoId, zonaSeleccionada, authToken]);

  useEffect(() => {
    if (!onAforoHabilitadoChange) return;
    const habilitado =
      (areaActiva.anfiteatro ? AFORO_ZONA_VERIN.anfiteatro : 0) +
      (areaActiva.esquerda ? AFORO_ZONA_VERIN.esquerda : 0) +
      (areaActiva.central ? AFORO_ZONA_VERIN.central : 0) +
      (areaActiva.dereita ? AFORO_ZONA_VERIN.dereita : 0);
    onAforoHabilitadoChange(habilitado);
  }, [areaActiva, onAforoHabilitadoChange]);

  const handleClick = (zona: Zona) => {
    setZonaSeleccionada(zona);
    setEntradasSeleccionadas([]);
    setEntradasReservadas([]);
    setMisReservas([]);
    onZonaClick?.(zona);
  };

  const cerrarModal = () => {
    setZonaSeleccionada(null);
    setEntradasSeleccionadas([]);
  };

  const getNextZona = (direction: "left" | "right"): Zona | null => {
    if (!zonaSeleccionada) return null;

    // Orde circular: central => dereita => anfiteatro => esquerda => central
    const zonaOrder: Zona[] = ["central", "dereita", "anfiteatro", "esquerda"];
    const currentIndex = zonaOrder.indexOf(zonaSeleccionada);

    if (currentIndex === -1) return null;

    let nextIndex: number;
    if (direction === "right") {
      nextIndex = (currentIndex + 1) % zonaOrder.length;
    } else {
      nextIndex = (currentIndex - 1 + zonaOrder.length) % zonaOrder.length;
    }

    return zonaOrder[nextIndex];
  };

  const handleZoneNavigation = (direction: "left" | "right") => {
    const nextZona = getNextZona(direction);
    if (nextZona) {
      handleClick(nextZona);
    }
  };

  const eliminarMiReserva = async (seat: SelectedSeat) => {
    if (eventoId == null || !zonaSeleccionada) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/crear-eventos/${eventoId}/eliminar-reserva/${zonaSeleccionada}/${seat.row}/${seat.seat}/`,
        {
          method: "DELETE",
          headers: {
            "Authorization": authToken ? `Bearer ${authToken}` : "",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setMisReservas((prev) =>
          prev.filter(s => !(s.row === seat.row && s.seat === seat.seat))
        );
        setEntradasReservadas((prev) =>
          prev.filter(s => !(s.row === seat.row && s.seat === seat.seat))
        );
        setEntradasDisponibles(data.entradas_dispoñibles);
        onEntradasUpdate?.();
      } else {
        alert("Erro ao eliminar a reserva");
      }
    } catch (err) {
      console.error("Erro ao eliminar reserva:", err);
      alert("Erro de conexión");
    }
  };

  const renderEsquema = () => {
    const currentAreaActiva = zonaSeleccionada ? areaActiva[zonaSeleccionada] : true;
    if (!currentAreaActiva) {
      return null;
    }
    const props = {
      selectedSeats: entradasSeleccionadas,
      reservedSeats: entradasReservadas,
      myReservedSeats: misReservas,
      onSelectionChange: setEntradasSeleccionadas,
      onMyReservedSeatClick: eliminarMiReserva,
      areaActiva: currentAreaActiva,
    };
    switch (zonaSeleccionada) {
      case "anfiteatro": return <AuditorioVerinAnfiteatro {...props} />;
      case "central": return <AuditorioVerinZonaCentral {...props} />;
      case "esquerda": return <AuditorioVerinLateralEsquerda {...props} />;
      case "dereita": return <AuditorioVerinLateralDereita {...props} />;
      default: return null;
    }
  };

  const eliminarEntrada = (seat: SelectedSeat) => {
    setEntradasSeleccionadas(prev =>
      prev.filter(s => !(s.row === seat.row && s.seat === seat.seat))
    );
  };

  const handleAreaToggle = (checked: boolean) => {
    if (!zonaSeleccionada) return;
    if (!checked && (misReservas.length > 0 || entradasSeleccionadas.length > 0)) {
      alert("Para desactivar a área non pode existir ningunha entrada reservada ou clicada");
      return;
    }
    setAreaActiva((prev) => ({
      ...prev,
      [zonaSeleccionada]: checked,
    }));
  };

  const handleMostrarFormPago = () => {
    if (entradasSeleccionadas.length === 0 || !zonaSeleccionada) {
      return;
    }
    // Navigate to payment page and pass selected seats via state
    navigate(`/pago/${eventoId}/${zonaSeleccionada}`, {
      state: { seats: entradasSeleccionadas },
    });
  };

  const currentAreaActiva = zonaSeleccionada ? areaActiva[zonaSeleccionada] : true;

  return (
    <div className={`auditorio-container ${variant}`}>
      {/* BOTONES DE ZONA */}
      <button
        className={`zona anfiteatro ${areaActiva.anfiteatro ? "" : "zona-inactiva"}`}
        onClick={() => handleClick("anfiteatro")}
      >
        <div>ANFITEATRO</div>
        {variant === "rosa" && (
          <div className="zona-estado-interno">{areaActiva.anfiteatro ? "(Activa)" : "(Inactiva)"}</div>
        )}
      </button>
      <div className="platea">
        <button
          className={`zona esquerda ${areaActiva.esquerda ? "" : "zona-inactiva"}`}
          onClick={() => handleClick("esquerda")}
        >
          <div>ESQUERDA</div>
          {variant === "rosa" && (
            <div className="zona-estado-interno">{areaActiva.esquerda ? "(Activa)" : "(Inactiva)"}</div>
          )}
        </button>
        <div className="zona-central-wrapper">
          <button
            className={`zona central ${areaActiva.central ? "" : "zona-inactiva"}`}
            onClick={() => handleClick("central")}
          >
            <div>CENTRAL</div>
            {variant === "rosa" && (
              <div className="zona-estado-interno">{areaActiva.central ? "(Activa)" : "(Inactiva)"}</div>
            )}
          </button>
          <div className="indicador-escenario">ESCENARIO</div>
        </div>
        <button
          className={`zona dereita ${areaActiva.dereita ? "" : "zona-inactiva"}`}
          onClick={() => handleClick("dereita")}
        >
          <div>DEREITA</div>
          {variant === "rosa" && (
            <div className="zona-estado-interno">{areaActiva.dereita ? "(Activa)" : "(Inactiva)"}</div>
          )}
        </button>
      </div>

      {/* MODAL */}
      {zonaSeleccionada && (
        <div className="modal-backdrop">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* HEADER */}
            <div className="modal-header-custom">
              <div className="modal-title-group">
                <div className="modal-title-nav">
                  <button
                    type="button"
                    className="zona-nav-btn"
                    onClick={() => handleZoneNavigation("left")}
                    aria-label="Ir á zona anterior"
                  >
                    <FaChevronLeft />
                  </button>
                  <h4 className="modal-title">{zonaSeleccionada.toUpperCase()}</h4>
                  <button
                    type="button"
                    className="zona-nav-btn"
                    onClick={() => handleZoneNavigation("right")}
                    aria-label="Ir á zona seguinte"
                  >
                    <FaChevronRight />
                  </button>
                </div>
                {variant === "rosa" && (
                  <p className="modal-subtitle">*As entradas que reserves, non se porán a venda</p>
                )}
              </div>
              <button className="close-x" onClick={cerrarModal}>✕</button>
            </div>

            {/* SWITCH AREA - Debaixo do texto e centrado (só para variant rosa) */}
            {variant === "rosa" && (
              <>
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: "8px" }}>
                  <button
                    type="button"
                    className={`badge-prezo badge-prezo--clickable ${currentAreaActiva ? "badge-prezo--active" : "badge-prezo--inactive"}`}
                    onClick={() => handleAreaToggle(!currentAreaActiva)}
                  >
                    {currentAreaActiva ? "Zona Activa" : "Zona Inactiva"}
                  </button>
                </div>
                <div style={{ display: "flex", justifyContent: "center", paddingBottom: "15px" }}>
                  <label className="toggle-area-label mt-2">
                    <input type="checkbox" checked={currentAreaActiva} onChange={e => handleAreaToggle(e.target.checked)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </>
            )}
            

            {/* BODY */}
            <div className="modal-body-custom">
              {renderEsquema()}

              {/* BOTONES */}
              <div style={{ marginTop: 20, marginBottom: 20, display: "flex", gap: "10px", justifyContent: "space-between" }}>
                <button className={variant === "verde" ? "volver-verde-btn" : "volver-btn"} onClick={cerrarModal}>
                  Cerrar
                </button>
                <button
                  className="reserva-entrada-btn"
                  onClick={handleMostrarFormPago}
                  disabled={entradasSeleccionadas.length === 0}
                >
                  {variant === "rosa"
                    ? "Gardar Cambios"
                    : `Reservar ${entradasSeleccionadas.length} entradas`}
                </button>
              </div>

              {/* LISTADO DE ENTRADAS (SELECCIONADAS + MIÑAS RESERVAS) */}
              {(entradasSeleccionadas.length > 0 || misReservas.length > 0) && (
                <div style={{ marginTop: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <th style={{ padding: "8px", fontWeight: 700 }}>Fila</th>
                        <th style={{ padding: "8px", fontWeight: 700 }}>Butaca</th>
                        <th style={{ padding: "8px", fontWeight: 700 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {misReservas.map(s => (
                        <tr key={`${s.row}-${s.seat}-reservada`} style={{ backgroundColor: "#fff" }}>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.row}</td>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.seat}</td>
                          <td style={{ padding: "8px" }}>
                            <button className="eliminar-btn" onClick={e => { e.stopPropagation(); eliminarMiReserva(s); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "black", fontSize: "16px" }}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {entradasSeleccionadas.map(s => (
                        <tr key={`${s.row}-${s.seat}`} style={{ backgroundColor: "#fff" }}>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.row}</td>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.seat}</td>
                          <td style={{ padding: "8px" }}>
                            <button className="eliminar-btn" onClick={e => { e.stopPropagation(); eliminarEntrada(s); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "black", fontSize: "16px" }}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default AuditorioSelectorVerin;