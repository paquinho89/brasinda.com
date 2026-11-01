import API_BASE_URL from "../../utils/api";
import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { FaExclamationTriangle } from "react-icons/fa";
import { useParams, useNavigate } from "react-router-dom";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import "../../estilos/infoPagamento.css";
import "../../estilos/Botones.css";

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
  prezo_recibe_organizador: number | null;
  prezo_venta?: number | null;
  tipo_gestion_entrada?: string;
}

const stripePublishableKey =
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ||
  (import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined) ||
  "";
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

interface InfoPagamentoProps {
  clientSecret: string;
  amountTotal: number | null;
}

const InfoPagamento_teu: React.FC<InfoPagamentoProps> = ({ amountTotal }) => {
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
  const [metodoPago, setMetodoPago] = useState("");
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

      // Confirmar as reservas temporais despois do pagamento
      const confirmarResp = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/confirmar-reservas/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reservas: pendingReservas }),
      });
      if (!confirmarResp.ok) {
        const confirmarData = await confirmarResp.json().catch(() => null);
        throw new Error(confirmarData?.error || "Erro ao confirmar as reservas despois do pago.");
      }

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

  // Verificar se volvemos dunha redirección de Stripe (Bizum)
  useEffect(() => {
    if (!stripe) return;
    const params = new URLSearchParams(window.location.search);
    const paymentIntentClientSecret = params.get("payment_intent_client_secret");
    if (!paymentIntentClientSecret) return;

    const pendingRaw = sessionStorage.getItem("brasinda_pending_payment");
    if (!pendingRaw) return;

    const pending = JSON.parse(pendingRaw);
    sessionStorage.removeItem("brasinda_pending_payment");

    // Limpar params da URL sen recargar
    window.history.replaceState({}, "", window.location.pathname);

    setLoading(true);
    stripe.retrievePaymentIntent(paymentIntentClientSecret).then(async ({ paymentIntent }) => {
      if (paymentIntent?.status === "succeeded") {
        try {
          const verif = await fetch(`${API_BASE_URL}/crear-eventos/stripe/payment-intent-status/${paymentIntent.id}/`);
          if (!verif.ok) {
            setError("Erro ao verificar o pago co servidor ("+verif.status+")");
            setLoading(false);
            return;
          }
          const verifData = await verif.json();
          if (!verifData.paid || verifData.status !== "succeeded") {
            setError("O pago non foi confirmado polo servidor. Estado: " + (verifData.status || "descoñecido"));
            setLoading(false);
            return;
          }
          finalizarReservaDespuesPago(pending);
        } catch {
          setError("Erro ao verificar o pago co servidor");
          setLoading(false);
        }
      } else {
        setError("O pago non se completou. Estado: " + (paymentIntent?.status || "descoñecido"));
        setLoading(false);
      }
    });
  }, [stripe]);

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
        if (data.prezo_venta !== null && data.prezo_venta !== undefined && data.prezo_venta !== '') {
          data.prezo_venta = parseFloat(data.prezo_venta);
        } else {
          data.prezo_venta = null;
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
        const pvp = Number(zonaActual.prezo_venta ?? zonaActual.prezo);
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

  // Os erros de pago desaparecen automaticamente aos 10 segundos.
  // Só cando o evento está cargado: o erro de carga do evento (sen evento)
  // é unha pantalla completa e non debe limparse.
  useEffect(() => {
    if (!error || !evento) return;
    const timer = setTimeout(() => setError(""), 10000);
    return () => clearTimeout(timer);
  }, [error, evento]);

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
    } else if (state?.usr?.nome_xeral) {
      // Fluxo sen plano: o nome chega como nome_xeral
      setNome(state.usr.nome_xeral);
    } else if (Array.isArray(state?.usr?.nomes) && state.usr.nomes.length > 0) {
      setNome(state.usr.nomes[0]);
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

    try {
      const pendingData = {
        seats: entradasSeleccionadas,
        reservas: navigationState.reservas || [],
        nome,
        email,
        eventoId,
        zona,
      };

      // Gardar antes de redirixir (necesario para Bizum/Multibanco que sempre redirixen)
      sessionStorage.setItem("brasinda_pending_payment", JSON.stringify(pendingData));

      // O PaymentElement recolle name e phone cando o método o require (Multibanco/Bizum)
      // grazas a fields.billingDetails="auto". Aquí só pasamos os campos marcados como
      // "never" (email e address), que Stripe esixe pasar manualmente.
      const billingDetails: Record<string, unknown> = {
        email,
        address: { country: "ES" },
      };

      const confirmResult = await stripe.confirmPayment({
        elements,
        confirmParams: {
          receipt_email: email,
          return_url: `${window.location.href}`,
          payment_method_data: {
            billing_details: billingDetails,
          },
        },
        redirect: "if_required",
      });

      if (confirmResult.error) {
        sessionStorage.removeItem("brasinda_pending_payment");
        setError(confirmResult.error.message || "Non se puido completar o pago");
        return;
      }

      const paymentIntent = confirmResult.paymentIntent;
      const paymentIntentId = paymentIntent?.id;
      if (!paymentIntentId) {
        sessionStorage.removeItem("brasinda_pending_payment");
        setError("Non se puido verificar o pago");
        return;
      }

      // Multibanco: o pago queda pendente ata que o comprador paga a referencia
      // no caixeiro/online. Non hai que confirmar reserva nin enviar entradas aínda.
      if (paymentIntent?.status === "requires_action" || paymentIntent?.status === "processing") {
        sessionStorage.removeItem("brasinda_pending_payment");
        // Datos do voucher Multibanco (entidade, referencia, importe) para mostrar ao comprador
        const mbDetails = (paymentIntent?.next_action as {
          multibanco_display_details?: {
            entity?: string;
            reference?: string;
            amount?: number;
            hosted_voucher_url?: string;
          };
        } | null | undefined)?.multibanco_display_details;
        navigate("/reserva-pendente", {
          state: {
            email,
            eventoId,
            metodo: metodoPago,
            multibanco: mbDetails
              ? {
                  entidade: mbDetails.entity || "",
                  referencia: mbDetails.reference || "",
                  importe: typeof mbDetails.amount === "number" ? (mbDetails.amount / 100).toFixed(2) : "",
                  voucherUrl: mbDetails.hosted_voucher_url || "",
                }
              : null,
          },
        });
        return;
      }

      // Se chegamos aquí, o pago completouse sen redirección (pago con tarxeta)
      sessionStorage.removeItem("brasinda_pending_payment");

      // Verificar no backend que o pago é realmente succeeded
      const verif = await fetch(`${API_BASE_URL}/crear-eventos/stripe/payment-intent-status/${paymentIntentId}/`);
      if (!verif.ok) {
        setError("Erro ao verificar o pago co servidor ("+verif.status+")");
        return;
      }
      const verifData = await verif.json();
      if (!verifData.paid || verifData.status !== "succeeded") {
        setError("O pago non foi confirmado. Estado: " + (verifData.status || "descoñecido"));
        return;
      }

      await finalizarReservaDespuesPago(pendingData);
    } catch (err) {
      console.error("Error:", err);
      setError("Erro de conexión: " + (err instanceof Error ? err.message : "descoñecido"));
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
  const prezoPvpUnitario = prezoZonaPvp ?? evento?.prezo_venta ?? prezoEventoState ?? evento?.prezo_recibe_organizador ?? null;
  let total = null as number | null;
  const cantidadeEntradasParaTotal = entradasSeleccionadas.length > 0
    ? entradasSeleccionadas.length
    : Array.isArray(navigationState.reservas) && navigationState.reservas.length > 0
      ? navigationState.reservas.length
      : Number(cantidadeState || 0);
  if (typeof prezoPvpUnitario === 'number' && !isNaN(prezoPvpUnitario) && cantidadeEntradasParaTotal > 0) {
    total = prezoPvpUnitario * cantidadeEntradasParaTotal;
  } else {
    total = amountTotal ?? importeTotalState;
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
            <div style={{ textAlign: 'center' }}>
              <h2 style={{ marginBottom: 0 }}>{evento?.nome_evento || "Tarxeta de PAgo"}</h2>
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
              <h3>Método de Pago</h3>
              <div className="form-group">
                <div className="stripe-card-element-wrapper" style={{ padding: 0 }}>
                  <div style={{ padding: "12px 14px" }}>
                    <PaymentElement
                      options={{
                        // "auto": Stripe mostra o campo dentro do elemento só cando o
                        // método de pago o require (Multibanco/Bizum: nome e teléfono).
                        // "never": non o recolle Stripe; pásase manualmente en confirmParams.
                        fields: {
                          billingDetails: {
                            name: "auto",
                            email: "never",
                            phone: "auto",
                            address: "never",
                          },
                        },
                        terms: { card: "never" },
                      }}
                      onChange={(e) => {
                        const tipo = e.value?.type || "";
                        console.log("Método de pago seleccionado:", tipo);
                        setMetodoPago(tipo);
                      }}
                    />
                  </div>
                </div>
              </div>
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
      <Modal show={showTimeoutModal} onHide={() => { setShowTimeoutModal(false); navigate("/"); }} centered>
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
          <button className="reserva-entrada-btn" onClick={() => { setShowTimeoutModal(false); navigate("/"); }}>
            Entendido
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

const InfoPagamentoWrapper: React.FC = () => {
  const { eventoId, zona } = useParams<{ eventoId: string; zona: string }>();
  const navigationState = window.history.state?.usr || {};
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [amountTotal, setAmountTotal] = useState<number | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [errorIntent, setErrorIntent] = useState("");

  useEffect(() => {
    if (!stripePromise || !eventoId) { setLoadingIntent(false); return; }

    const seats = navigationState.seats || [];
    const reservas = navigationState.reservas || [];
    const cantidade = Number(navigationState.cantidade || 0);
    let entradas: any[] = [];
    if (seats.length > 0) entradas = seats;
    else if (reservas.length > 0) entradas = reservas.map((id: number) => ({ id }));
    else if (cantidade > 0) entradas = Array.from({ length: cantidade }, (_, i) => ({ idx: i }));

    // Se non hai entradas no state, mirar se vén un ?reserva=ID na URL
    // (p.e. desde o email de recordatorio de compra)
    if (entradas.length === 0) {
      const params = new URLSearchParams(window.location.search);
      const reservaId = params.get("reserva");
      if (reservaId) {
        entradas = [{ id: Number(reservaId) }];
      }
    }

    if (entradas.length === 0) { setLoadingIntent(false); return; }

    fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/stripe/payment-intent/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ zona, entradas }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.client_secret) {
          setClientSecret(data.client_secret);
          setAmountTotal(data.amount_total ?? null);
        } else {
          setErrorIntent(data.error || "Erro ao iniciar o pago");
        }
      })
      .catch(() => setErrorIntent("Erro de conexión ao iniciar o pago"))
      .finally(() => setLoadingIntent(false));
  }, [eventoId, zona]);

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

  if (loadingIntent) {
    return (
      <div className="info-pagamento-page verde">
        <div className="info-pagamento-container">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h2>Iniciando pago...</h2>
          </div>
        </div>
      </div>
    );
  }

  if (errorIntent || !clientSecret) {
    return (
      <div className="info-pagamento-page verde">
        <div className="info-pagamento-container">
          <div style={{ textAlign: "center", padding: "40px" }}>
            <h2>Erro</h2>
            <p>{errorIntent || "Non se puido iniciar o proceso de pago"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, locale: "es" }}>
      <InfoPagamento_teu clientSecret={clientSecret} amountTotal={amountTotal} />
    </Elements>
  );
};

export default InfoPagamentoWrapper;
