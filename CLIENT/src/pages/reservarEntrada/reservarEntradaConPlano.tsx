import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import AuditorioSelectorVerin from "../planoAuditorios/auditorioBotones/auditorioVerin";
import AuditorioSelectorOurense from "../planoAuditorios/auditorioBotones/auditorioOurense";
import MainNavbar from "../componentes/NavBar";
import { FaCalendarAlt, FaTicketAlt, FaArrowLeft, FaEnvelope, FaUser, FaExclamationTriangle } from "react-icons/fa";


import SummaryBox from "./SummaryBox";


interface Evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  descripcion_evento?: string;
  data_evento: string;
  localizacion: string;
  entradas_venta: number;
  entradas_reservadas?: number;
  entradas_vendidas?: number;
  prezo_evento?: number;
  procedimiento_cobro_manual?: string | null;
}

export default function ReservarEntrada() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openZonaCentralSignal] = useState(0);
  const butacasRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();
  // Inputs para email e nome
  const [email, setEmail] = useState("");
  const [nome, setNome] = useState("");

  // Entradas seleccionadas (butacas) de todas as zonas
  const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<any[]>([]);
  // Ref for SummaryBox
  const summaryBoxRef = useRef<any>(null);

  // Limpar só as seleccións de butacas do localStorage ao desmontar a páxina
  useEffect(() => {
    return () => {
      if (!id) return;
      // Buscar todas as zonas posibles (se hai máis, engadir aquí)
      const zonas = ["central", "lateral", "frontal", "trasera", "verin", "ourense"];
      zonas.forEach(zona => {
        const key = `auditorio_verin_selected_${zona}_${id}`;
        localStorage.removeItem(key);
      });
    };
  }, [id]);

  // Callback para recibir as entradas seleccionadas en tempo real
  const handleEntradasSeleccionadas = (todasEntradas: any[]) => {
    setEntradasSeleccionadas(todasEntradas);
  };

  useEffect(() => {
    if (!id) return;
    const fetchEvento = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`http://localhost:8000/crear-eventos/publico/${id}/`);
        if (!resp.ok) throw new Error("Evento non atopado");
        const data = await resp.json();
        setEvento(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Erro ao cargar evento");
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
  }, [id]);

  if (loading) return <div className="container py-4">Cargando evento…</div>;
  if (error) return <div className="container py-4 text-danger">{error}</div>;
  if (!evento) return <div className="container py-4">Evento non encontrado</div>;

  
  const formatDataCompleta = (dateString: string) => {
  const date = new Date(dateString);

  const data = new Intl.DateTimeFormat("gl-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const hora = new Intl.DateTimeFormat("gl-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  // Primeira letra en maiúscula
  const dataCapitalizada =
    data.charAt(0).toUpperCase() + data.slice(1);

    return `${dataCapitalizada} ás ${hora}`;
  };
  
  const dataFormato = formatDataCompleta(evento.data_evento);
  const prezoEvento = Number(evento.prezo_evento ?? 0);

  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lugarKey = normalizar(evento.localizacion);

  // Determinar qué auditorio mostrar (Verín o Ourense)
  const AuditorioComponente = lugarKey.includes("verin")
    ? AuditorioSelectorVerin
    : AuditorioSelectorOurense;

  return (
    <>
    <MainNavbar />
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="p-3">
            <div className="d-flex align-items-start pb-2 mb-3">
              <Button
                className="volver-btn me-3"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
              <div className="flex-grow-1 text-center">
                <h2 className="m-0 mb-2">
                  {evento.nome_evento}
                </h2>
                <p className="text-center mb-1 mt-0">
                  <FaCalendarAlt className="me-1" />
                  {dataFormato}
                </p>
                <p className="text-center mb-0 mt-0">
                  <strong>{evento.localizacion}</strong>
                </p>
              </div>
              {/* Espaciador para equilibrar o botón */}
              <div style={{ width: "100px" }}></div>
            </div>
          </div>
            <div className="card-body">
            <div
              className="venta-rosa-solo-color"
              ref={butacasRef}
              style={{
                ["--color-principal" as any]: "#ff0093",
                ["--color-fondo" as any]: "rgba(255, 0, 147, 0.05)",
              }}
            >
              <AuditorioComponente
                eventoId={evento.id}
                variant="verde"
                openZonaCentralSignal={openZonaCentralSignal}
                onZonaClick={(zona) => {
                  console.log("Zona seleccionada:", zona);
                }}
                onEntradasSeleccionadas={handleEntradasSeleccionadas}
              />
            </div>

            {/* Inputs para email e nome */}
            <div className="mt-3 mb-2">
              <div className="form-group mb-2">
                <label htmlFor="email">
                  <FaEnvelope style={{ color: '#ff0093', marginRight: 6, marginBottom: 2 }} />
                  <strong>Email</strong>
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-control"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
              <div className="form-group mb-2">
                <label htmlFor="nome">
                  <FaUser style={{ color: '#ff0093', marginRight: 6, marginBottom: 2 }} />
                  <strong>Nome</strong>
                </label>
                <input
                  id="nome"
                  type="text"
                  className="form-control"
                  placeholder="Nome e apelidos"
                  value={nome}
                  onChange={e => setNome(e.target.value)}
                />
              </div>
            </div>

            {/* Cuadro resumen de entradas seleccionadas */}
            <div className="mt-3">
              <SummaryBox
                  ref={summaryBoxRef}
                  entradasSeleccionadas={entradasSeleccionadas}
                  prezoEvento={evento.prezo_evento}
                  onEliminarButaca={(seat, idx) => {
                    setEntradasSeleccionadas(prev => prev.filter((_, i) => i !== idx));
                    if (seat.zona && evento.id) {
                      const key = `auditorio_verin_selected_${seat.zona}_${evento.id}`;
                      const raw = localStorage.getItem(key);
                      let lista = [];
                      if (raw) {
                        try { lista = JSON.parse(raw); } catch {}
                      }
                      const novaLista = Array.isArray(lista) ? lista.filter((b: any) => b.row !== seat.row || b.seat !== seat.seat) : [];
                      localStorage.setItem(key, JSON.stringify(novaLista));
                    }
                  }}
                  onNomeChange={(idx, novoNome) => {
                    setEntradasSeleccionadas(prev => {
                      const updated = prev.map((b, i) => i === idx ? { ...b, nome: novoNome } : b);
                      // Persist to localStorage for the correct zona
                      const seat = updated[idx];
                      if (seat && seat.zona && evento?.id) {
                        const key = `auditorio_verin_selected_${seat.zona}_${evento.id}`;
                        let lista = [];
                        const raw = localStorage.getItem(key);
                        if (raw) {
                          try { lista = JSON.parse(raw); } catch {}
                        }
                        // Find the seat in localStorage and update its nome
                        const updatedLista = Array.isArray(lista)
                          ? lista.map((b: any) => (b.row === seat.row && b.seat === seat.seat ? { ...b, nome: novoNome } : b))
                          : [];
                        localStorage.setItem(key, JSON.stringify(updatedLista));
                      }
                      return updated;
                    });
                  }}
                />
            </div>

            {evento.procedimiento_cobro_manual && (
              <div className="mt-3 p-3 border-left-4" style={{
                backgroundColor: "#ffe6f3", // fondo rosa claro
                borderLeftColor: "#ff0093", // rosa principal
                borderLeftWidth: "4px",
                borderRadius: "4px"
              }}>
                <strong style={{ color: "#111", fontWeight: 700, fontSize: "1.1em", display: "flex", alignItems: "center", gap: 8 }}>
                  <FaExclamationTriangle style={{ color: "#ff0093", marginRight: 6 }} />
                  Procedemento para o pago:
                </strong>
                <p className="mt-2 mb-0" style={{ color: "#333" }}>
                  {evento.procedimiento_cobro_manual}
                </p>
              </div>
            )}
            {evento.prezo_evento != null && (
              <>
                <Button
                  className="reserva-entrada-btn mt-3"
                  onClick={async () => {
                    // 1. Se SummaryBox está en modo edición de nomes, gardar todos os nomes antes de continuar
                    if (summaryBoxRef.current && summaryBoxRef.current.getEditAll && summaryBoxRef.current.getEditAll()) {
                      summaryBoxRef.current.handleSaveAll();
                    }
                    // Colle os nomes máis recentes directamente do estado interno de SummaryBox
                    const seatNames = summaryBoxRef.current?.getSeatNames ? summaryBoxRef.current.getSeatNames() : {};
                    const entradasConNome = entradasSeleccionadas.map((b: any) => {
                      const seatId = `${b.row}-${b.seat}-${b.zona || ''}`;
                      const nomeFinal = seatNames[seatId] && seatNames[seatId].trim() !== "" ? seatNames[seatId] : nome;
                      return { ...b, nome: nomeFinal, nome_titular: nomeFinal };
                    });
                    if (!email || !nome) {
                      alert("Debes cubrir o email e o nome");
                      return;
                    }
                    if (!Array.isArray(entradasConNome) || entradasConNome.length === 0) {
                      alert("Debes seleccionar polo menos unha butaca");
                      return;
                    }
                    // Mostrar no console exactamente o que se envía ao backend
                    const payload = {
                      zona: "central",
                      entradas: entradasConNome,
                      email: email,
                      nome_titular: nome,
                      duracion_reserva: 10,
                      confirmada: false, // Estado temporal
                    };
                    console.log("[DEBUG] Payload enviado ao backend:", JSON.stringify(payload, null, 2));
                    // 1. Gardar as entradas no backend en estado Temporal durante 10 min
                    try {
                      const resp = await fetch(`http://localhost:8000/crear-eventos/${evento.id}/reservar/`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });
                      if (!resp.ok) {
                        const data = await resp.json();
                        console.error("Erro do backend:", data);
                        alert(data.error || "Erro ao reservar temporalmente as entradas");
                        return;
                      }
                      console.log("Reserva temporal gardada correctamente, navegando a infoPagamento");
                    } catch (err) {
                      console.error("Erro de conexión ao reservar temporalmente as entradas", err);
                      alert("Erro de conexión ao reservar temporalmente as entradas");
                      return;
                    }
                    // 2. Navegar a infoPagamento coas entradas, email e nome
                    console.log("Chamando navigate a /info-pagamento", entradasConNome, email, nome);
                    navigate(`/info-pagamento/${evento.id}/central`, {
                      state: { seats: entradasConNome, email, nome },
                    });
                  }}
                >
                  Pagar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
