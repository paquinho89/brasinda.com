import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import "../../estilos/TarjetaEventoHome.css";
import "../../estilos/Botones.css";
import { 
  FaCalendarAlt, 
  FaMapMarkerAlt, 
  FaEuroSign, 
  FaMusic,        // Concerto / Musical
  FaTheaterMasks, // Obra de Teatro / Monólogo
  FaCommentDots,  // Coloquio / Charla
  FaUtensils,     // Comida/Cena Popular
  FaGlassCheers,  // Festa Popular
  FaGuitar,     // Festival
  FaStore,        // Feira
  FaStar   } from "react-icons/fa";

interface EventoHomeProps {
  evento: {
    id: number;
    imaxe_evento?: string | null;
    nome_evento: string;
    tipo_evento: string;
    data_evento: string;
    localizacion: string;
    localidade: string;
    entradas_venta: number;
    prezo_evento?: number;
  };
}

export default function TarjetaEventoHome({ evento }: EventoHomeProps) {
  const navigate = useNavigate();

  const imageUrl = evento.imaxe_evento
    ? (evento.imaxe_evento.startsWith("http") ? evento.imaxe_evento : `http://localhost:8000${evento.imaxe_evento}`)
    : null;

  const handleReservation = () => {
    navigate(`/evento/${evento.id}`);
  };

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

  formatDataCompleta(evento.data_evento);

  // Engade esta función utilitaria para comprobar se a data é hoxe ou mañá
  type DateType = string | Date;

  function getDiaOuHora(dateString: DateType) {
    const now = new Date();
    const eventoDate = new Date(dateString);
    const isToday =
      now.getFullYear() === eventoDate.getFullYear() &&
      now.getMonth() === eventoDate.getMonth() &&
      now.getDate() === eventoDate.getDate();
    const isTomorrow = (() => {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      return (
        tomorrow.getFullYear() === eventoDate.getFullYear() &&
        tomorrow.getMonth() === eventoDate.getMonth() &&
        tomorrow.getDate() === eventoDate.getDate()
      );
    })();
    const hora = eventoDate.toLocaleTimeString('gl-ES', { hour: '2-digit', minute: '2-digit' });
    if (isToday) return `Hoxe ás ${hora}`;
    if (isTomorrow) return `Mañá ás ${hora}`;
    // Se non é hoxe nin mañá, devolve a data completa
    return eventoDate.toLocaleDateString('gl-ES', { day: 'numeric', month: 'long', year: 'numeric' }) + ' ás ' + hora;
  }

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "Concerto":
      case "Musical":
        return <FaMusic style={{ marginRight: "6px" }} />;
      case "Obra de Teatro":
      case "Monólogo":
        return <FaTheaterMasks style={{ marginRight: "6px" }} />;
      case "Coloquio":
      case "Charla":
        return <FaCommentDots style={{ marginRight: "6px" }} />;
      case "Comida/Cena Popular":
        return <FaUtensils style={{ marginRight: "6px" }} />;
      case "Festa Popular":
        return <FaGlassCheers style={{ marginRight: "6px" }} />;
      case "Festival":
        return <FaGuitar style={{ marginRight: "6px" }} />;
      case "Feira":
        return <FaStore style={{ marginRight: "6px" }} />;
      default:
        return <FaStar style={{ marginRight: "6px" }} />;
    }
  };

  return (
    <div className="card shadow-sm h-100 position-relative tarjeta-evento" style={{ overflow: "hidden", cursor: "pointer" }} onClick={handleReservation}>
      {/* Título arriba de la imagen */}
      <div className="card-header">
        <h6 className="card-header mt-0 mb-0">{evento.nome_evento}</h6>
      </div>

      {/* Imagen */}
      {imageUrl && (
        <img
          src={imageUrl}
          className="card-img-top"
          alt={evento.nome_evento}
          style={{ objectFit: "cover", height: "200px" }}
        />
      )}

      {/* Contenido */}
      <div className="card-body d-flex flex-column">

        <p className="card-text mb-2">
          {getTipoIcon(evento.tipo_evento)}
          {evento.tipo_evento}
        </p>

        <p className="card-text mb-2">
          <FaEuroSign style={{ marginRight: "6px" }} />
          {Number(evento.prezo_evento ?? 0) > 0
            ? `${Number(evento.prezo_evento) % 1 === 0 ? Number(evento.prezo_evento) : Number(evento.prezo_evento).toFixed(2)} €`
            : "Evento de Balde"}
        </p>

        <p className="card-text mb-2">
            <FaMapMarkerAlt style={{ marginRight: "6px" }} />
            {(() => {
              if (!evento.localizacion) return "";
              // Eliminar só 'GA' e 'España' e posibles comas/espazos antes/despois, pero nunca eliminar a localidade
              let loc = evento.localizacion
                .replace(/,?\s*GA\b(?![a-zA-Z])/gi, "")
                .replace(/,?\s*España\b(?![a-zA-Z])/gi, "")
                .replace(/\s+,/g, ",")
                .replace(/,+/g, ",")
                .replace(/^,|,$/g, "")
                .trim();
              return loc;
            })()}
            {evento.localidade &&
              !["ga", "españa"].includes(evento.localidade.trim().toLowerCase())
              ? ` | ${evento.localidade}`
              : ""}
        </p>

        <p className="card-text mb-2">
          <FaCalendarAlt className="me-1" />
          {getDiaOuHora(evento.data_evento)}
        </p>

        {/* Botón de reserva */}
        <Button 
          variant="success" 
          className="reserva-entrada-btn"
          onClick={handleReservation}
          disabled={evento.entradas_venta === 0}
        >
          {evento.entradas_venta > 0 ? "Reservar Entrada" : "Agotadas"}
        </Button>
      </div>
    </div>
  );
}
