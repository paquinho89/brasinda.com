import API_BASE_URL from "../../utils/api";
import React, { useState, useEffect } from "react";
import { FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import "../../estilos/infoPagamento.css";

import "../../estilos/infoPagamento.css";
import SummaryBox from "./SummaryBox";

interface SelectedSeat {
  row: number;
  seat: number;
}

interface Evento {
  id: number;
  nome_evento: string;
  data_evento: string;
  entradas_venta: number;
  entradas_reservadas: number;
  prezo_evento: number;
  tipo_gestion_entrada?: string;
}

const InfoPagamento: React.FC = () => {
  const { eventoId, zona } = useParams<{ eventoId: string; zona: string }>();
  const navigate = useNavigate();
  // Recoller o importeTotal e prezoEvento do state se veñen do paso anterior
  const navigationState = window.history.state?.usr || {};
  // const { token } = useAuth();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<SelectedSeat[]>([]);
  // Importe total recibido do paso anterior (se existe)
  const [importeTotalState, setImporteTotalState] = useState<number | null>(navigationState.importeTotal ?? null);
  const [prezoEventoState, setPrezoEventoState] = useState<number | null>(navigationState.prezoEvento ?? null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [tarxeta, setTarxeta] = useState("");
  const [cvc, setCvc] = useState("");
  const [fechaCaducidad, setFechaCaducidad] = useState("");
  const [suscribirseEventos, setSuscribirseEventos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(10 * 60);
  const [loadingEvento, setLoadingEvento] = useState(true);

  // const authToken = token ?? localStorage.getItem("access_token");

  // Fetch evento data
  useEffect(() => {
    if (!eventoId) {
      console.log("No eventoId found");
      setLoadingEvento(false);
      return;
    }

    const fetchEvento = async () => {
      try {
        console.log("Fetching evento:", eventoId);
        const response = await fetch(`${API_BASE_URL}/crear-eventos/publico/${eventoId}/`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Evento loaded:", data);
        
        // Converter prezo_evento a número se existe e é válido
        if (data.prezo_evento !== null && data.prezo_evento !== undefined && data.prezo_evento !== '') {
          data.prezo_evento = parseFloat(data.prezo_evento);
        } else {
          data.prezo_evento = null;
        }
        
        setEvento(data);
      } catch (err) {
        console.error("Error fetching evento:", err);
        setError(`Erro ao cargar o evento: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoadingEvento(false);
      }
    };

    fetchEvento();
  }, [eventoId]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      alert("Se agotó el tiempo de reserva");
      navigate(-1);
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, navigate]);

  // Get seats, email, nome, importeTotal from navigation state
  useEffect(() => {
    const state = window.history.state;
    if (state?.usr?.seats) {
      setEntradasSeleccionadas(state.usr.seats);
    }
    if (state?.usr?.email) {
      setEmail(state.usr.email);
    }
    if (state?.usr?.nome) {
      setNome(state.usr.nome);
    }
    if (state?.usr?.importeTotal !== undefined) {
      setImporteTotalState(state.usr.importeTotal);
    }
    if (state?.usr?.prezoEvento !== undefined) {
      setPrezoEventoState(state.usr.prezoEvento);
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!nome || !email) {
      setError("Nome e email son obrigatorios");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email non válido");
      setLoading(false);
      return;
    }
    // Tarxeta, cvc e data de caducidade son opcionais

    try {
      // 1. Confirmar a reserva (pasar a vendida)
      const response = await fetch(
        `${API_BASE_URL}/crear-eventos/${eventoId}/reservar/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // No Authorization header for public ticket purchase
          },
          body: JSON.stringify({
            zona: zona,
            entradas: entradasSeleccionadas,
            email: email,
            nome: nome,
            duracion_reserva: 10,
            confirmada: true,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        // 2. Só enviar email se tipo_gestion_entrada é 'pagina' ou 'a través da páxina'
        if (
          evento?.tipo_gestion_entrada === "pagina" ||
          evento?.tipo_gestion_entrada === "a través da páxina"
        ) {
          // Usar sempre os IDs das reservas creadas
          let seatsToSend: any[] = [];
          if (Array.isArray(data.reservas) && data.reservas.length > 0) {
            seatsToSend = data.reservas
              .filter((r: any) => r && typeof r.id === "number")
              .map((r: any) => ({ id: r.id }));
          } else if (navigationState.reservas && Array.isArray(navigationState.reservas)) {
            seatsToSend = navigationState.reservas
              .filter((id: any) => typeof id === "number")
              .map((id: number) => ({ id }));
          } else {
            const fallbackId = data.id || data.ticket_id || data.ticketId;
            if (fallbackId) {
              seatsToSend = [{ id: fallbackId }];
            }
          }
          console.log("[DEBUG] Enviando entradas seleccionadas ao backend:", seatsToSend);
          try {
            await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/enviar-entradas/`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                zona: zona,
                entradas: seatsToSend,
                email: email,
              }),
            });
          } catch (err) {
            alert("Reserva realizada, pero non se puido enviar o email.");
          }
        }
        // alert(`Entradas reservadas! Pago completado.`);
        // Si el backend devuelve un array de reservas, pásalo para multipage PDF
        let reservasIds = [];
        if (Array.isArray(data.reservas)) {
          reservasIds = data.reservas.map((r: { id?: number }) => r.id).filter(Boolean);
        }
        // If reservasIds is still empty, try to use navigationState.reservas
        if ((!Array.isArray(reservasIds) || reservasIds.length === 0) && navigationState.reservas && Array.isArray(navigationState.reservas)) {
          reservasIds = navigationState.reservas.filter((id: any) => typeof id === 'number');
        }
        const ticketId = data.ticket_id || data.id || data.ticketId;
        if (reservasIds.length > 0) {
          navigate('/reserva-exitosa', { state: { reservas: reservasIds, email } });
        } else {
          navigate('/reserva-exitosa', { state: { ticketId, email } });
        }
      } else {
        setError(data.error || "Erro ao reservar entradas");
      }
    } catch (err) {
      console.error("Error:", err);
      setError("Erro de conexión");
    } finally {
      setLoading(false);
    }
  };

  if (loadingEvento) {
    return (
      <div className="info-pagamento-page verde">
        <div className="info-pagamento-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Cargando evento...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (error && !evento) {
    return (
      <div className="info-pagamento-page verde">
        <div className="info-pagamento-container">
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <h2>Erro</h2>
            <p>{error}</p>
            <button 
              onClick={() => navigate(-1)}
              className="volver-verde-btn"
              style={{ maxWidth: '300px', margin: '20px auto' }}
            >
              Volver
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Usar o importeTotal do state se existe, senón calcular
  let importeTotal: string | null = null;
  let prezo = prezoEventoState ?? evento?.prezo_evento;
  let total = importeTotalState;
  if (total == null && typeof prezo === 'number' && !isNaN(prezo) && entradasSeleccionadas.length > 0) {
    total = prezo * entradasSeleccionadas.length;
  }
  if (typeof total === 'number' && !isNaN(total)) {
    if (Number.isInteger(total)) {
      importeTotal = total.toLocaleString('gl-ES', { maximumFractionDigits: 0 });
    } else {
      importeTotal = total.toLocaleString('gl-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  return (
    <div className="info-pagamento-page verde">
      {/* HEADER */}
      <div className="info-pagamento-header">
        <div className="header-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
          <button
            type="button"
            className="volver-btn"
            onClick={() => navigate(-1)}
            aria-label="Volver"
            style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            <FaArrowLeft style={{ marginRight: 4 }} /> Volver
          </button>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ marginBottom: 0 }}>{evento?.nome_evento || "Información de Pago"}</h2>
            <p className="evento-fecha" style={{ marginTop: 4 }}>{evento && formatDate(evento.data_evento)}</p>
          </div>
        </div>
        <div className={`timer-container ${timeRemaining < 180 ? "warning" : ""}`}>
          <span className="timer-label">Tempo restante:</span>
          <span className="timer-value">{formatTime(timeRemaining)}</span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="info-pagamento-container">
        <form onSubmit={handleSubmit} className="info-pagamento-formulario">

          {/* ENTRADAS SELECCIONADAS - Usar componente reutilizable */}
          <SummaryBox
            entradasSeleccionadas={entradasSeleccionadas}
            prezoEvento={evento?.prezo_evento}
          />

          {/* DATOS PERSOAIS */}
          <div className="form-section">
            <h3>Datos Persoais</h3>
            <div className="form-group">
              <label htmlFor="nome">Nome</label>
              <input
                id="nome"
                type="text"
                placeholder="Introduce o teu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="Introduce o teu email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
              />
            </div>
          </div>

          {/* INFORMACIÓN DE PAGO */}
          <div className="form-section">
            <h3>Información de Pago</h3>
            {/* NÚMERO DE TARXETA */}
            <div className="form-group">
              <label htmlFor="tarxeta">Número de Tarxeta</label>
              <input
                id="tarxeta"
                type="text"
                placeholder="1234 5678 9012 3456"
                value={tarxeta}
                onChange={(e) => setTarxeta(e.target.value.replace(/\s/g, ""))}
                maxLength={19}
                disabled={loading}
              />
            </div>

            {/* CVC Y FECHA DE CADUCIDAD */}
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cvc">CVC</label>
                <input
                  id="cvc"
                  type="text"
                  placeholder="123"
                  value={cvc}
                  onChange={(e) => setCvc(e.target.value.replace(/\D/g, ""))}
                  maxLength={4}
                  disabled={loading}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="fechaCaducidad">Data de Caducidade</label>
                <input
                  id="fechaCaducidad"
                  type="text"
                  placeholder="MM/AA"
                  value={fechaCaducidad}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, "");
                    if (value.length >= 2) {
                      value = value.slice(0, 2) + "/" + value.slice(2, 4);
                    }
                    setFechaCaducidad(value);
                  }}
                  maxLength={5}
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* CHECKBOX SUSCRIPCIÓN */}
          <div className="form-check mb-3 mt-4">
							<input
								id="suscribirse-eventos"
								type="checkbox"
								className="form-check-input checkbox-verde"
								checked={suscribirseEventos}
								onChange={(e) => setSuscribirseEventos(e.target.checked)}
								disabled={loading}
								style={{ accentColor: "#ff0093" }}
							/>
							<label htmlFor="suscribirse-eventos" className="form-check-label">
								<strong>Quero estar informado dos eventos que acontecen na miña zona</strong>
							</label>
						</div>

          {/* ERROR MESSAGE */}
          {error && <div className="error-message">{error}</div>}

          {/* BUTTON */}
          <button type="submit" className="reserva-entrada-btn" style={{ width: '100%' }} disabled={loading}>
            {loading
              ? "Procesando..."
              : (importeTotal !== null && importeTotal !== undefined)
                ? `Pagar ${importeTotal}€`
                : "Pagar"}
          </button>
        </form>
      </div>

      </div>
  );
};

export default InfoPagamento;
