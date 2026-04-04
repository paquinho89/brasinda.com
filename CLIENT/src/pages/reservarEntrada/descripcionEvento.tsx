import { useState, useEffect } from "react";
import MapaEvento from "../panelOrganizador/componentes/MapaEvento";
import { useParams, useNavigate } from "react-router-dom";
import API_BASE_URL from "../../utils/api";
import { Container, Button, Spinner, Alert } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import Footer from "../componentes/footer";
import "../../estilos/TarjetaEventoHome.css";
import "../../estilos/Botones.css";
import {
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaArrowLeft,
  FaMusic,
  FaTheaterMasks,
  FaCommentDots,
  FaUtensils,
  FaGlassCheers,
  FaGuitar,
  FaStore,
  FaStar,
} from "react-icons/fa";

interface evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  data_evento: string;
  localizacion: string;
  nota_lugar?: string;
  entradas_venta: number;
  prezo_evento?: number;
  descripcion_evento?: string;
  tipo_evento?: string;
  coordenadas?: [number, number];
}

const normalizarTexto = (texto: string) =>
  texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

const usaPlanoAuditorio = (localizacion: string) => {
  const lugar = normalizarTexto(localizacion);
  return lugar.includes("auditorio") && (lugar.includes("verin") || lugar.includes("ourense"));
};

const getTipoIcon = (tipo?: string) => {
  switch (tipo) {
    case "Concerto":
    case "Musical":
      return <FaMusic className="me-2" />;
    case "Obra de Teatro":
    case "Monólogo":
      return <FaTheaterMasks className="me-2" />;
    case "Coloquio":
    case "Charla":
      return <FaCommentDots className="me-2" />;
    case "Comida/Cena Popular":
      return <FaUtensils className="me-2" />;
    case "Festa Popular":
      return <FaGlassCheers className="me-2" />;
    case "Festival":
      return <FaGuitar className="me-2" />;
    case "Feira":
      return <FaStore className="me-2" />;
    default:
      return <FaStar className="me-2" />;
  }
};

export default function DescripcionEvento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cantidad] = useState(1);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`${API_BASE_URL}/crear-eventos/publicos/`);
        
        if (!resp.ok) {
          throw new Error(`Error al cargar evento: ${resp.status}`);
        }

        const data = await resp.json();
        
        const eventoEncontrado = Array.isArray(data) 
          ? data.find((ev: evento) => ev.id === parseInt(id || `0"))
          : null;

        if (!eventoEncontrado) {
          throw new Error("Evento non encontrado");
        }

        setEvento(eventoEncontrado);
      } catch (e: any) {
        console.error("Error fetching evento", e);
        setError(e.message || "Error ao cargar evento");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchEvento();
    }
  }, [id]);

  const handleReservation = () => {
    if (!evento) return;
    const precioTotal = (evento.prezo_evento || 0) * cantidad;

    const reservaData = {
      eventoId: evento.id,
      eventoNombre: evento.nome_evento,
      cantidadEntradas: cantidad,
      precioUnitario: evento.prezo_evento,
      precioTotal: precioTotal,
      imaxe_evento: evento.imaxe_evento,
      localizacion: evento.localizacion,
      data_evento: evento.data_evento,
    };

    localStorage.setItem("reservaEvento", JSON.stringify(reservaData));
    const rutaReserva = usaPlanoAuditorio(evento.localizacion)
      ? `/reservar-entrada/${evento.id}`
      : `/reservar-entrada-sen-plano/${evento.id}`;
    navigate(rutaReserva);
  };

  if (loading) {
    return (
      <>
        <MainNavbar />
        <Container className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </Spinner>
        </Container>
      </>
    );
  }

  if (error || !evento) {
    return (
      <>
        <MainNavbar />
        <Container className="mt-5">
          <Alert variant="danger">{error || "Evento non encontrado"}</Alert>
          <Button variant="primary" onClick={() => navigate("/")}>
            <FaArrowLeft className="me-2" />
            Volver a Inicio
          </Button>
        </Container>
      </>
    );
  }

  const imageUrl = evento.imaxe_evento
    ? evento.imaxe_evento.startsWith("http")
      ? evento.imaxe_evento
      : `${API_BASE_URL}${evento.imaxe_evento}`
    : null;

  const dataFormato = new Date(evento.data_evento).toLocaleDateString("es-ES", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaFormato = new Date(evento.data_evento).toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const prezoEvento = Number(evento.prezo_evento ?? 0);
  const prezoFormatado = Number.isInteger(prezoEvento)
    ? String(prezoEvento)
    : prezoEvento.toFixed(2);

  return (
    <>
      <MainNavbar />
      <Container className="mt-5">
        <div className="row">
          <div className="col-md-6 mb-4">
            {imageUrl && (
              <img
                src={imageUrl}
                alt={evento.nome_evento}
                className="img-fluid rounded shadow"
                style={{ maxHeight: "500px", objectFit: "cover", width: "100%" }}
              />
            )}
          </div>

          <div className="col-md-6">
            <h1 className="mb-3">{evento.nome_evento}</h1>

            {evento.tipo_evento && (
              <p className="text-muted" style={{ fontSize: "1.1rem" }}>
                {getTipoIcon(evento.tipo_evento)}
                {evento.tipo_evento}
              </p>
            )}

            {/* Botones arriba */}
            <div className="d-flex gap-3 mb-3">
              <Button
                className="volver-btn"
                onClick={() => navigate("/")}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
              <Button
                variant="success"
                size="lg"
                className="reserva-entrada-btn"
                onClick={handleReservation}
                disabled={evento.entradas_venta === 0}
              >
                {evento.entradas_venta > 0 ? "Reservar Entrada" : "Agotadas"}
              </Button>
            </div>

            <div className="card mb-4 p-3">
              <p className="mb-2">
                <FaCalendarAlt className="me-1" />
                <strong>{dataFormato}</strong>
              </p>
              <p className="mb-2">
                <FaClock className="me-1" />
                <strong>{horaFormato}</strong>
              </p>
              <p className="mb-2">
                <strong className="text-success fs-5">
                  {prezoEvento > 0
                    ? `Prezo: ${prezoFormatado} €`
                    : "Evento de Balde"}
                </strong>
              </p>
              <p className="mb-2">
                <FaMapMarkerAlt className="me-1" />
                <strong>{evento.localizacion}</strong>
              </p>
              {evento.nota_lugar && (
                <p className="mb-2 text-muted" style={{ fontSize: "0.95rem" }}>
                  {evento.nota_lugar}
                </p>
              )}
              <MapaEvento coordenadas={evento.coordenadas} direccion={evento.localizacion} />
            </div>

            {evento.descripcion_evento && (
              <div className="mb-4">
                <p>{evento.descripcion_evento}</p>
              </div>
            )}

            {/* Boton abajo */}
            <div className="d-flex">
              <Button
                variant="success"
                size="lg"
                className="reserva-entrada-btn"
                onClick={handleReservation}
                disabled={evento.entradas_venta === 0}
              >
                {evento.entradas_venta > 0 ? "Reservar Entrada" : "Agotadas"}
              </Button>
            </div>
          </div>
        </div>
      </Container>
      <Footer />
    </>
  );
}
