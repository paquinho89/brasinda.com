import React, { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import "../../../estilos/BotonesAuditorios.css";
import "../../../estilos/infoPagamento.css";
import AuditorioVerinAnfiteatro, { AUDITORIO as AUDITORIO_VERIN_ANFITEATRO } from "../Planos/auditorioVerin/anfiteatro";
import AuditorioVerinZonaCentral, { AUDITORIO as AUDITORIO_VERIN_CENTRAL } from "../Planos/auditorioVerin/zonaCentral";
import AuditorioVerinLateralDereita, { AUDITORIO as AUDITORIO_VERIN_DEREITA } from "../Planos/auditorioVerin/zonaLateralDereita";
import AuditorioVerinLateralEsquerda, { AUDITORIO as AUDITORIO_VERIN_ESQUERDA } from "../Planos/auditorioVerin/zonaLateralEsquerda";
import { FaTrash, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from "react-icons/fa";
import { useAuth } from "../../AuthContext";

const API_BASE_URL = "http://localhost:8000";

type Zona = "anfiteatro" | "esquerda" | "central" | "dereita";
type Variant = "rosa" | "verde";

const countSeats = (layout: (number | null)[][]) =>
  layout.flat().filter((seat) => seat !== null).length;

const AFORO_ZONA_VERIN: Record<Zona, number> = {
  anfiteatro: countSeats(AUDITORIO_VERIN_ANFITEATRO),
  esquerda: countSeats(AUDITORIO_VERIN_ESQUERDA),
  central: countSeats(AUDITORIO_VERIN_CENTRAL),
  dereita: countSeats(AUDITORIO_VERIN_DEREITA),
};

const AREA_ACTIVA_DEFAULT: Record<Zona, boolean> = {
  anfiteatro: true,
  esquerda: true,
  central: true,
  dereita: true,
};

const getAreaActivaStorageKey = (eventoId: number) => `auditorio_verin_area_activa_${eventoId}`;

interface SelectedSeat {
  row: number;
  seat: number;
}

interface Props {
  eventoId: number;
  onZonaClick?: (zona: Zona) => void;
  variant?: Variant;
  onEntradasUpdate?: () => void;
  onAforoHabilitadoChange?: (value: number) => void;
  openZonaCentralSignal?: number;
  onEntradasSeleccionadas?: (todasEntradas: any[]) => void;
}

const AuditorioSelectorVerin: React.FC<Props> = ({
  eventoId,
  onZonaClick,
  variant = "rosa",
  onEntradasUpdate,
  onAforoHabilitadoChange,
  openZonaCentralSignal,
  onEntradasSeleccionadas,
}) => {
  // Limpar seleccións ao desmontar (abandonar páxina)
  useEffect(() => {
    return () => {
      if (!eventoId) return;
      const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
      zonas.forEach(zona => {
        const key = `auditorio_verin_selected_${zona}_${eventoId}`;
        localStorage.removeItem(key);
      });
      setEntradasSeleccionadasPorZona({
        anfiteatro: [],
        esquerda: [],
        central: [],
        dereita: [],
      });
    };
  }, [eventoId]);
  const [areaActiva, setAreaActiva] = useState<Record<Zona, boolean>>(AREA_ACTIVA_DEFAULT);
  const [areaActivaHydrated, setAreaActivaHydrated] = useState(false);
  const [zonaSeleccionada, setZonaSeleccionada] = useState<Zona | null>(null);
  const [entradasSeleccionadasPorZona, setEntradasSeleccionadasPorZona] = useState<Record<Zona, SelectedSeat[]>>({
    anfiteatro: [],
    esquerda: [],
    central: [],
    dereita: [],
  });
  const [reservasParaEliminarPorZona, setReservasParaEliminarPorZona] = useState<Record<Zona, SelectedSeat[]>>({
    anfiteatro: [],
    esquerda: [],
    central: [],
    dereita: [],
  });
  const [entradasReservadas, setEntradasReservadas] = useState<SelectedSeat[]>([]);
  const [misReservas, setMisReservas] = useState<SelectedSeat[]>([]);
  const [entradasVendidas, setEntradasVendidas] = useState<SelectedSeat[]>([]);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [showSoldSeatsErrorModal, setShowSoldSeatsErrorModal] = useState(false);
  const [estadoInicialArea, setEstadoInicialArea] = useState<boolean>(true);

  const { token } = useAuth();
  const authToken = token ?? localStorage.getItem("access_token");

  useEffect(() => {
    if (eventoId == null) return;

    try {
      const raw = localStorage.getItem(getAreaActivaStorageKey(eventoId));
      if (!raw) {
        setAreaActiva(AREA_ACTIVA_DEFAULT);
        setAreaActivaHydrated(true);
        return;
      }

      const parsed = JSON.parse(raw) as Partial<Record<Zona, boolean>>;
      setAreaActiva({
        anfiteatro: parsed.anfiteatro ?? true,
        esquerda: parsed.esquerda ?? true,
        central: parsed.central ?? true,
        dereita: parsed.dereita ?? true,
      });
    } catch {
      setAreaActiva(AREA_ACTIVA_DEFAULT);
    } finally {
      setAreaActivaHydrated(true);
    }
  }, [eventoId]);

  useEffect(() => {
    if (eventoId == null || !areaActivaHydrated) return;
    localStorage.setItem(getAreaActivaStorageKey(eventoId), JSON.stringify(areaActiva));
  }, [eventoId, areaActiva, areaActivaHydrated]);

  useEffect(() => {
    if (eventoId == null) return;
    const fetchEntradas = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/`, {
          headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
        });
        await response.json();
      } catch (err) {
        console.error("Erro ao obter entradas dispoñibles:", err);
      }
    };
    fetchEntradas();
  }, [eventoId, token]);

  useEffect(() => {
    if (eventoId == null || !zonaSeleccionada) return;
    const reservasPendentes = reservasParaEliminarPorZona[zonaSeleccionada] || [];
    const fetchReservas = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/crear-eventos/${eventoId}/reservas/?zona=${zonaSeleccionada}`
        );
        const data = await response.json();
        const reservasFiltradas = (data.reservas || []).filter(
          (r: SelectedSeat) => !reservasPendentes.some((p) => p.row === r.row && p.seat === r.seat)
        );
        setEntradasReservadas(reservasFiltradas);
      } catch (err) {
        console.error("Erro ao obter reservas:", err);
      }
    };
    const fetchMisReservas = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/crear-eventos/${eventoId}/mis-reservas/?zona=${zonaSeleccionada}`,
          {
            headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
          }
        );
        const data = await response.json();
        const misReservasFiltradas = (data.mis_reservas || []).filter(
          (r: SelectedSeat) => !reservasPendentes.some((p) => p.row === r.row && p.seat === r.seat)
        );
        setMisReservas(misReservasFiltradas);
      } catch (err) {
        console.error("Erro ao obter miñas reservas:", err);
      }
    };
    fetchReservas();
    fetchMisReservas();
  }, [eventoId, zonaSeleccionada, authToken, reservasParaEliminarPorZona]);

  // Fetchear entradas vendidas (las que están sin organizador)
  useEffect(() => {
    if (eventoId == null || !zonaSeleccionada || variant === "verde") return;
    
    const fetchEntradasVendidas = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/crear-eventos/${eventoId}/reservas-vendidas/?zona=${zonaSeleccionada}`
        );
        const data = await response.json();
        const vendidasFiltradas = (data.reservas || []).filter(
          (r: SelectedSeat) => !reservasParaEliminarPorZona[zonaSeleccionada]?.some((p) => p.row === r.row && p.seat === r.seat)
        );
        setEntradasVendidas(vendidasFiltradas);
      } catch (err) {
        console.error("Erro ao obter entradas vendidas:", err);
      }
    };
    
    fetchEntradasVendidas();
  }, [eventoId, zonaSeleccionada, variant, reservasParaEliminarPorZona]);

  useEffect(() => {
    if (!onAforoHabilitadoChange) return;
    const habilitado =
      (areaActiva.anfiteatro ? AFORO_ZONA_VERIN.anfiteatro : 0) +
      (areaActiva.esquerda ? AFORO_ZONA_VERIN.esquerda : 0) +
      (areaActiva.central ? AFORO_ZONA_VERIN.central : 0) +
      (areaActiva.dereita ? AFORO_ZONA_VERIN.dereita : 0);
    onAforoHabilitadoChange(habilitado);
  }, [areaActiva, onAforoHabilitadoChange]);

  const handleClick = (zona: Zona) => {
    setZonaSeleccionada(zona);
    setEntradasReservadas([]);
    setMisReservas([]);
    setEstadoInicialArea(areaActiva[zona]);
    // Recuperar selección previa de localStorage
    try {
      const raw = localStorage.getItem(`auditorio_verin_selected_${zona}_${eventoId}`);
      let seleccionadas = [];
      if (raw) {
        seleccionadas = JSON.parse(raw);
      }
      setEntradasSeleccionadasPorZona((prev) => {
        const updated = {
          ...prev,
          [zona]: Array.isArray(seleccionadas) ? seleccionadas : [],
        };
        // Notificar ao pai todas as seleccións de todas as zonas
        if (typeof onEntradasSeleccionadas === "function") {
          const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
          let todasEntradas: any[] = [];
          zonas.forEach(z => {
            const lista = z === zona ? (Array.isArray(seleccionadas) ? seleccionadas : []) : updated[z];
            if (Array.isArray(lista)) {
              todasEntradas = todasEntradas.concat(lista.map((e: any) => ({ ...e, zona: z })));
            }
          });
          onEntradasSeleccionadas(todasEntradas);
        }
        return updated;
      });
    } catch {
      setEntradasSeleccionadasPorZona((prev) => {
        const updated = {
          ...prev,
          [zona]: [],
        };
        if (typeof onEntradasSeleccionadas === "function") {
          const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
          let todasEntradas: any[] = [];
          zonas.forEach(z => {
            const lista = z === zona ? [] : updated[z];
            if (Array.isArray(lista)) {
              todasEntradas = todasEntradas.concat(lista.map((e: any) => ({ ...e, zona: z })));
            }
          });
          onEntradasSeleccionadas(todasEntradas);
        }
        return updated;
      });
    }
    onZonaClick?.(zona);
  };
  // Chamar a onEntradasSeleccionadas ao montar para inicializar SummaryBox, usando o estado en memoria
  useEffect(() => {
    if (!onEntradasSeleccionadas) return;
    const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
    let todasEntradas: any[] = [];
    zonas.forEach(zona => {
      const lista = entradasSeleccionadasPorZona[zona];
      if (Array.isArray(lista)) {
        todasEntradas = todasEntradas.concat(lista.map((e: any) => ({ ...e, zona })));
      }
    });
    onEntradasSeleccionadas(todasEntradas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventoId]);

  // Chamar a onEntradasSeleccionadas só cando cambian as entradas seleccionadas por zona
  useEffect(() => {
    if (!onEntradasSeleccionadas) return;
    const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
    let todasEntradas: any[] = [];
    zonas.forEach(zona => {
      const lista = entradasSeleccionadasPorZona[zona];
      if (Array.isArray(lista)) {
        todasEntradas = todasEntradas.concat(lista.map((e: any) => ({ ...e, zona })));
      }
    });
    onEntradasSeleccionadas(todasEntradas);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entradasSeleccionadasPorZona]);

  useEffect(() => {
    if (!openZonaCentralSignal) return;
    handleClick("central");
  }, [openZonaCentralSignal]);

  const cerrarModal = () => {
    setZonaSeleccionada(null);
    // Non limpar entradasSeleccionadasPorZona aquí para manter o resumo
    setReservasParaEliminarPorZona({
      anfiteatro: [],
      esquerda: [],
      central: [],
      dereita: [],
    });
    setEstadoInicialArea(true);
  };

  const entradasSeleccionadas = zonaSeleccionada
    ? entradasSeleccionadasPorZona[zonaSeleccionada]
    : [];

  const reservasParaEliminar = zonaSeleccionada
    ? reservasParaEliminarPorZona[zonaSeleccionada]
    : [];

  const setEntradasSeleccionadas = (seats: SelectedSeat[]) => {
    if (!zonaSeleccionada) return;
    // Límite de 10 entradas para variant verde (venta de entradas)
    if (variant === "verde" && seats.length > 10) {
      setShowLimitModal(true);
      return;
    }
    setEntradasSeleccionadasPorZona((prev) => {
      const updated = {
        ...prev,
        [zonaSeleccionada]: seats,
      };
      // Gardar en localStorage para que o formulario poida recuperalo
      localStorage.setItem(
        `auditorio_verin_selected_${zonaSeleccionada}_${eventoId}`,
        JSON.stringify(seats)
      );

      // Notificar ao pai todas as seleccións de todas as zonas
      if (typeof onEntradasSeleccionadas === "function") {
        // Xuntar todas as entradas de todas as zonas, engadindo a prop zona
        const zonas: Zona[] = ["anfiteatro", "esquerda", "central", "dereita"];
        let todasEntradas: any[] = [];
        zonas.forEach(zona => {
          const lista = zona === zonaSeleccionada ? seats : updated[zona];
          if (Array.isArray(lista)) {
            todasEntradas = todasEntradas.concat(lista.map((e: any) => ({ ...e, zona })));
          }
        });
        onEntradasSeleccionadas(todasEntradas);
      }
      return updated;
    });
  };

  const getNextZona = (direction: "left" | "right"): Zona | null => {
    if (!zonaSeleccionada) return null;

    // Orde circular: central => dereita => anfiteatro => esquerda => central
    const zonaOrder: Zona[] = ["central", "dereita", "anfiteatro", "esquerda"];
    const currentIndex = zonaOrder.indexOf(zonaSeleccionada);

    if (currentIndex === -1) return null;

    let nextIndex: number;
    if (direction === "right") {
      nextIndex = (currentIndex + 1) % zonaOrder.length;
    } else {
      nextIndex = (currentIndex - 1 + zonaOrder.length) % zonaOrder.length;
    }

    return zonaOrder[nextIndex];
  };

  const handleZoneNavigation = (direction: "left" | "right") => {
    const nextZona = getNextZona(direction);
    if (nextZona) {
      handleClick(nextZona);
    }
  };

  const eliminarMiReserva = async (seat: SelectedSeat) => {
    if (!zonaSeleccionada) return;

    setReservasParaEliminarPorZona((prev) => {
      const xaMarcada = prev[zonaSeleccionada].some(
        (s) => s.row === seat.row && s.seat === seat.seat
      );
      if (xaMarcada) return prev;
      return {
        ...prev,
        [zonaSeleccionada]: [...prev[zonaSeleccionada], seat],
      };
    });

    setMisReservas((prev) =>
      prev.filter((s) => !(s.row === seat.row && s.seat === seat.seat))
    );
    setEntradasReservadas((prev) =>
      prev.filter((s) => !(s.row === seat.row && s.seat === seat.seat))
    );
  };

  const renderEsquema = () => {
    const currentAreaActiva = zonaSeleccionada ? areaActiva[zonaSeleccionada] : true;
    if (!currentAreaActiva) {
      return null;
    }
    const props = {
      selectedSeats: entradasSeleccionadas,
      reservedSeats: variant === "rosa" ? [] : entradasReservadas,
      myReservedSeats: variant === "rosa" ? misReservas : [],
      soldSeats: variant === "rosa" ? entradasVendidas : [],
      onSelectionChange: setEntradasSeleccionadas,
      onMyReservedSeatClick: eliminarMiReserva,
      areaActiva: currentAreaActiva,
      blockReservedSeats: variant === "verde",
    };
    switch (zonaSeleccionada) {
      case "anfiteatro": return <AuditorioVerinAnfiteatro {...props} />;
      case "central": return <AuditorioVerinZonaCentral {...props} />;
      case "esquerda": return <AuditorioVerinLateralEsquerda {...props} />;
      case "dereita": return <AuditorioVerinLateralDereita {...props} />;
      default: return null;
    }
  };

  const eliminarEntrada = (seat: SelectedSeat) => {
    setEntradasSeleccionadas(
      entradasSeleccionadas.filter(
        (s) => !(s.row === seat.row && s.seat === seat.seat)
      )
    );
  };

  const handleAreaToggle = (checked: boolean) => {
    if (!zonaSeleccionada) return;
    
    // Se intentamos desactivar
    if (!checked) {
      // Primeiro revisar se hai entradas vendidas
      if (entradasVendidas.length > 0) {
        setShowSoldSeatsErrorModal(true);
        return;
      }
      
      // Se non hai vendidas pero si hai reservas ou entradas seleccionadas
      if (misReservas.length > 0 || entradasSeleccionadas.length > 0) {
        setShowErrorModal(true);
        return;
      }
    }
    
    setAreaActiva((prev) => ({
      ...prev,
      [zonaSeleccionada]: checked,
    }));
  };

  const handleConfirmDesactivar = () => {
    if (!zonaSeleccionada) return;

    // Marcar todas las reservas existentes para eliminar
    setReservasParaEliminarPorZona((prev) => ({
      ...prev,
      [zonaSeleccionada]: [...misReservas],
    }));

    // Desactivar la zona localmente
    setAreaActiva((prev) => ({
      ...prev,
      [zonaSeleccionada]: false,
    }));

    // Limpiar los estados locales
    setMisReservas([]);
    setEntradasSeleccionadasPorZona((prev) => ({
      ...prev,
      [zonaSeleccionada]: [],
    }));

    setShowErrorModal(false);
  };

  const handleMostrarFormPago = async () => {
    // Só pechar o modal e mostrar o formulario de datos
    cerrarModal();
    // O fluxo de reserva real faise agora dende o formulario de email/nome
  };

  // --- NOVO: Guardar invitacións (organizador) ---
  const [isSaving, setIsSaving] = useState(false);
  const handleGuardarInvitacions = async () => {
    if (!zonaSeleccionada || entradasSeleccionadas.length === 0) {
      alert("Debes seleccionar polo menos unha butaca");
      return;
    }
    if (!eventoId) return;
    const token = localStorage.getItem("access_token");
    setIsSaving(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/reservar/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          entradas: entradasSeleccionadas.map((s) => ({ row: s.row, seat: s.seat })),
          zona: zonaSeleccionada,
          confirmada: true,
        }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        alert(data?.error || "Erro ao gardar invitacións");
        setIsSaving(false);
        return;
      }
      // Limpar localStorage para esa zona
      localStorage.removeItem(`auditorio_verin_selected_${zonaSeleccionada}_${eventoId}`);
      // Limpar selección local
      setEntradasSeleccionadasPorZona((prev) => ({ ...prev, [zonaSeleccionada]: [] }));
      // Refrescar UI
      if (typeof onEntradasUpdate === "function") onEntradasUpdate();
      if (typeof onEntradasSeleccionadas === "function") onEntradasSeleccionadas([]);
      cerrarModal();
    } catch (e) {
      alert("Erro ao gardar invitacións");
    } finally {
      setIsSaving(false);
    }
  };

  const currentAreaActiva = zonaSeleccionada ? areaActiva[zonaSeleccionada] : true;

  return (
    <div className={`auditorio-container ${variant}`}>
      {/* BOTONES DE ZONA */}
      <button
        className={`zona anfiteatro ${areaActiva.anfiteatro ? "" : "zona-inactiva"}`}
        onClick={() => handleClick("anfiteatro")}
      >
        <div>ANFITEATRO</div>
        {variant === "rosa" && (
          <div className="zona-estado-interno">{areaActiva.anfiteatro ? "(Activa)" : "(Inactiva)"}</div>
        )}
      </button>
      <div className="platea">
        <button
          className={`zona esquerda ${areaActiva.esquerda ? "" : "zona-inactiva"}`}
          onClick={() => handleClick("esquerda")}
        >
          <div>ESQUERDA</div>
          {variant === "rosa" && (
            <div className="zona-estado-interno">{areaActiva.esquerda ? "(Activa)" : "(Inactiva)"}</div>
          )}
        </button>
        <div className="zona-central-wrapper">
          <button
            className={`zona central ${areaActiva.central ? "" : "zona-inactiva"}`}
            onClick={() => handleClick("central")}
          >
            <div>CENTRAL</div>
            {variant === "rosa" && (
              <div className="zona-estado-interno">{areaActiva.central ? "(Activa)" : "(Inactiva)"}</div>
            )}
          </button>
          <div className="indicador-escenario">ESCENARIO</div>
        </div>
        <button
          className={`zona dereita ${areaActiva.dereita ? "" : "zona-inactiva"}`}
          onClick={() => handleClick("dereita")}
        >
          <div>DEREITA</div>
          {variant === "rosa" && (
            <div className="zona-estado-interno">{areaActiva.dereita ? "(Activa)" : "(Inactiva)"}</div>
          )}
        </button>
      </div>

      {/* MODAL */}
      {zonaSeleccionada && (
        <div className="modal-backdrop">
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            {/* HEADER */}
            <div className="modal-header-custom">
              <div className="modal-title-group">
                <div className="modal-title-nav">
                  <button
                    type="button"
                    className="zona-nav-btn"
                    onClick={() => handleZoneNavigation("left")}
                    aria-label="Ir á zona anterior"
                  >
                    <FaChevronLeft />
                  </button>
                  <h4 className="modal-title">{zonaSeleccionada.toUpperCase()}</h4>
                  <button
                    type="button"
                    className="zona-nav-btn"
                    onClick={() => handleZoneNavigation("right")}
                    aria-label="Ir á zona seguinte"
                  >
                    <FaChevronRight />
                  </button>
                </div>
                {variant === "rosa" && (
                  <p className="modal-subtitle">*As entradas que reserves, non se porán a venda</p>
                )}
              </div>
              <button className="close-x" onClick={cerrarModal}>✕</button>
            </div>

            {/* SWITCH AREA - Debaixo do texto e centrado (só para variant rosa) */}
            {variant === "rosa" && (
              <>
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", paddingBottom: "15px" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                    <button
                      type="button"
                      className={`badge-prezo badge-prezo--clickable ${currentAreaActiva ? "badge-prezo--active" : "badge-prezo--inactive"}`}
                      onClick={() => handleAreaToggle(!currentAreaActiva)}
                    >
                      {currentAreaActiva ? "Zona Activa" : "Zona Inactiva"}
                    </button>
                    <label className="toggle-area-label mt-2">
                      <input type="checkbox" checked={currentAreaActiva} onChange={e => handleAreaToggle(e.target.checked)} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
              </>
            )}
            

            {/* BODY */}
            <div className="modal-body-custom">
              {renderEsquema()}

              {/* BOTONES */}
              <div style={{ marginTop: 20, marginBottom: 20, display: "flex", gap: "10px", justifyContent: "space-between" }}>
                <button className={variant === "verde" ? "volver-verde-btn" : "volver-btn"} onClick={cerrarModal}>
                  Cerrar
                </button>
                {variant === "rosa" ? (
                  <button
                    className="reserva-entrada-btn"
                    onClick={handleGuardarInvitacions}
                    disabled={entradasSeleccionadas.length === 0 || isSaving}
                  >
                    {isSaving ? "Gardando..." : "Gardar invitacións"}
                  </button>
                ) : (
                  <button
                    className="reserva-entrada-btn"
                    onClick={handleMostrarFormPago}
                    disabled={entradasSeleccionadas.length === 0 && reservasParaEliminar.length === 0 && (zonaSeleccionada ? areaActiva[zonaSeleccionada] === estadoInicialArea : true)}
                  >
                    {`Escoller ${entradasSeleccionadas.length} entradas`}
                  </button>
                )}
              </div>

              {/* LISTADO DE ENTRADAS (SELECCIONADAS + MIÑAS RESERVAS) */}
              {(entradasSeleccionadas.length > 0 || (variant === "rosa" && misReservas.length > 0)) && (
                <div style={{ marginTop: 20 }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "center", boxShadow: "0 4px 8px rgba(0,0,0,0.1)" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f0f0f0" }}>
                        <th style={{ padding: "8px", fontWeight: 700 }}>Fila</th>
                        <th style={{ padding: "8px", fontWeight: 700 }}>Butaca</th>
                        <th style={{ padding: "8px", fontWeight: 700 }}></th>
                      </tr>
                    </thead>
                    <tbody>
                      {variant === "rosa" && misReservas.filter(s => !entradasVendidas.some(v => v.row === s.row && v.seat === s.seat)).map(s => (
                        <tr key={`${s.row}-${s.seat}-reservada`} style={{ backgroundColor: "#fff" }}>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.row}</td>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.seat}</td>
                          <td style={{ padding: "8px" }}>
                            <button className="eliminar-btn" onClick={e => { e.stopPropagation(); eliminarMiReserva(s); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "black", fontSize: "16px" }}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                      {entradasSeleccionadas.map(s => (
                        <tr key={`${s.row}-${s.seat}`} style={{ backgroundColor: "#fff" }}>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.row}</td>
                          <td style={{ padding: "8px", fontWeight: 700, color: "#444" }}>{s.seat}</td>
                          <td style={{ padding: "8px" }}>
                            <button className="eliminar-btn" onClick={e => { e.stopPropagation(); eliminarEntrada(s); }} style={{ background: "transparent", border: "none", cursor: "pointer", color: "black", fontSize: "16px" }}>
                              <FaTrash />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL DE ERROR - ENTRADAS VENDIDAS */}
      <Modal show={showSoldSeatsErrorModal} onHide={() => setShowSoldSeatsErrorModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }} className="modal-header-confirm">
          <Modal.Title style={{ color: "#ff0093", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaExclamationTriangle style={{ color: "#ff0093" }} />
            Non se pode Desactivar
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px", textAlign: "left", color: "#333" }}>
          <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "0" }}>
            Non podes desactivar a zona <strong>{zonaSeleccionada && `${zonaSeleccionada.charAt(0).toUpperCase() + zonaSeleccionada.slice(1)}`}</strong> porque hai ao menos unha entrada vendida. Contacta co cliente ou espera a que expire a venta.
          </p>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #ccc", display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="volver-btn"
            onClick={() => setShowSoldSeatsErrorModal(false)}
          >
            Entendido
          </button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DE CONFIRMACIÓN - DESACTIVAR ZONA */}
      <Modal show={showErrorModal} onHide={() => setShowErrorModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }} className="modal-header-confirm">
          <Modal.Title style={{ color: "#000", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaExclamationTriangle style={{ color: "#000" }} />
            Aviso!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px", textAlign: "left", color: "#333" }}>
          <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "0" }}>
            Se desactivas a área perderás as entradas que tes reservadas para a Zona {zonaSeleccionada && `${zonaSeleccionada.charAt(0).toUpperCase() + zonaSeleccionada.slice(1)}`}
          </p>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #ccc", display: "flex", justifyContent: "space-between" }}>
          <button
            type="button"
            className="volver-btn"
            onClick={() => setShowErrorModal(false)}
          >
            Volver
          </button>
          <button
            type="button"
            className="reserva-entrada-btn"
            onClick={handleConfirmDesactivar}
          >
            Desactivar área
          </button>
        </Modal.Footer>
      </Modal>

      {/* MODAL DE LÍMITE DE ENTRADAS */}
      <Modal show={showLimitModal} onHide={() => setShowLimitModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }}>
          <Modal.Title style={{ color: "#28a745", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaExclamationTriangle style={{ color: "#28a745" }} />
            Límite de Entradas
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px", textAlign: "center", color: "#333" }}>
          <p style={{ fontSize: "16px", lineHeight: "1.6", marginBottom: "0" }}>
            O máximo número de entradas que podes comprar é <strong>10</strong>
          </p>
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #ccc", display: "flex", justifyContent: "center" }}>
          <button
            type="button"
            className="volver-verde-btn"
            onClick={() => setShowLimitModal(false)}
          >
            Entendido
          </button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AuditorioSelectorVerin;