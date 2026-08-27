import { useState } from "react";
import { FaPhoneAlt, FaWhatsapp, FaTimes } from "react-icons/fa";

const RAW_WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER as string | undefined;
const WHATSAPP_NUMBER = RAW_WHATSAPP_NUMBER ? RAW_WHATSAPP_NUMBER.replace(/\D/g, "") : "";
const numberConfigured = WHATSAPP_NUMBER.length > 0;

const formatWhatsAppUrl = (message: string) => {
  const encodedMessage = encodeURIComponent(message || "Boas, qué che pasa?");
  return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
};

export default function SupportFloatingButton() {
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState("Boas, qué che pasa?");

  const handleOpenWhatsApp = () => {
    if (!numberConfigured) {
      window.alert("Por favor configura o número de WhatsApp en VITE_WHATSAPP_NUMBER no ficheiro .env.");
      return;
    }
    const url = formatWhatsAppUrl(message);
    window.open(url, "_blank");
  };

  const closeModal = () => {
    setShowModal(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label="Contacto de soporte"
        title="Contacto de soporte"
        style={{
          position: "fixed",
          right: "1rem",
          bottom: "1rem",
          zIndex: 1200,
          border: "none",
          borderRadius: "999px",
          backgroundColor: "#171717",
          color: "#ffffff",
          width: "52px",
          height: "52px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.22)",
          cursor: "pointer",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#ff0093";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "#171717";
        }}
      >
        <FaPhoneAlt size={22} />
      </button>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Seleccione tipo de soporte"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(17, 24, 39, 0.35)",
            zIndex: 1300,
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "flex-end",
            padding: "1rem",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "360px",
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              padding: "1.25rem",
              border: "1px solid #e5e7eb",
              position: "relative",
              marginTop: "auto",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
              <div>
                <h2 style={{ margin: 0, fontSize: "1.6rem", fontWeight: 800, color: "#111827" }}>
                  Soporte
                </h2>
                <p style={{ margin: "0.35rem 0 0", color: "#4b5563" }}>
                  Escribe a túa mensaxe e abre Whatsapp para contactar co noso equipo.
                </p>
                {!numberConfigured && (
                  <p style={{ margin: "0.75rem 0 0", color: "#b91c1c", fontWeight: 600 }}>
                    Aviso: non hai número de WhatsApp configurado. Engade `VITE_WHATSAPP_NUMBER` no ficheiro `.env`.
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowModal(false)}
              aria-label="Pechar"
              style={{
                position: "absolute",
                top: "0.75rem",
                right: "0.75rem",
                border: "none",
                background: "transparent",
                color: "#6b7280",
                fontSize: "2.4rem",
                fontWeight: 700,
                lineHeight: 1,
                width: "48px",
                height: "48px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#ff0093";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#6b7280";
              }}
            >
              ✕
            </button>

            <div style={{ display: "grid", gap: "1rem", marginTop: "1rem" }}>
              <div style={{ display: "grid", gap: "0.5rem" }}>
                <label style={{ fontWeight: 600, color: "#111827" }} htmlFor="support-message-input">
                  Mensaxe
                </label>
                <textarea
                  id="support-message-input"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  style={{
                    width: "100%",
                    border: "1px solid #d1d5db",
                    borderRadius: "12px",
                    padding: "0.75rem",
                    fontSize: "0.95rem",
                    color: "#111827",
                    resize: "vertical",
                  }}
                />
              </div>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                className="reserva-entrada-btn"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
              >
                <FaWhatsapp size={18} />
                Enviar e abrir Whatsapp
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
