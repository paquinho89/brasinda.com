import React, { useEffect, useState } from "react";
import { Modal } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from "react-icons/fa";
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
  const [selectedSeats, setSelectedSeats] = useState<{ row: number; seat: number }[]>([]);
  const MAX_SEATS = 15;
  // Modal state for max seats
  const [showMaxSeatsModal, setShowMaxSeatsModal] = useState(false);
  const handleSelectionChange = (newSeats: { row: number; seat: number }[]) => {
    if (newSeats.length > MAX_SEATS) {
      setShowMaxSeatsModal(true);
      return;
    }
    setSelectedSeats(newSeats);
  };
  // Eliminado o flag localStorageRestaurado para evitar condicións de carreira

  // Eliminado: Non limpar seleccións ao entrar dende SeleccionZonaAuditorio


  // Ao cambiar de zona, gardar a selección da zona anterior e cargar a da nova
  // Gardar sempre a selección da zona actual antes de cambiar de zona ou navegar atrás
  useEffect(() => {
    if (!id || !zona) return;
    // Cargar a selección da nova zona
    const key = `auditorio_verin_selected_${zona}_${id}`;
    const raw = localStorage.getItem(key);
    console.log('[DEBUG] getItem (on zona change)', key, raw);
    if (raw) {
      try {
        const lista = JSON.parse(raw);
        if (Array.isArray(lista)) {
          console.log('[DEBUG] setSelectedSeats (from localStorage)', lista);
          setSelectedSeats(lista);
          return;
        }
      } catch (e) { console.log('[DEBUG] JSON parse error', e); }
    }
    console.log('[DEBUG] setSelectedSeats([]) (no data found)');
    setSelectedSeats([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, zona]);

  // Eliminado efecto beforeunload: agora só se garda nos handlers dos botóns

  // Eliminado o useEffect extra, xa non é necesario

  // Gardar seleccións no localStorage cando cambian, mantendo as doutras zonas
  useEffect(() => {
    if (!id || !zona) return;
    const zonas = ["central", "dereita", "anfiteatro", "esquerda"];
    // Recuperar todas as seleccións actuais
    let todas: { [zona: string]: any[] } = {};
    zonas.forEach(z => {
      const key = `auditorio_verin_selected_${z}_${id}`;
      const raw = localStorage.getItem(key);
      if (raw) {
        try {
          const lista = JSON.parse(raw);
          if (Array.isArray(lista)) todas[z] = lista;
        } catch {}
      }
    });
    // Actualizar só a zona actual
    todas[zona] = selectedSeats;
    // Gardar todas as zonas
    zonas.forEach(z => {
      const key = `auditorio_verin_selected_${z}_${id}`;
      console.log('[DEBUG] setItem (on selectedSeats change)', key, todas[z] || []);
      localStorage.setItem(key, JSON.stringify(todas[z] || []));
    });
  }, [selectedSeats, id, zona]);
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
  const commonProps = {
    reservedSeats,
    blockReservedSeats: true,
    selectedSeats,
    onSelectionChange: handleSelectionChange,
  };
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

  // Navegación circular segura
  const zonaActualIndex = zonas.indexOf(zona || "");
  const zonaEsquerda = zonaActualIndex === -1 ? null : zonas[(zonaActualIndex - 1 + zonas.length) % zonas.length];
  const zonaDereita = zonaActualIndex === -1 ? null : zonas[(zonaActualIndex + 1) % zonas.length];

  return (
    <div style={{ minHeight: "100vh", background: "#f8f9fa" }}>
      <MainNavbar />
      <div style={{ maxWidth: 700, margin: "0 auto", padding: 32 }}>
        {loading ? (
          <div style={{ textAlign: "center", margin: 40 }}>Cargando butacas reservadas...</div>
        ) : (
          <>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18, gap: 16 }}>
              {zonaActualIndex !== -1 && zonaEsquerda && (
                <button
                  aria-label="Ir á área anterior"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 4 }}
                  onClick={() => {
                    if (id && zona && zonaEsquerda) {
                      // Gardar seleccións da zona actual antes de cambiar
                      const key = `auditorio_verin_selected_${zona}_${id}`;
                      console.log('[DEBUG] setItem (on zona nav)', key, selectedSeats);
                      localStorage.setItem(key, JSON.stringify(selectedSeats));
                      navigate(`/reservar-entrada-auditorio/${id}/${zonaEsquerda}`);
                    }
                  }}
                >
                  <FaChevronLeft />
                </button>
              )}
              <h2 style={{ margin: 0, minWidth: 100, textAlign: "center" }}>{zonaTitulo}</h2>
              {zonaActualIndex !== -1 && zonaDereita && (
                <button
                  aria-label="Ir á área seguinte"
                  style={{ background: "none", border: "none", cursor: "pointer", fontSize: 22, padding: 4 }}
                  onClick={() => {
                    if (id && zona && zonaDereita) {
                      // Gardar seleccións da zona actual antes de cambiar
                      const key = `auditorio_verin_selected_${zona}_${id}`;
                      console.log('[DEBUG] setItem (on zona nav)', key, selectedSeats);
                      localStorage.setItem(key, JSON.stringify(selectedSeats));
                      navigate(`/reservar-entrada-auditorio/${id}/${zonaDereita}`);
                    }
                  }}
                >
                  <FaChevronRight />
                </button>
              )}
            </div>
            <div style={{ marginBottom: 24 }}>{ZonaComponent}</div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 32 }}>
              <button className="boton-avance" onClick={() => {
                if (id && zona) {
                  // Gardar seleccións da zona actual antes de navegar atrás
                  const key = `auditorio_verin_selected_${zona}_${id}`;
                  console.log('[DEBUG] setItem (on volver)', key, selectedSeats);
                  localStorage.setItem(key, JSON.stringify(selectedSeats));
                  navigate(`/reservar-entrada-auditorio/${id}`);
                }
              }}>
                <FaArrowLeft style={{ marginRight: 8 }} /> Volver
              </button>
              <button
                className="reserva-entrada-btn"
                disabled={selectedSeats.length === 0}
                onClick={() => {
                  if (selectedSeats.length === 0) return;
                  if (id) {
                    // Gardar as seleccións actuais da zona no localStorage
                    const key = `auditorio_verin_selected_${zona}_${id}`;
                    console.log('[DEBUG] setItem (on continuar)', key, selectedSeats);
                    localStorage.setItem(key, JSON.stringify(selectedSeats));
                    // Recuperar todas as seleccións de todas as zonas
                    const zonas = ["central", "dereita", "anfiteatro", "esquerda"];
                    let todas: any[] = [];
                    zonas.forEach(z => {
                      const key = `auditorio_verin_selected_${z}_${id}`;
                      const raw = localStorage.getItem(key);
                      if (raw) {
                        try {
                          const lista = JSON.parse(raw);
                          if (Array.isArray(lista)) {
                            lista.forEach((b: any) => {
                              if (b && typeof b.row === "number" && typeof b.seat === "number") {
                                todas.push({ ...b, zona: z });
                              }
                            });
                          }
                        } catch {}
                      }
                    });
                    // Pasar tamén a última zona visitada
                    navigate(`/reservar-entrada-con-plano/${id}/${zona || "central"}`,
                      { state: { butacasSeleccionadas: todas, ultimaZonaVisitada: zona } }
                    );
                  }
                }}
              >
                Continuar
              </button>
            </div>
            {/* Modal for max seats */}
            <Modal show={showMaxSeatsModal} onHide={() => setShowMaxSeatsModal(false)} centered>
              <Modal.Header closeButton>
                <Modal.Title>
                  <FaExclamationTriangle style={{ fontSize: 22, color: "#ff0093", marginRight: 8, marginBottom: 3 }} />
                  Límite de 15 butacas
                </Modal.Title>
              </Modal.Header>
              <Modal.Footer style={{ background: "#fff" }}>
                <button className="reserva-entrada-btn" onClick={() => setShowMaxSeatsModal(false)}>
                  Entendido
                </button>
              </Modal.Footer>
            </Modal>
          </>
        )}
      </div>
    </div>
  );
};

export default SeleccionButacaAuditorio;
