import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import MainNavbar from "../componentes/NavBar";
import Anfiteatro from "../planoAuditorios/Planos/auditorioVerin/anfiteatro";
import ZonaCentral from "../planoAuditorios/Planos/auditorioVerin/zonaCentral";
import ZonaLateralDereita from "../planoAuditorios/Planos/auditorioVerin/zonaLateralDereita";
import ZonaLateralEsquerda from "../planoAuditorios/Planos/auditorioVerin/zonaLateralEsquerda";

import API_BASE_URL from "../../utils/api";


const SeleccionButacaAuditorio: React.FC = () => {
  const navigate = useNavigate();
  const { zona, id } = useParams<{ zona: string; id: string }>();
  const [reservedSeats, setReservedSeats] = useState<{ row: number; seat: number }[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!id || !zona) return;
    setLoading(true);
    fetch(`${API_BASE_URL}/crear-eventos/${id}/reservas/?zona=${zona}`)
      .then((res) => res.json())
      .then((data) => {
        setReservedSeats(data.reservas || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id, zona]);

  let ZonaComponent = null;
  let zonaTitulo = "";
  const zonas = ["central", "dereita", "anfiteatro", "esquerda"];
  const zonasTitulos: Record<string, string> = {
    central: "Central",
    dereita: "Dereita",
    anfiteatro: "Anfiteatro",
    esquerda: "Esquerda",
  };
  const commonProps = { reservedSeats, blockReservedSeats: true };
  switch (zona) {
    case "anfiteatro":
      ZonaComponent = <Anfiteatro {...commonProps} />;
      zonaTitulo = zonasTitulos["anfiteatro"];
      break;
    case "central":
      ZonaComponent = <ZonaCentral {...commonProps} />;
      zonaTitulo = zonasTitulos["central"];
      break;
    case "esquerda":
      ZonaComponent = <ZonaLateralEsquerda {...commonProps} />;
      zonaTitulo = zonasTitulos["esquerda"];
      break;
    case "dereita":
      ZonaComponent = <ZonaLateralDereita {...commonProps} />;
      zonaTitulo = zonasTitulos["dereita"];
      break;
    default:
      ZonaComponent = <div>Zona non válida</div>;
      zonaTitulo = "";
  }

  // Navegación circular
  const zonaActualIndex = zonas.indexOf(zona || "");
  const zonaEsquerda = zonas[(zonaActualIndex - 1 + zonas.length) % zonas.length];
  const zonaDereita = zonas[(zonaActualIndex + 1) % zonas.length];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <MainNavbar />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: "center", margin: 40 }}>Cargando butacas reservadas...</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, gap: 16 }}>
              <button
                aria-label="Ir á área anterior"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 4 }}
                onClick={() => {
                  if (id) navigate(`/reservar-entrada-auditorio/${id}/${zonaEsquerda}`);
                }}
              >
                <FaChevronLeft />
              </button>
              <h2 style={{ margin: 0, minWidth: 100, textAlign: "center" }}>{zonaTitulo}</h2>
              <button
                aria-label="Ir á área seguinte"
                style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 4 }}
                onClick={() => {
                  if (id) navigate(`/reservar-entrada-auditorio/${id}/${zonaDereita}`);
                }}
              >
                <FaChevronRight />
              </button>
            </div>
            <div style={{ marginBottom: 24 }}>{ZonaComponent}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
              <button className="boton-avance" onClick={() => { if (id) navigate(`/reservar-entrada-auditorio/${id}`); }}>
                <FaArrowLeft style={{ marginRight: 8 }} /> Volver
              </button>
              <button
                className="reserva-entrada-btn"
                onClick={() => {
                  if (id && zona) {
                    navigate(`/info-pagamento/${id}/${zona}`);
                  }
                }}
              >
                Continuar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SeleccionButacaAuditorio;
