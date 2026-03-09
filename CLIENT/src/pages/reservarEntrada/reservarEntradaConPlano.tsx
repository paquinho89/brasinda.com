import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import AuditorioSelectorVerin from "../planoAuditorios/auditorioBotones/auditorioVerin";
import AuditorioSelectorOurense from "../planoAuditorios/auditorioBotones/auditorioOurense";
import MainNavbar from "../componentes/NavBar";
import { FaCalendarAlt, FaTicketAlt } from "react-icons/fa";


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
  const [openZonaCentralSignal, setOpenZonaCentralSignal] = useState(0);
  const butacasRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

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
                className="volver-verde-btn me-3"
                onClick={() => navigate(-1)}
              >
                ← Volver
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
            <div ref={butacasRef}>
              <AuditorioComponente
                eventoId={evento.id}
                variant="verde"
                openZonaCentralSignal={openZonaCentralSignal}
                onZonaClick={(zona) => {
                  console.log("Zona seleccionada:", zona);
                }}
              />
            </div>

            {evento.procedimiento_cobro_manual && (
              <div className="mt-3 p-3 border-left-4" style={{
                backgroundColor: "#e8f5e9",
                borderLeftColor: "#2e7d32",
                borderLeftWidth: "4px",
                borderRadius: "4px"
              }}>
                <strong style={{ color: "#1b5e20", fontSize: "1.1em" }}>Procedemento para o pago:</strong>
                <p className="mt-2 mb-0" style={{ color: "#333" }}>
                  {evento.procedimiento_cobro_manual}
                </p>
              </div>
            )}

            {evento.prezo_evento != null && (
              <>
                <p className="mt-3 mb-2">
                  <FaTicketAlt className="me-1" />
                  <strong>Prezo: </strong>{evento.prezo_evento} €
                </p>
                <Button
                  className="reserva-entrada-verde-btn mt-3"
                  onClick={() => {
                    butacasRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                    setOpenZonaCentralSignal((prev) => prev + 1);
                  }}
                >
                  Escoller entrada
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
