import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainNavbar from "../componentes/NavBar";
import API_BASE_URL from "../../utils/api";

type Estado = "cargando" | "ok" | "xa_baixa" | "sen_email" | "erro";

const BaixaNewsletter: React.FC = () => {
  const navigate = useNavigate();
  const [estado, setEstado] = useState<Estado>("cargando");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = (params.get("email") || "").trim();
    if (!emailParam) {
      setEstado("sen_email");
      return;
    }
    setEmail(emailParam);

    fetch(`${API_BASE_URL}/eventos/newsletter/baixa/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailParam }),
    })
      .then(async (resp) => {
        const data = await resp.json().catch(() => null);
        if (resp.ok && data?.success) {
          setEstado(data.xa_baixa ? "xa_baixa" : "ok");
        } else {
          setEstado("erro");
        }
      })
      .catch(() => setEstado("erro"));
  }, []);

  return (
    <>
      <MainNavbar />
      <div className="container py-5 text-center">
        <div style={{ maxWidth: 520, margin: "0 auto" }}>
          {estado === "cargando" && (
            <>
              <h1 style={{ color: "#ff0093", fontWeight: 800, fontSize: "2rem" }}>
                Procesando a túa baixa...
              </h1>
              <p style={{ color: "#555", fontSize: "1.1rem" }}>Agarde un momento.</p>
            </>
          )}

          {estado === "ok" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>✅</div>
              <h1 style={{ color: "#ff0093", fontWeight: 800, fontSize: "2rem" }}>
                Baixa confirmada
              </h1>
              <p style={{ color: "#444", fontSize: "1.15rem", lineHeight: 1.7 }}>
                O email <strong style={{ color: "#ff0093" }}>{email}</strong> foi dado de baixa.
                Non volverás recibir cousiñas da Brasinda
              </p>
            </>
          )}

          {estado === "xa_baixa" && (
            <>
              <div style={{ fontSize: "3rem", marginBottom: 12 }}>ℹ️</div>
              <h1 style={{ color: "#ff0093", fontWeight: 800, fontSize: "2rem" }}>
                Xa estabas dado de baixa
              </h1>
              <p style={{ color: "#444", fontSize: "1.15rem", lineHeight: 1.7 }}>
                O email <strong style={{ color: "#ff0093" }}>{email}</strong> xa non estaba
                activo na newsletter.
              </p>
            </>
          )}

          {estado === "sen_email" && (
            <>
              <h1 style={{ color: "#ff0093", fontWeight: 800, fontSize: "2rem" }}>
                Ligazón non válida
              </h1>
              <p style={{ color: "#444", fontSize: "1.15rem", lineHeight: 1.7 }}>
                A ligazón de baixa non contén un email. Usa a ligazón que aparece ao final
                dos emails da newsletter.
              </p>
            </>
          )}

          {estado === "erro" && (
            <>
              <h1 style={{ color: "#ff0093", fontWeight: 800, fontSize: "2rem" }}>
                Non se puido procesar a baixa
              </h1>
              <p style={{ color: "#444", fontSize: "1.15rem", lineHeight: 1.7 }}>
                Produciuse un erro. Se o problema persiste, escríbenos a{" "}
                <a href="mailto:eventos@brasinda.com" style={{ color: "#ff0093" }}>
                  eventos@brasinda.com
                </a>
                .
              </p>
            </>
          )}

          {estado !== "cargando" && (
            <button
              className="reserva-entrada-btn"
              style={{ maxWidth: 280, margin: "24px auto 0" }}
              onClick={() => navigate("/")}
            >
              Volver á páxina principal
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default BaixaNewsletter;
