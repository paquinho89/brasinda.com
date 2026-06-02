import API_BASE_URL from "../../utils/api";
import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { FaExclamationTriangle, FaArrowLeft } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { Elements, CardElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "../../estilos/infoPagamento.css";
import "../../estilos/Botones.css";

import "../../estilos/infoPagamento.css";
// import SummaryBox from "./SummaryBox";

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
  prezo_evento: number | null;
  prezo_pvp?: number | null;
  tipo_gestion_entrada?: string;
}

const stripePublishableKey =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_STRIPEPUBLISHABLE_KEY as string | undefined) ||
  "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const cardElementOptions = {
  style: {
    base: {
      fontSize: "16px",
      color: "#212529",
      fontFamily: "Arial, sans-serif",
      "::placeholder": {
        color: "#999",
      },
    },
    invalid: {
      color: "#d9534f",
    },
  },
};

const InfoPagamento_teu: React.FC = () => {
  const { eventoId, zona } = useParams<{ eventoId: string; zona: string }>();
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  // Recoller o importeTotal e prezoEvento do state se veñen do paso anterior
  const navigationState = window.history.state?.usr || {};
  // const { token } = useAuth();

  const [evento, setEvento] = useState<Evento | null>(null);
  const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<SelectedSeat[]>([]);
  // Importe total recibido do paso anterior (se existe)
  const [importeTotalState, setImporteTotalState] = useState<number | null>(navigationState.importeTotal ?? null);
  const [prezoEventoState, setPrezoEventoState] = useState<number | null>(navigationState.prezoEvento ?? null);
  const [cantidadeState, setCantidadeState] = useState<number | null>(navigationState.cantidade ?? null);
  const [prezoZonaPvp, setPrezoZonaPvp] = useState<number | null>(null);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [suscribirseEventos, setSuscribirseEventos] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(10 * 60);
  const [showTimeoutModal, setShowTimeoutModal] = useState(false);
  const [loadingEvento, setLoadingEvento] = useState(true);

  // const authToken = token ?? localStorage.getItem("access_token");

  const finalizarReservaDespuesPago = async (pendingData: any) => {
    const pendingSeats = Array.isArray(pendingData?.seats) ? pendingData.seats : [];
    const pendingReservas = Array.isArray(pendingData?.reservas) ? pendingData.reservas : [];
    const pendingNome = pendingData?.nome || nome;
    const pendingEmail = pendingData?.email || email;

    if ((zona || "").toLowerCase() === "senplano" && pendingReservas.length > 0) {
      const seatsToSend = pendingReservas
        .filter((id: unknown) => typeof id === "number")
        .map((id: number) => ({ id }));

      await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/enviar-entradas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zona: zona,
          entradas: seatsToSend,
          email: pendingEmail,
        }),
      });

      navigate("/reserva-exitosa", { state: { reservas: pendingReservas, email: pendingEmail } });
      return;
    }

    const response = await fetch(
      `${API_BASE_URL}/crear-eventos/${eventoId}/reservar/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zona: zona,
          entradas: pendingSeats,
          email: pendingEmail,
          nome: pendingNome,
          duracion_reserva: 10,
          confirmada: true,
        }),
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || "Erro ao reservar entradas");
    }

    let seatsToSend: any[] = [];
    if (Array.isArray(data.reservas) && data.reservas.length > 0) {
      seatsToSend = data.reservas
        .filter((r: any) => r && typeof r.id === "number")
        .map((r: any) => ({ id: r.id }));
    } else if (Array.isArray(pendingReservas) && pendingReservas.length > 0) {
      seatsToSend = pendingReservas
        .filter((id: unknown) => typeof id === "number")
        .map((id: number) => ({ id }));
    }

    try {
      await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/enviar-entradas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zona: zona,
          entradas: seatsToSend,
          email: pendingEmail,
        }),
      });
    } catch {
      // Non bloqueamos a finalización se falla o email.
    }

    let reservasIds = [];
    if (Array.isArray(data.reservas)) {
      reservasIds = data.reservas.map((r: { id?: number }) => r.id).filter(Boolean);
    }
    const ticketId = data.ticket_id || data.id || data.ticketId;
    if (reservasIds.length > 0) {
      navigate("/reserva-exitosa", { state: { reservas: reservasIds, email: pendingEmail } });
    } else {
      navigate("/reserva-exitosa", { state: { ticketId, email: pendingEmail } });
    }
  };

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
        
        // Converter prezos a número se existen e son válidos
        if (data.prezo_evento !== null && data.prezo_evento !== undefined && data.prezo_evento !== '') {
          data.prezo_evento = parseFloat(data.prezo_evento);
        } else {
          data.prezo_evento = null;
        }
        if (data.prezo_pvp !== null && data.prezo_pvp !== undefined && data.prezo_pvp !== '') {
          data.prezo_pvp = parseFloat(data.prezo_pvp);
        } else {
          data.prezo_pvp = null;
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

  useEffect(() => {
    const cargarPrezoZona = async () => {
      if (!eventoId || !zona || zona.toLowerCase() === "senplano") {
        setPrezoZonaPvp(null);
        return;
      }
      try {
        const resp = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/zonas-prezo/`);
        if (!resp.ok) return;
        const zonas = await resp.json();
        if (!Array.isArray(zonas)) return;
        const zonaActual = zonas.find(
          (z: any) => typeof z?.nome === "string" && z.nome.toLowerCase() === zona.toLowerCase()
        );
        if (!zonaActual) return;
        const pvp = Number(zonaActual.prezo_pvp ?? zonaActual.prezo);
        if (!isNaN(pvp)) {
          setPrezoZonaPvp(pvp);
        }
      } catch {
        // Se falla, usamos o prezo PVP xeral do evento.
      }
    };

    cargarPrezoZona();
  }, [eventoId, zona]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining <= 0) {
      setShowTimeoutModal(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeRemaining]);

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
    if (state?.usr?.cantidade !== undefined) {
      setCantidadeState(state.usr.cantidade);
    }
  }, []);

  const obterEntradasParaPago = () => {
    if (entradasSeleccionadas.length > 0) {
      return entradasSeleccionadas;
    }

    if (Array.isArray(navigationState.reservas) && navigationState.reservas.length > 0) {
      return navigationState.reservas.map((id: number) => ({ id }));
    }

    const cantidadeFallback = Number(cantidadeState || 0);
    if (cantidadeFallback > 0) {
      return Array.from({ length: cantidadeFallback }, (_, idx) => ({ idx }));
    }

    return [];
  };

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

    if (!nome) {
      setError("O nome é obrigatorio");
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Email non válido");
      setLoading(false);
      return;
    }

    if (!stripe || !elements) {
      setError("Stripe aínda non está listo. Proba de novo en uns segundos.");
      setLoading(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      setError("Non se puido cargar o formulario da tarxeta.");
      setLoading(false);
      return;
    }

    try {
      const entradasParaPago = obterEntradasParaPago();
      if (entradasParaPago.length === 0) {
        setError("Non hai entradas para procesar o pago.");
        return;
      }

      const pendingData = {
        seats: entradasSeleccionadas,
        reservas: navigationState.reservas || [],
        nome,
        email,
        eventoId,
        zona,
      };

      const response = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/stripe/payment-intent/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          zona,
          entradas: entradasParaPago,
          email,
          nome,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "Erro ao iniciar o pago con Stripe Elements");
        return;
      }

      if (!data.client_secret) {
        setError("Stripe non devolveu un client_secret válido");
        return;
      }

      const confirmResult = await stripe.confirmCardPayment(data.client_secret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: nome,
            email,
          },
        },
      });

      if (confirmResult.error) {
        setError(confirmResult.error.message || "Non se puido completar o pago");
        return;
      }

      if (confirmResult.paymentIntent?.status !== "succeeded") {
        setError("O pago non se completou correctamente");
        return;
      }

      await finalizarReservaDespuesPago(pendingData);
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
  const prezoPvpUnitario = prezoZonaPvp ?? evento?.prezo_pvp ?? prezoEventoState ?? evento?.prezo_evento ?? null;
  let total = null as number | null;
  const cantidadeEntradasParaTotal = entradasSeleccionadas.length > 0
    ? entradasSeleccionadas.length
    : Array.isArray(navigationState.reservas) && navigationState.reservas.length > 0
      ? navigationState.reservas.length
      : Number(cantidadeState || 0);
  if (typeof prezoPvpUnitario === 'number' && !isNaN(prezoPvpUnitario) && cantidadeEntradasParaTotal > 0) {
    total = prezoPvpUnitario * cantidadeEntradasParaTotal;
  } else {
    total = importeTotalState;
  }
  if (typeof total === 'number' && !isNaN(total)) {
    if (Number.isInteger(total)) {
      importeTotal = total.toLocaleString('gl-ES', { maximumFractionDigits: 0 });
    } else {
      importeTotal = total.toLocaleString('gl-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
  }

  return (
    <>
      <div className="info-pagamento-page verde">
        {/* HEADER */}
        <div className="info-pagamento-header">
          <div className="header-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="boton-avance"
              style={{ position: 'absolute', left: 0, top: 0 }}
            >
              <FaArrowLeft className="me-2" />
              Volver
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
            {/* INFORMACIÓN DE PAGO */}
            <div className="form-section">
              <h3>Información de Pago</h3>
              <div className="form-group">
                <label htmlFor="nome">Nome Titular Tarxeta</label>
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
                <label>Tarxeta</label>
                <div className="stripe-card-element-wrapper">
                  <CardElement options={cardElementOptions} />
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
      <Modal show={showTimeoutModal} onHide={() => { setShowTimeoutModal(false); navigate(-1); }} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExclamationTriangle style={{ fontSize: 22, color: "#ff0093", marginRight: 8, marginBottom: 3 }} />
            Tempo de pago esgotado
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ background: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span>O tempo para facer o pago expirou. Por favor, volve a comezar o proceso.</span>
          </div>
        </Modal.Body>
        <Modal.Footer style={{ background: "#fff" }}>
          <button className="reserva-entrada-btn" onClick={() => { setShowTimeoutModal(false); navigate(-1); }}>
            Entendido
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const InfoPagamentoWrapper: React.FC = () => {
  if (!stripePromise) {
    return (
      <div className="info-pagamento-page verde">
        <div className="info-pagamento-container">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h2>Stripe non configurado</h2>
            <p>Configura a variable VITE_STRIPE_PUBLISHABLE_KEY no frontend.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise}>
      <InfoPagamento_teu />
    </Elements>
  );
};

export default InfoPagamentoWrapper;
