import { useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import "../../estilos/TarjetaEventoHome.css";
import "../../estilos/Botones.css";
import API_BASE_URL from "../../utils/api";
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
    evento_verificado: boolean;
  };
  modoPublicacionExitosa?: boolean;
}

export default function TarjetaEventoHome({ evento, modoPublicacionExitosa }: EventoHomeProps) {
  const navigate = useNavigate();

  const imageUrl = evento.imaxe_evento
    ? (evento.imaxe_evento.startsWith("http") ? evento.imaxe_evento : `${API_BASE_URL}${evento.imaxe_evento}`)
    : null;


  const handleReservation = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (modoPublicacionExitosa) {
      window.open(`/evento/${evento.id}`, '_blank');
    } else {
      navigate(`/evento/${evento.id}`);
    }
  };

  const handleGestionarEvento = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`/panel-organizador/evento/${evento.id}`, '_blank');
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


  // Mostrar 'Dende:' se prezo_areas é true
  // O campo prezo_areas debe estar dispoñible no obxecto evento
  const prezoAreas = (evento as any).prezo_areas === true || (evento as any).prezo_areas === 'true';

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
      <div className="card-body d-flex flex-column" style={{ textAlign: "left" }}>
        <p className="card-text mb-2">
          {getTipoIcon(evento.tipo_evento)}
          {evento.tipo_evento}
        </p>

        <p className="card-text mb-2">
          <FaEuroSign style={{ marginRight: "6px" }} />
          {prezoAreas
            ? <><span style={{ color: '#000', fontWeight: 'normal' }}>Dende:</span> {Number((evento as any).prezo_pvp ?? 0) > 0 ? `${Number((evento as any).prezo_pvp) % 1 === 0 ? Number((evento as any).prezo_pvp) : Number((evento as any).prezo_pvp).toFixed(2)} €` : "Evento de Balde"}</>
            : (Number((evento as any).prezo_pvp ?? 0) > 0
                ? `${Number((evento as any).prezo_pvp) % 1 === 0 ? Number((evento as any).prezo_pvp) : Number((evento as any).prezo_pvp).toFixed(2)} €`
                : "Evento de Balde")}
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

        {/* Só mostrar Xestionar Evento e Ver evento se modoPublicacionExitosa */}
        {modoPublicacionExitosa ? (
          <>
            <Button
              className="reserva-entrada-btn mb-2"
              onClick={handleGestionarEvento}
            >
              Xestionar Evento
            </Button>
            <Button 
              variant="secondary" 
              className="reserva-entrada-btn mb-2"
              onClick={handleReservation}
            >
              Ver evento
            </Button>
            {/* Reservar Entrada oculto en modoPublicacionExitosa */}
          </>
        ) : (
          evento.evento_verificado ? (
            <Button 
              variant="success" 
              className="reserva-entrada-btn"
              onClick={handleReservation}
              disabled={evento.entradas_venta === 0}
            >
              Reservar Entrada
            </Button>
          ) : (
            <Button 
              variant="secondary" 
              className="reserva-entrada-btn"
              onClick={handleReservation}
            >
              Ver evento
            </Button>
          )
        )}
      </div>
    </div>
  );
}
