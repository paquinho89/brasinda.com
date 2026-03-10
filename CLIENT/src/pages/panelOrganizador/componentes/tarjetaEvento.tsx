import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaEuroSign, FaCreditCard } from "react-icons/fa";

interface EventoProps {
  evento: {
    id: number;
    imaxe_evento?: string | null;
    nome_evento: string;
    data_evento: string;
    localizacion: string;
    entradas_venta: number;
    prezo_evento?: number | null;
    tipo_gestion_entrada?: "pagina" | "manual" | "gratis" | null;
  };
  isPast?: boolean;
}

export default function TarjetaEvento({ evento, isPast = false }: EventoProps) {
  const navigate = useNavigate();

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

  const imageUrl = evento.imaxe_evento
    ? evento.imaxe_evento.startsWith("http")
      ? evento.imaxe_evento
      : `http://localhost:8000${evento.imaxe_evento}`
    : null;

  const handleManage = () => {
    navigate(`/panel-organizador/evento/${evento.id}`);
  };

  const handleResumo = () => {
    navigate(`/panel-organizador/evento/${evento.id}/resumo`);
  };

  const handleCobrar = () => {
    navigate(`/panel-organizador/cobro/${evento.id}`);
  };

  const isEventoGratuito =
    evento.tipo_gestion_entrada === "gratis" || Number(evento.prezo_evento ?? 0) <= 0;

  const textoXestionImporte =
    evento.tipo_gestion_entrada === "pagina"
      ? "Xestionado a través da páxina"
      : evento.tipo_gestion_entrada === "manual"
      ? "Xestionado polo organizador"
      : null;

  return (
    <div
      className="card shadow-sm h-100 tarjeta-evento"
      style={{ overflow: "hidden" }}
    >
      {/* Header */}
      <div className="card-header">
        <h6 className="card-header mt-0 mb-0">{evento.nome_evento}</h6>
      </div>

      {/* Imagen */}
      {imageUrl && (
        <img
          src={imageUrl}
          className="card-img-top"
          alt={evento.nome_evento}
          style={{ objectFit: "cover", height: "180px" }}
        />
      )}

      {/* Body */}
      <div className="card-body d-flex flex-column">
        <p className="card-text mb-2">
          <FaTicketAlt style={{ marginRight: "6px" }} />
          Entradas en venta: {evento.entradas_venta}
        </p>

        {evento.prezo_evento != null && (
          <p className="card-text mb-2">
            <FaEuroSign style={{ marginRight: "6px" }} />
            Prezo: {Number(evento.prezo_evento) > 0 ? `${evento.prezo_evento} €` : "Evento de Balde"}
          </p>
        )}

        {textoXestionImporte && (
          <p className="card-text mb-2">
            <FaCreditCard style={{ marginRight: "6px" }} />
            Cobro entradas: {textoXestionImporte}
          </p>
        )}

        <p className="card-text mb-2">
          <FaMapMarkerAlt style={{ marginRight: "6px" }} />
          {evento.localizacion}
        </p>

        <p className="card-text mb-2">
          <FaCalendarAlt className="me-1" />
          {dataFormato}
        </p>

        {isPast ? (
          isEventoGratuito ? (
            <button
              className="reserva-entrada-btn mt-auto"
              onClick={handleResumo}
            >
              Ver resumo do evento
            </button>
          ) : evento.tipo_gestion_entrada === "manual" ? (
            <button
              className="reserva-entrada-btn mt-auto"
              onClick={handleResumo}
            >
              Ver resumo evento
            </button>
          ) : (
            <button
              className="reserva-entrada-btn mt-auto"
              onClick={handleCobrar}
            >
              <FaEuroSign className="me-1" />
              Cobrar evento
            </button>
          )
        ) : (
          <button
            className="reserva-entrada-btn mt-auto"
            onClick={handleManage}
          >
            Gestionar este evento
          </button>
        )}
      </div>
    </div>
  );
}