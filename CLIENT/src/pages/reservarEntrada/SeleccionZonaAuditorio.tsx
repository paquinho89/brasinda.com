import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import API_BASE_URL from "../../utils/api";

// import SeleccionButacaAuditorio from "./SeleccionButacaAuditorio"; // (unused)

const SeleccionZonaAuditorio: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<any>(location.state?.evento || null);
  const [loading, setLoading] = useState(!location.state?.evento);
  const [error, setError] = useState<string | null>(null);
  // Eliminamos o estado local de zonaSeleccionada
  const [zonasPrezo, setZonasPrezo] = useState<Record<string, number>>({});
  // Cargar prezos das zonas se prezo_areas
  useEffect(() => {
    if (evento && evento.prezo_areas && id) {
      fetch(`${API_BASE_URL}/eventos/${id}/zonas-prezo/`)
        .then((res) => {
          if (!res.ok) throw new Error("Non se atoparon prezos de zonas");
          return res.json();
        })
        .then((zonas: Array<{ nome: string; prezo: number; prezo_pvp?: number }>) => {
          const map: Record<string, number> = {};
          zonas.forEach(z => {
            // Eliminar espazos e normalizar nomes
            const nome = z.nome?.toLowerCase().trim();
            map[nome] = z.prezo_pvp !== undefined ? z.prezo_pvp : z.prezo;
          });
          setZonasPrezo(map);
        })
        .catch(() => setZonasPrezo({}));
    }
  }, [evento, id]);

  useEffect(() => {
    if (!evento && id) {
      setLoading(true);
      fetch(`${API_BASE_URL}/crear-eventos/publico/${id}/`)
        .then((res) => {
          if (!res.ok) throw new Error("Non se atopou o evento");
          return res.json();
        })
        .then((data) => {
          setEvento(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message || "Erro ao cargar o evento");
          setLoading(false);
        });
    }
  }, [id, evento]);

  if (loading) {
    return (
      <div className="seleccion-butaca-auditorio-fullscreen" style={{ minHeight: "100vh", background: "#f8f9fa", display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Cargando...</span>
        </Spinner>
      </div>
    );
  }



  // Manter seleccións de butacas entre pantallas usando localStorage
  function handleZonaClick(zona: string) {
    if (!id) return;
    navigate(`/reservar-entrada-auditorio/${id}/${zona}`);
  }

  return (
    <div className="seleccion-butaca-auditorio-fullscreen" style={{ minHeight: "100vh", background: "#f8f9fa", position: 'relative' }}>
      <MainNavbar />
      {/* Botón de Volver na marxe esquerda, por debaixo da navbar */}
      <div style={{ width: '100%', display: 'flex', alignItems: 'flex-start', marginTop: 16, marginBottom: -16 }}>
          <button
            onClick={() => id && navigate(`/evento/${id}`)}
            className="boton-avance"
            style={{ marginLeft: 32 }}
          >
            ← <span className="volver-texto">Volver</span>
          </button>
      </div>
      <div style={{ maxWidth: 500, margin: "0 auto", padding: 32 }}>
        <h2 style={{ textAlign: "center", marginBottom: 18 }}>Selecciona unha zona</h2>
        {evento?.localizacion && (
          <div style={{ textAlign: "center", fontWeight: 600, fontSize: 20, color: "#ff0093", marginBottom: 22 }}>
            {evento.localizacion}
          </div>
        )}
        <div className="auditorio-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <button className="zona anfiteatro" style={{ margin: "0 auto 25px auto" }} onClick={() => handleZonaClick("anfiteatro")}> 
            ANFITEATRO
            <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
              {evento?.prezo_areas
                ? zonasPrezo["anfiteatro"] !== undefined
                  ? (Number(zonasPrezo["anfiteatro"]) % 1 === 0
                      ? zonasPrezo["anfiteatro"] + ' €'
                      : zonasPrezo["anfiteatro"].toFixed(2) + ' €')
                  : ''
                : evento?.prezo_pvp > 0
                  ? (Number(evento.prezo_pvp) % 1 === 0
                      ? Number(evento.prezo_pvp) + ' €'
                      : Number(evento.prezo_pvp).toFixed(2) + ' €')
                  : null}
            </div>
          </button>
          <div className="platea" style={{ display: "flex", justifyContent: "center", gap: 15 }}>
            <button className="zona esquerda" onClick={() => handleZonaClick("esquerda")}> 
              ESQUERDA
              <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                {evento?.prezo_areas
                  ? zonasPrezo["esquerda"] !== undefined
                    ? (Number(zonasPrezo["esquerda"]) % 1 === 0
                        ? zonasPrezo["esquerda"] + ' €'
                        : zonasPrezo["esquerda"].toFixed(2) + ' €')
                    : ''
                  : evento?.prezo_pvp > 0
                    ? (Number(evento.prezo_pvp) % 1 === 0
                        ? Number(evento.prezo_pvp) + ' €'
                        : Number(evento.prezo_pvp).toFixed(2) + ' €')
                    : null}
              </div>
            </button>
            <button className="zona central" onClick={() => handleZonaClick("central")}> 
              CENTRAL
              <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                {evento?.prezo_areas
                  ? zonasPrezo["central"] !== undefined
                    ? (Number(zonasPrezo["central"]) % 1 === 0
                        ? zonasPrezo["central"] + ' €'
                        : zonasPrezo["central"].toFixed(2) + ' €')
                    : ''
                  : evento?.prezo_pvp > 0
                    ? (Number(evento.prezo_pvp) % 1 === 0
                        ? Number(evento.prezo_pvp) + ' €'
                        : Number(evento.prezo_pvp).toFixed(2) + ' €')
                    : null}
              </div>
            </button>
            <button className="zona dereita" onClick={() => handleZonaClick("dereita")}> 
              DEREITA
              <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                {evento?.prezo_areas
                  ? zonasPrezo["dereita"] !== undefined
                    ? (Number(zonasPrezo["dereita"]) % 1 === 0
                        ? zonasPrezo["dereita"] + ' €'
                        : zonasPrezo["dereita"].toFixed(2) + ' €')
                    : ''
                  : evento?.prezo_pvp > 0
                    ? (Number(evento.prezo_pvp) % 1 === 0
                        ? Number(evento.prezo_pvp) + ' €'
                        : Number(evento.prezo_pvp).toFixed(2) + ' €')
                    : null}
              </div>
            </button>
          </div>
        </div>
      </div>
      {evento && evento.id ? null : (
        <div style={{ textAlign: 'center', color: '#ff0093', marginTop: 40 }}>
          {error || "Non se atopou o evento."}
        </div>
      )}
    </div>
  );
};

export default SeleccionZonaAuditorio;
