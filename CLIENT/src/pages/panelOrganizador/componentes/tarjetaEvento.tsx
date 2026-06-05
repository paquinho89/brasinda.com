import { useNavigate } from "react-router-dom";
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt, FaEuroSign, FaCreditCard, FaFacebookF, FaWhatsapp, FaLink } from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import API_BASE_URL from "../../../utils/api";

interface EventoProps {
  evento: {
    id: number;
    imaxe_evento?: string | null;
    nome_evento: string;
    data_evento: string;
    localizacion: string;
    localidade?: string;
    entradas_venta: number;
    prezo_evento?: number | null;
    tipo_gestion_entrada?: "pagina" | "manual" | "gratis" | null;
    evento_cobrado?: boolean;
    factura_pdf?: string | null;
  };
  isPast?: boolean;
}

import { useState } from "react";

export default function TarjetaEvento({ evento, isPast = false }: EventoProps) {
  const [copied, setCopied] = useState(false);
    // Usar slug se está dispoñible
    const slug = (evento as any).slug;
    const eventUrl = slug ? `${window.location.origin}/evento/${slug}/${evento.id}` : `${window.location.origin}/evento/${evento.id}`;

    const handleCopy = async () => {
      try {
        await navigator.clipboard.writeText(eventUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      } catch {}
    };
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
      : `${API_BASE_URL}${evento.imaxe_evento}`
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
      ? "A través da páxina"
      : evento.tipo_gestion_entrada === "manual"
      ? "A través do organizador"
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
          Entradas á venda: {evento.entradas_venta}
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
          {dataFormato}
        </p>

        {isPast ? (
          evento.evento_cobrado ? (
            <div className="d-flex flex-column gap-2 mt-auto">
              <button
                className="reserva-entrada-btn"
                onClick={handleResumo}
              >
                Resumo Evento
              </button>
              <button
                className="reserva-entrada-btn"
                onClick={() => {
                  if (evento.factura_pdf) {
                    const url = evento.factura_pdf.startsWith("http")
                      ? evento.factura_pdf
                      : `${API_BASE_URL}${evento.factura_pdf}`;
                    window.open(url, "_blank", "noopener,noreferrer");
                  }
                }}
                disabled={!evento.factura_pdf}
              >
                Descargar Factura
              </button>
            </div>
          ) : isEventoGratuito ? (
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
          <>
            <button
              className="reserva-entrada-btn mt-auto"
              onClick={handleManage}
            >
              Gestionar este evento
            </button>
            <div className="d-flex justify-content-center mt-1 gap-3">
              <button
                type="button"
                onClick={handleCopy}
                title={copied ? "Ligazón copiada!" : "Copiar ligazón do evento"}
                style={{ background: 'none', border: 'none', color: '#000', fontSize: 20, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
              >
                <FaLink />
                {copied && <span style={{ marginLeft: 6, color: '#ff0093', fontSize: 13 }}>Copiada!</span>}
              </button>
              <a
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en Facebook"
                style={{ color: '#000', fontSize: 19 }}
              >
                <FaFacebookF />
              </a>
              <a
                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Consulta este evento: ${evento.nome_evento} - ${eventUrl}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en X"
                style={{ color: '#000', fontSize: 20 }}
              >
                <FaXTwitter />
              </a>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(eventUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                title="Compartir en WhatsApp"
                style={{ color: '#000', fontSize: 20 }}
              >
                <FaWhatsapp />
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}