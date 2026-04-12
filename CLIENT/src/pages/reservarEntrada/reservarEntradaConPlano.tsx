import API_BASE_URL from "../../utils/api";
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
// import { Button } from "react-bootstrap";
import { Button, Modal } from "react-bootstrap";
import AuditorioSelectorVerin from "../planoAuditorios/auditorioBotones/auditorioVerin";
import AuditorioSelectorOurense from "../planoAuditorios/auditorioBotones/auditorioOurense";
import MainNavbar from "../componentes/NavBar";

import { FaCalendarAlt, FaArrowLeft, FaEnvelope, FaUser, FaExclamationTriangle } from "react-icons/fa";


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
  const [modalError, setModalError] = useState<string | null>(null);
  const [gardando, setGardando] = useState(false);
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
  const [errorEmail, setErrorEmail] = useState("");
  const [errorNome, setErrorNome] = useState("");

  // Entradas seleccionadas (butacas) de todas as zonas
  const location = useLocation();
  // Recuperar todas as seleccións de todas as zonas ao montar
  const [entradasSeleccionadas, setEntradasSeleccionadas] = useState<any[]>(() => {
    if (!id) return [];
    const zonas = ["central", "dereita", "anfiteatro", "esquerda"];
    let todas: any[] = [];
    zonas.forEach(z => {
      const key = `auditorio_verin_selected_${z}_${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const lista = JSON.parse(raw);
          if (Array.isArray(lista)) {
            lista.forEach((b: any) => {
              if (b && typeof b.row === "number" && typeof b.seat === "number") {
                todas.push({ ...b, zona: z });
              }
            });
          }
        } catch {}
      }
    });
    // Se veñen do state, priorizar iso
    if (location.state && location.state.butacasSeleccionadas) {
      return location.state.butacasSeleccionadas;
    }
    return todas;
  });

  // Gardar todas as seleccións cando se eliminan butacas
  const handleEliminarButaca = (seat: any, idx: number) => {
    setEntradasSeleccionadas(prev => {
      const novas = prev.filter((_, i) => i !== idx);
      // Actualizar localStorage para todas as zonas
      if (id) {
        const zonas = ["central", "dereita", "anfiteatro", "esquerda"];
        zonas.forEach(z => {
          const key = `auditorio_verin_selected_${z}_${id}`;
          const lista = novas.filter(b => b.zona === z);
          localStorage.setItem(key, JSON.stringify(lista));
        });
      }
      return novas;
    });
  };
  // Ref for SummaryBox
  const summaryBoxRef = useRef<any>(null);

  // Ao desmontar, gardar as seleccións actuais no localStorage para cada zona
  useEffect(() => {
    return () => {
      if (!id) return;
      const zonas = ["central", "dereita", "anfiteatro", "esquerda"];
      zonas.forEach(z => {
        const lista = entradasSeleccionadas.filter(b => b.zona === z);
        const key = `auditorio_verin_selected_${z}_${id}`;
        localStorage.setItem(key, JSON.stringify(lista));
      });
    };
  }, [id, entradasSeleccionadas]);


  useEffect(() => {
    if (!id) return;
    const fetchEvento = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`${API_BASE_URL}/crear-eventos/publico/${id}/`);
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

  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lugarKey = normalizar(evento.localizacion);

  return (
    <>
    <MainNavbar />
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="p-3">
            <div className="d-flex align-items-start pb-2 mb-3">
              <Button
                className="volver-btn me-3"
                onClick={() => {
                  // Volver á última área de SeleccionButacaAuditorio na que se estivo
                  if (id && location.state && location.state.ultimaZonaVisitada) {
                    navigate(`/reservar-entrada-auditorio/${id}/${location.state.ultimaZonaVisitada}`, { state: { butacasSeleccionadas: entradasSeleccionadas } });
                  } else if (id && entradasSeleccionadas.length > 0) {
                    // Fallback: buscar a última zona con selección
                    const zonasOrde = ["central", "dereita", "anfiteatro", "esquerda"];
                    let ultimaZona = "central";
                    for (let i = entradasSeleccionadas.length - 1; i >= 0; i--) {
                      if (entradasSeleccionadas[i].zona && zonasOrde.includes(entradasSeleccionadas[i].zona)) {
                        ultimaZona = entradasSeleccionadas[i].zona;
                        break;
                      }
                    }
                    navigate(`/reservar-entrada-auditorio/${id}/${ultimaZona}`, { state: { butacasSeleccionadas: entradasSeleccionadas } });
                  } else if (id) {
                    navigate(`/reservar-entrada-auditorio/${id}/central`, { state: { butacasSeleccionadas: entradasSeleccionadas } });
                  } else {
                    navigate(-1);
                  }
                }}
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
                  onChange={e => {
                    setEmail(e.target.value);
                    setErrorEmail("");
                  }}
                />
                {errorEmail && (
                  <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                    <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                    {errorEmail}
                  </div>
                )}
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
                  onChange={e => {
                    setNome(e.target.value);
                    setErrorNome("");
                  }}
                />
                {errorNome && (
                  <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                    <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                    {errorNome}
                  </div>
                )}
              </div>
            </div>

            {/* Cuadro resumen de entradas seleccionadas */}
            <div className="mt-3">
              <SummaryBox
                  ref={summaryBoxRef}
                  entradasSeleccionadas={entradasSeleccionadas}
                  prezoEvento={evento.prezo_evento}
                  onEliminarButaca={handleEliminarButaca}
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
                  disabled={gardando}
                  onClick={async () => {
                    setGardando(true);
                    try {
                      if (summaryBoxRef.current && summaryBoxRef.current.getEditAll && summaryBoxRef.current.getEditAll()) {
                        summaryBoxRef.current.handleSaveAll();
                      }
                      const seatNames = summaryBoxRef.current?.getSeatNames ? summaryBoxRef.current.getSeatNames() : {};
                      const entradasConNome = entradasSeleccionadas.map((b: any) => {
                        const seatId = `${b.row}-${b.seat}-${b.zona || ''}`;
                        const nomeFinal = seatNames[seatId] && seatNames[seatId].trim() !== "" ? seatNames[seatId] : nome;
                        return { ...b, nome: nomeFinal, nome_titular: nomeFinal };
                      });
                      if (!email || !nome) {
                        if (!email) setErrorEmail("Por favor, introduce un email válido");
                        if (!nome) setErrorNome("Por favor, introduce o teu nome");
                        return;
                      }
                      // Validación de email
                      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                        setErrorEmail("Por favor, introduce un email válido");
                        return;
                      }
                      if (!Array.isArray(entradasConNome) || entradasConNome.length === 0) {
                        setModalError("Debes seleccionar polo menos unha butaca");
                        return;
                      }
                      const payload = {
                        zona: entradasConNome[0]?.zona || "central",
                        entradas: entradasConNome,
                        email: email,
                        nome_titular: nome,
                        duracion_reserva: 10,
                        confirmada: false,
                      };
                    // Novo fluxo: só vai a infoPagamento se tipo_gestion_entrada é "pagina" ou "a través da páxina"
                    const tipoGestion = (evento as any).tipo_gestion_entrada?.toLowerCase?.() || "";
                    if (tipoGestion === "pagina" || tipoGestion === "a través da páxina") {
                      // Pago online: reservar temporal e navegar a infoPagamento
                      const resp = await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/reservar/`, {
                        method: "POST",
                        headers: {
                          "Content-Type": "application/json",
                        },
                        body: JSON.stringify(payload),
                      });
                      if (!resp.ok) {
                        const data = await resp.json();
                        setModalError(data.error || "Erro ao reservar temporalmente as entradas");
                        return;
                      }
                      // Navegar á zona da primeira butaca seleccionada
                      const zonaNavegar = entradasConNome[0]?.zona || "central";
                      navigate(`/info-pagamento/${evento.id}/${zonaNavegar}`, {
                        state: { seats: entradasConNome, email, nome },
                      });
                    } else {
                      // Calquera outro caso (incluídos balde e cobro manual):
                      // Se o evento é SEN PLANO, usar invitacions-sen-plano (PUT)
                      const isSenPlano = Array.isArray(entradasConNome) && entradasConNome.length > 0 && entradasConNome.every(e => e.row == null && e.seat == null);
                      if (isSenPlano) {
                        // Evento sen plano: PUT a invitacions-sen-plano
                        const reservaPayload = {
                          cantidade: entradasConNome.length,
                          email: email,
                          nomes: entradasConNome.map(e => e.nome),
                          nome_xeral: nome,
                          confirmada: true
                        };
                        const resp = await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/invitacions-sen-plano/`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(reservaPayload),
                        });
                        if (!resp.ok) {
                          const data = await resp.json();
                          setModalError(data.error || "Erro ao reservar as entradas");
                          return;
                        }
                        const reservaData = await resp.json();
                        // Enviar email ao usuario
                        await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/enviar-entradas/`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            zona: undefined,
                            entradas: (reservaData.reservas || []).map((r: any) => ({ id: r.id })),
                            email: email
                          }),
                        });
                        // Navegar a ReservaExitosa pasando ids das reservas
                        const reservasIds = (reservaData.reservas || []).map((r: any) => r.id);
                        navigate("/reserva-exitosa", {
                          state: {
                            reservas: reservasIds,
                            ticketId: reservaData?.ticket_id || reservaData?.id || reservaData?.ticketId,
                            email
                          }
                        });
                      } else {
                        // Evento con plano: POST a reservar
                        const reservaPayload = { ...payload, confirmada: true };
                        const resp = await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/reservar/`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(reservaPayload),
                        });
                        if (!resp.ok) {
                          const data = await resp.json();
                          setModalError(data.error || "Erro ao reservar as entradas");
                          return;
                        }
                        const reservaData = await resp.json();
                        // Navegar a ReservaExitosa pasando ids das reservas
                        const reservasIds = (reservaData.reservas || []).map((r: any) => r.id);
                        // Enviar email ao usuario
                        const enviarPayload = {
                          entradas: reservasIds.map((id: any) => ({ id })),
                          email: email || "paquinho89@gmail.com"
                        };
                        await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/enviar-entradas/`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify(enviarPayload),
                        });
                        navigate("/reserva-exitosa", {
                          state: {
                            reservas: reservasIds,
                            ticketId: reservaData?.ticket_id || reservaData?.id || reservaData?.ticketId,
                            email
                          }
                        });
                      }
                    }
                  } catch (err) {
                    setModalError("Erro ao reservar ou enviar email");
                  } finally {
                    setGardando(false);
                  }
                }}
                >
                  {gardando ? "Reservando..." : "Reservar"}
                </Button>

        {/* Modal de erro bonito */}
        <Modal show={!!modalError} onHide={() => setModalError(null)} centered>
          <Modal.Header closeButton style={{ background: "#ffe6f3" }}>
            <Modal.Title style={{ color: "#ff0093", display: "flex", alignItems: "center", gap: 8 }}>
              <FaExclamationTriangle style={{ color: "#ff0093", marginRight: 8 }} />
              Aviso
            </Modal.Title>
          </Modal.Header>
          <Modal.Body style={{ background: "#fff" }}>
            <div style={{ color: "#000", fontSize: "1.1em", display: "flex", alignItems: "center", gap: 8 }}>
              {modalError}
            </div>
          </Modal.Body>
          <Modal.Footer style={{ background: "#fff" }}>
            <Button variant="secondary" onClick={() => setModalError(null)}>
              Pechar
            </Button>
          </Modal.Footer>
        </Modal>
              </>
            )}
          </div>
        </div>
      </div>

      </>
  );
}
