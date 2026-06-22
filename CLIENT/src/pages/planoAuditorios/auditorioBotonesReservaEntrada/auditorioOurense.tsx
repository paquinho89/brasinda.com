import { useState, useEffect } from "react";
import { useNavigate, useLocation, useParams } from "react-router-dom";
import "../../../estilos/BotonesAuditorioZona-Butaca.css";

type Zona = "anfiteatroEsquerda" | "anfiteatroCentral" | "anfiteatroDereita" | "esquerda" | "central" | "dereita";

const AREA_ACTIVA_DEFAULT: Record<Zona, boolean> = {
  anfiteatroEsquerda: true,
  anfiteatroCentral: true,
  anfiteatroDereita: true,
  esquerda: true,
  central: true,
  dereita: true,
};

const getAreaActivaStorageKey = (eventoId: string | number) => `auditorio_ourense_area_activa_${eventoId}`;

interface ReservaEntradaBotonesOurenseProps {
  evento?: any;
}

export default function ReservaEntradaBotonesOurense({ evento: eventoProp }: ReservaEntradaBotonesOurenseProps) {
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
        anfiteatroEsquerda: parsed.anfiteatroEsquerda ?? true,
        anfiteatroCentral: parsed.anfiteatroCentral ?? true,
        anfiteatroDereita: parsed.anfiteatroDereita ?? true,
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
    navigate(`/reservar-entrada-auditorio/${eventoId}/${zona}`, {
      state: {
        localizacion: evento?.localizacion,
      },
    });
  }

return (
<div className="auditorio-container" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", width: "100%" }}>
          <div className="anfiteatro-row" style={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap", width: "100%", marginBottom: 25 }}>
            <button
              className={`zona anfiteatro ${areaActiva.anfiteatroEsquerda ? "" : "zona-inactiva"}`}
              style={{ width: 130, minWidth: 130, margin: 2 }}
              onClick={() => handleZonaClick("anfiteatroEsquerda")}
              disabled={!areaActiva.anfiteatroEsquerda}
            > 
              ANFITEATRO ESQ.
              <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                {evento?.prezo_areas
                  ? zonasPrezo["anfiteatroEsquerda"] !== undefined
                    ? (Number(zonasPrezo["anfiteatroEsquerda"]) % 1 === 0
                        ? zonasPrezo["anfiteatroEsquerda"] + ' €'
                        : zonasPrezo["anfiteatroEsquerda"].toFixed(2) + ' €')
                    : ''
                  : evento?.prezo_pvp > 0
                    ? (Number(evento.prezo_pvp) % 1 === 0
                        ? Number(evento.prezo_pvp) + ' €'
                        : Number(evento.prezo_pvp).toFixed(2) + ' €')
                    : null}
              </div>
            </button>
            <button
              className={`zona anfiteatro ${areaActiva.anfiteatroCentral ? "" : "zona-inactiva"}`}
              style={{ width: 220, minWidth: 220, margin: 2 }}
              onClick={() => handleZonaClick("anfiteatroCentral")}
              disabled={!areaActiva.anfiteatroCentral}
            > 
              ANFITEATRO
              <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                {evento?.prezo_areas
                  ? zonasPrezo["anfiteatroCentral"] !== undefined
                    ? (Number(zonasPrezo["anfiteatroCentral"]) % 1 === 0
                        ? zonasPrezo["anfiteatroCentral"] + ' €'
                        : zonasPrezo["anfiteatroCentral"].toFixed(2) + ' €')
                    : ''
                  : evento?.prezo_pvp > 0
                    ? (Number(evento.prezo_pvp) % 1 === 0
                        ? Number(evento.prezo_pvp) + ' €'
                        : Number(evento.prezo_pvp).toFixed(2) + ' €')
                    : null}
              </div>
            </button>
            <button
              className={`zona anfiteatro ${areaActiva.anfiteatroDereita ? "" : "zona-inactiva"}`}
              style={{ width: 130, minWidth: 130, margin: 0 }}
              onClick={() => handleZonaClick("anfiteatroDereita")}
              disabled={!areaActiva.anfiteatroDereita}
            > 
              ANFITEATRO DER.
              <div style={{ fontSize: 15, color: '#009688', fontWeight: 600, lineHeight: 1, marginTop: 2 }}>
                {evento?.prezo_areas
                  ? zonasPrezo["anfiteatroDereita"] !== undefined
                    ? (Number(zonasPrezo["anfiteatroDereita"]) % 1 === 0
                        ? zonasPrezo["anfiteatroDereita"] + ' €'
                        : zonasPrezo["anfiteatroDereita"].toFixed(2) + ' €')
                    : ''
                  : evento?.prezo_pvp > 0
                    ? (Number(evento.prezo_pvp) % 1 === 0
                        ? Number(evento.prezo_pvp) + ' €'
                        : Number(evento.prezo_pvp).toFixed(2) + ' €')
                    : null}
              </div>
            </button>
          </div>
          <div className="platea" style={{ display: "flex", justifyContent: "center", gap: 15 }}>
            <button
              className={`zona esquerda ${areaActiva.esquerda ? "" : "zona-inactiva"}`}
              onClick={() => handleZonaClick("esquerda")}
              disabled={!areaActiva.esquerda}
            > 
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