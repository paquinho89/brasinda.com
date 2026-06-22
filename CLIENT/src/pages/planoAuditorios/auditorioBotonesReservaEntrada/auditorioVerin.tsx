import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";

type Zona = "anfiteatro" | "esquerda" | "central" | "dereita";

const AREA_ACTIVA_DEFAULT: Record<Zona, boolean> = {
  anfiteatro: true,
  esquerda: true,
  central: true,
  dereita: true,
};

const getAreaActivaStorageKey = (eventoId: string | number) => `auditorio_verin_area_activa_${eventoId}`;

interface ReservaEntradaBotonesVerinProps {
  evento?: any;
}

export default function ReservaEntradaBotonesVerin({ evento: eventoProp }: ReservaEntradaBotonesVerinProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams<{ id?: string }>();
  const zonasPrezo: Record<string, number> = {};
  const evento = eventoProp || location.state?.evento || null;
  const eventoId = evento?.id ?? id;
  const [areaActiva, setAreaActiva] = useState<Record<Zona, boolean>>(AREA_ACTIVA_DEFAULT);

  useEffect(() => {
    if (!eventoId) return;
    const raw = localStorage.getItem(getAreaActivaStorageKey(eventoId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as Partial<Record<Zona, boolean>>;
      setAreaActiva({
        anfiteatro: parsed.anfiteatro ?? true,
        esquerda: parsed.esquerda ?? true,
        central: parsed.central ?? true,
        dereita: parsed.dereita ?? true,
      });
    } catch {
      // ignore invalid stored data
    }
  }, [eventoId]);

  // Manter seleccións de butacas entre pantallas usando localStorage
  function handleZonaClick(zona: Zona) {
    if (!eventoId || !areaActiva[zona]) return;
    navigate(`/reservar-entrada-auditorio/${eventoId}/${zona}`);
  }

return (
<div className="auditorio-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <button
            className={`zona anfiteatro ${areaActiva.anfiteatro ? "" : "zona-inactiva"}`}
            style={{ margin: "0 auto 25px auto" }}
            onClick={() => handleZonaClick("anfiteatro")}
            disabled={!areaActiva.anfiteatro}
          > 
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
            <button
              className={`zona esquerda ${areaActiva.esquerda ? "" : "zona-inactiva"}`}
              onClick={() => handleZonaClick("esquerda")}
              disabled={!areaActiva.esquerda}
            > 
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
            <button
              className={`zona central ${areaActiva.central ? "" : "zona-inactiva"}`}
              onClick={() => handleZonaClick("central")}
              disabled={!areaActiva.central}
            > 
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
            <button
              className={`zona dereita ${areaActiva.dereita ? "" : "zona-inactiva"}`}
              onClick={() => handleZonaClick("dereita")}
              disabled={!areaActiva.dereita}
            > 
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