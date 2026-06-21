import React, { useState } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

interface ReservaEntradaBotonesVerinProps {
  evento?: any;
}

export default function ReservaEntradaBotonesVerin({ evento: eventoProp }: ReservaEntradaBotonesVerinProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const [zonasPrezo, setZonasPrezo] = useState<Record<string, number>>({});
  const evento = eventoProp || location.state?.evento || null;

  // Manter seleccións de butacas entre pantallas usando localStorage
  function handleZonaClick(zona: string) {
    if (!id) return;
    navigate(`/reservar-entrada-auditorio/${id}/${zona}`);
  }

return (
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
              ESQUERDAA
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
)
}