import { useState } from "react";
import { FaPhoneAlt } from "react-icons/fa";

export default function SupportFloatingButton() {
  const [showModal, setShowModal] = useState(false);

  const handleSupportSelect = (type: "Organizador" | "Asistente") => {
    console.log("Soporte seleccionado:", type);
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
                  Selecciona o teu tipo de usuario.
                </p>
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

            <div style={{ display: "grid", gap: "0.75rem", marginTop: "1rem" }}>
              <button
                type="button"
                onClick={() => handleSupportSelect("Organizador")}
                className="reserva-entrada-btn"
                style={{ width: "100%" }}
              >
                Organizador
              </button>
              <button
                type="button"
                onClick={() => handleSupportSelect("Asistente")}
                className="reserva-entrada-btn"
                style={{ width: "100%" }}
              >
                Asistente
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
