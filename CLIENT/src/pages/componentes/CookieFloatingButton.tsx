import { useNavigate, useLocation } from "react-router-dom";
import { FaCookieBite } from "react-icons/fa";
import { useEffect, useState } from "react";
import "../../estilos/Botones.css";
import {
  getCookiePreferences,
  setCookiePreferences,
} from "../../utils/cookieConsent";

function CookieFloatingButton() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showModal, setShowModal] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);
  const [preferencesEnabled, setPreferencesEnabled] = useState(false);

  useEffect(() => {
    const prefs = getCookiePreferences();
    setAnalyticsEnabled(Boolean(prefs.analytics));
    setPreferencesEnabled(Boolean(prefs.preferences));
  }, []);

  const savePreferences = (analytics: boolean, preferences: boolean) => {
    setCookiePreferences(analytics, preferences);

    setAnalyticsEnabled(analytics);
    setPreferencesEnabled(preferences);
    setShowModal(false);
  };

  if (location.pathname === "/cookies") {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        aria-label="Configurar cookies"
        title="Configurar cookies"
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
        <FaCookieBite size={22} />
      </button>

      {showModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Configuración de cookies"
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(17, 24, 39, 0.55)",
            zIndex: 1300,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "620px",
              backgroundColor: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.25)",
              padding: "1.5rem",
              border: "1px solid #e5e7eb",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem" }}>
              <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: 800, color: "#111827" }}>
                Configuración de cookies
              </h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                aria-label="Pechar"
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#6b7280",
                  fontSize: "1.8rem",
                  lineHeight: 1,
                  width: "40px",
                  height: "40px",
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
                x
              </button>
            </div>

            <div style={{ display: "grid", gap: "0.8rem" }}>
              <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <strong style={{ color: "#111827" }}>Necesarias</strong>
                  <span
                    style={{
                      backgroundColor: "#dcfce7",
                      color: "#166534",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.55rem",
                    }}
                  >
                    Sempre activas
                  </span>
                </div>
                <p style={{ margin: "0.45rem 0 0", color: "#4b5563" }}>
                  Son necesarias para o funcionamento da web.
                </p>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <strong style={{ color: "#111827" }}>Analíticas</strong>
                  <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={analyticsEnabled}
                      onChange={(e) => setAnalyticsEnabled(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#ff0093" }}
                    />
                  </label>
                </div>
                <p style={{ margin: "0.45rem 0 0", color: "#4b5563" }}>
                  Permiten analizar o uso da web.
                </p>
              </div>

              <div style={{ border: "1px solid #e5e7eb", borderRadius: "12px", padding: "0.9rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "1rem" }}>
                  <strong style={{ color: "#111827" }}>Preferencias</strong>
                  <label style={{ display: "inline-flex", alignItems: "center", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={preferencesEnabled}
                      onChange={(e) => setPreferencesEnabled(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#ff0093" }}
                    />
                  </label>
                </div>
                <p style={{ margin: "0.45rem 0 0", color: "#4b5563" }}>
                  Gardan a configuración do usuario.
                </p>
              </div>
            </div>

            <div
              style={{
                marginTop: "1rem",
                display: "flex",
                gap: "0.6rem",
                flexWrap: "wrap",
                justifyContent: "flex-end",
              }}
            >
              <button
                type="button"
                className="reserva-entrada-btn"
                onClick={() => savePreferences(false, false)}
              >
                Rexeitar
              </button>

              <button
                type="button"
                className="boton-avance"
                onClick={() => savePreferences(true, true)}
              >
                Aceptar
              </button>
            </div>

            <button
              type="button"
              onClick={() => navigate("/cookies")}
              style={{
                marginTop: "0.75rem",
                border: "none",
                background: "transparent",
                color: "#ff0093",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
            >
              Ver política de cookies
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default CookieFloatingButton;
