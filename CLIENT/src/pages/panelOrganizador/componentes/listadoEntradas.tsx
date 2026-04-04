// Engadir función para descargar PDF dunha invitación
import API_BASE_URL from "../../../utils/api";
function handleDownloadInvitacionPdf(invitacionId: number) {
  window.open(`${API_BASE_URL}/eventos/descargar-pdf-invitacion/${invitacionId}`, '_blank');
}
import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import { Modal } from "react-bootstrap";
import MainNavbar from "../../componentes/NavBar";
import { FaArrowLeft, FaTrash, FaEdit, FaTimes, FaEnvelope, FaPrint, FaCheckCircle } from "react-icons/fa";

interface InvitacionData {
  id: number;
  zona: string;
  fila: number | null;
  butaca: number | null;
  nome_titular: string | null;
  lugar_entrada: string | null;
  prezo_entrada: string | null;
  tipo_reserva: string;
  estado: string;
  data_creacion: string | null;
  email: string | null;
  codigo_validacion: string | null;
}

export default function ListadoEntradas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [invitacionsData, setInvitacionsData] = useState<InvitacionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filterZona, setFilterZona] = useState<string>("");
  const [filterTipoReserva, setFilterTipoReserva] = useState<string>("");
  const [eventoNome, setEventoNome] = useState<string>("");
  const [esSinPlano, setEsSinPlano] = useState<boolean>(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingNome, setEditingNome] = useState<string>("");
  const editingInputRef = useRef<HTMLInputElement | null>(null);
  // Email modal state
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailToSend, setEmailToSend] = useState("");
  const [currentInvitacion, setCurrentInvitacion] = useState<InvitacionData | null>(null);
  const [nomeTitularToSend, setNomeTitularToSend] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);

  // Validación básica de email
  function isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function handleEnviarInvitacionEmail(invitacion: InvitacionData) {
    setCurrentInvitacion(invitacion);
    setEmailToSend(invitacion.email || "");
    // Show input if nome_titular is null, empty, or 'Invitación'
    const needsNomeInput = !invitacion.nome_titular || invitacion.nome_titular.trim() === '' || invitacion.nome_titular === 'Invitación';
    setNomeTitularToSend(needsNomeInput ? '' : (invitacion.nome_titular || ''));
    setShowEmailModal(true);
  }
  function handleCloseEmailModal() {
    setShowEmailModal(false);
    setCurrentInvitacion(null);
    setNomeTitularToSend("");
  }
  async function handleSendEmail() {
    if (!currentInvitacion) return;
    const needsNomeInput = !currentInvitacion.nome_titular || currentInvitacion.nome_titular.trim() === '' || currentInvitacion.nome_titular === 'Invitación';
    if (!isValidEmail(emailToSend)) {
      alert("Introduce un email válido.");
      return;
    }
    if (needsNomeInput && !nomeTitularToSend.trim()) {
      alert("Por favor, introduce o nome do titular.");
      return;
    }
    setSendingEmail(true);
    try {
      const response = await fetch(`${API_BASE_URL}/crear-eventos/enviar_invitacion_individual/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reserva_id: currentInvitacion.id,
          email_destinatario: emailToSend,
          nome_titular: needsNomeInput ? nomeTitularToSend : currentInvitacion.nome_titular,
        }),
      });
      if (response.ok) {
        setSuccessMessage("Entradas enviadas correctamente");
      } else {
        const data = await response.json().catch(() => ({}));
        alert(data.error || "Erro ao enviar a invitación");
      }
    } catch (e) {
      alert("Erro de conexión ao enviar a invitación");
    } finally {
      setSendingEmail(false);
      setShowEmailModal(false);
      setCurrentInvitacion(null);
      setNomeTitularToSend("");
    }
  }
  // Pechar edición ao facer clic fóra do input
  useEffect(() => {
    if (editingId === null) return;
    function handleClickOutside(e: MouseEvent) {
      if (editingInputRef.current && !editingInputRef.current.contains(e.target as Node)) {
        handleCancelarEdicion();
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [editingId]);

  useEffect(() => {
    fetchInvitacionsData();
  }, [id]);

  useEffect(() => {
      if (successMessage) {
        const timer = setTimeout(() => setSuccessMessage(null), 5000);
        return () => clearTimeout(timer);
      }
    }, [successMessage]);

  useEffect(() => {
    // Cambiar o título da páxina co nome do evento para a impresión
    if (eventoNome) {
      const originalTitle = document.title;
      document.title = `Listado Invitacións - ${eventoNome}`;
      
      // Restaurar o título orixinal ao desmontar
      return () => {
        document.title = originalTitle;
      };
    }
  }, [eventoNome]);

  const fetchInvitacionsData = async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem("access_token");
      
      // Obter datos do evento para o nome
      const respEvento = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (respEvento.ok) {
        const dataEvento = await respEvento.json();
        setEventoNome(dataEvento.nome_evento);
      }

      // Obter todas as invitacións do organizador
      const respInvitacions = await fetch(
        `${API_BASE_URL}/crear-eventos/${id}/listado-invitacions/`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );

      if (!respInvitacions.ok) {
        throw new Error("Erro ao cargar invitacións");
      }

      const dataInvitacions = await respInvitacions.json();
      setInvitacionsData(dataInvitacions.invitacions || []);

      // Detectar si es evento sin plano
      const invitacions = dataInvitacions.invitacions || [];
      const esSinPlano = invitacions.length === 0 || invitacions.every((inv: InvitacionData) => inv.zona === "sen-plano");
      setEsSinPlano(esSinPlano);

    } catch (e: any) {
      console.error("Error fetching invitacions data:", e);
      setError("Erro ao cargar datos de invitacións");
    } finally {
      setLoading(false);
    }
  };

  const handleEliminarInvitacion = async (invitacionId: number) => {
    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(
        `${API_BASE_URL}/crear-eventos/${id}/invitacions/${invitacionId}/`,
        {
          method: "DELETE",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        }
      );

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        console.error(data?.error || "Erro ao eliminar invitación");
        return;
      }

      // Recargar datos después de eliminar
      fetchInvitacionsData();
    } catch (e: any) {
      console.error(e.message || "Erro ao eliminar invitación");
    }
  };

  const handleEditarInvitacion = (invitacionId: number, nomeActual: string | null) => {
    setEditingId(invitacionId);
    setEditingNome(nomeActual || "");
  };

  const handleGuardarEdicion = async () => {
    if (editingId === null) return;

    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(
        `${API_BASE_URL}/crear-eventos/${id}/invitacions/${editingId}/`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ nome_titular: editingNome }),
        }
      );

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        console.error(data?.error || "Erro ao actualizar invitación");
        return;
      }

      // Actualizar os datos localmente
      setInvitacionsData(invitacionsData.map(inv => 
        inv.id === editingId ? { ...inv, nome_titular: editingNome } : inv
      ));
      
      setEditingId(null);
      setEditingNome("");
    } catch (e: any) {
      console.error(e.message || "Erro ao actualizar invitación");
    }
  };

  const handleCancelarEdicion = () => {
    setEditingId(null);
    setEditingNome("");
  };

  const invitacionsFiltradas = invitacionsData
    .filter((invitacion) => {
      const tipoMatch = filterTipoReserva === "" || invitacion.tipo_reserva === filterTipoReserva;
      if (esSinPlano) {
        // Só tipo de reserva para eventos sen plano
        return tipoMatch;
      } else {
        // Zona e tipo de reserva para eventos con plano
        const zonaMatch = filterZona === "" || invitacion.zona === filterZona;
        return zonaMatch && tipoMatch;
      }
    })
    .slice() // copy to avoid mutating state
    .sort((a, b) => {
      const codeA = (a.codigo_validacion || '').toLowerCase();
      const codeB = (b.codigo_validacion || '').toLowerCase();
      if (codeA < codeB) return -1;
      if (codeA > codeB) return 1;
      return 0;
    });

  const zonasDisponibles = Array.from(new Set(invitacionsData.map((e) => e.zona)));
  
  const tiposReservaDisponibles = Array.from(new Set(invitacionsData.map((e) => e.tipo_reserva)));

  const formatZonaDisplay = (zona: string) => {
    if (zona === "sen-plano") return "Sen Plano";
    return zona.charAt(0).toUpperCase() + zona.slice(1);
  };

  const formatTipoReservaDisplay = (tipo: string) => {
    return tipo === "invitacion" ? "Invitación" : "Venta";
  };

  return (
    <>
      <style>{`
        @media print {
          @page {
            margin: 0;
            size: auto;
          }
          .no-print {
            display: none !important;
          }
          .d-print-block {
            display: block !important;
          }
          body {
            margin: 15mm 10mm;
            padding: 0;
          }
          .container {
            max-width: 100% !important;
            padding: 0 !important;
          }
          .card {
            border: none !important;
            box-shadow: none !important;
          }
          .table {
            page-break-inside: auto;
          }
          .table tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          .print-header {
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid #333;
          }
        }
      `}</style>
      <div className="no-print">
        {successMessage && (
          <div
            style={{
              position: 'fixed',
              top: 32,
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              background: '#e6ffe6',
              color: '#009900',
              fontWeight: 'bold',
              border: '1px solid #009900',
              borderRadius: 10,
              padding: '18px 32px',
              minWidth: 220,
              maxWidth: 400,
              textAlign: 'center',
              fontSize: 18,
              boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
              pointerEvents: 'none',
              opacity: 0.98,
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
            aria-live="polite"
          >
            <FaCheckCircle style={{ color: '#28a745', fontSize: 22, flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}
        <MainNavbar />
      </div>
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="card-header bg-white border-0 no-print">
            <div className="d-flex align-items-center justify-content-between">
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
              <h2 className="m-0 text-center flex-grow-1" style={{ fontWeight: 700 }}>
                Listado de Asistentes
              </h2>
              {editingId !== null ? (
                <button
                  type="button"
                  className="reserva-entrada-btn"
                  onClick={handleGuardarEdicion}
                >
                  Gardar Cambios
                </button>
              ) : (
                <button
                  type="button"
                  className="reserva-entrada-btn"
                  onClick={() => window.print()}
                >
                  Imprimir
                </button>
              )}
            </div>
            {eventoNome && (
              <p className="text-center text-muted mb-0 mt-2">
                Evento: <strong>{eventoNome}</strong>
              </p>
            )}
          </div>

          <div className="card-body">
            {loading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Cargando...</span>
                </div>
                <p className="mt-2">Cargando datos de invitacións...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            ) : (
              <>
                {/* Filtros e totais: fila única, filtros á esquerda, totais á dereita */}
                <div className="mb-4 no-print">
                  <div style={{ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', width: '100%' }}>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', flex: 1, minWidth: 0 }}>
                      {esSinPlano ? (
                        <div>
                          <label className="form-label fw-bold mb-1">Filtrar por Tipo de Reserva</label>
                          <select
                            className="form-select form-select-sm"
                            style={{ width: '100%' }}
                            value={filterTipoReserva}
                            onChange={(e) => setFilterTipoReserva(e.target.value)}
                          >
                            <option value="">Todos os tipos</option>
                            {tiposReservaDisponibles.map((tipo) => (
                              <option key={tipo} value={tipo}>
                                {formatTipoReservaDisplay(tipo)}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="form-label fw-bold mb-1">Filtrar por Zona</label>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '100%' }}
                              value={filterZona}
                              onChange={(e) => setFilterZona(e.target.value)}
                            >
                              <option value="">Todas as zonas</option>
                              {zonasDisponibles.map((zona) => (
                                <option key={zona} value={zona}>
                                  {formatZonaDisplay(zona)}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="form-label fw-bold mb-1">Filtrar por Tipo de Reserva</label>
                            <select
                              className="form-select form-select-sm"
                              style={{ width: '100%' }}
                              value={filterTipoReserva}
                              onChange={(e) => setFilterTipoReserva(e.target.value)}
                            >
                              <option value="">Todos os tipos</option>
                              {tiposReservaDisponibles.map((tipo) => (
                                <option key={tipo} value={tipo}>
                                  {formatTipoReservaDisplay(tipo)}
                                </option>
                              ))}
                            </select>
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flex: 1, minWidth: 0, justifyContent: 'flex-end' }}>
                      <div style={{ width: '100%' }}>
                        <label className="form-label fw-bold mb-1">Total Invitacións</label>
                        <div className="p-2 bg-light rounded text-center" style={{ width: '100%' }}>
                          <h4 className="mb-0" style={{ color: '#000', fontWeight: 700, fontSize: 18 }}>
                            {invitacionsFiltradas.filter(inv => inv.tipo_reserva === 'invitacion').length}
                          </h4>
                        </div>
                      </div>
                      <div style={{ width: '100%' }}>
                        <label className="form-label fw-bold mb-1">Entradas Vendidas</label>
                        <div className="p-2 bg-light rounded text-center" style={{ width: '100%' }}>
                          <h4 className="mb-0" style={{ color: '#000', fontWeight: 700, fontSize: 18 }}>
                            {invitacionsFiltradas.filter(inv => inv.tipo_reserva === 'venta').length}
                          </h4>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Información de impresión */}
                <div className="d-none d-print-block print-header">
                  {eventoNome && (
                    <p className="mb-0" style={{ fontSize: "16px", fontWeight: 600 }}>
                      Evento: {eventoNome}
                    </p>
                  )}
                </div>

                {/* Táboa de invitacións */}
                <div style={{ overflowX: "auto" }}>
                  <table className="table table-striped table-bordered table-hover">
                    <thead className="table-light">
                      <tr>
                        {esSinPlano ? (
                          <>
                            <th>Nome Titular</th>
                            <th>Email</th>
                            <th>Código Validación</th>
                            <th>Prezo</th>
                            <th>Tipo de Reserva</th>
                            <th className="no-print" style={{ width: "180px" }}></th>
                          </>
                        ) : (
                          <>
                            <th>Zona</th>
                            <th>Fila</th>
                            <th>Butaca</th>
                            <th>Nome Titular</th>
                            <th>Email</th>
                            <th>Código Validación</th>
                            <th>Prezo</th>
                            <th>Tipo de Reserva</th>
                            <th className="no-print" style={{ width: "180px" }}></th>
                          </>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {invitacionsFiltradas.length > 0 ? (
                        invitacionsFiltradas.map((invitacion) => (
                          <tr key={invitacion.id}>
                            {esSinPlano ? (
                              <>
                                <td>
                                  {editingId === invitacion.id ? (
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={editingNome}
                                      onChange={(e) => setEditingNome(e.target.value)}
                                      autoFocus
                                      ref={editingInputRef}
                                    />
                                  ) : (
                                    invitacion.nome_titular || "Invitación"
                                  )}
                                </td>
                                <td>{invitacion.email || "-"}</td>
                                <td>{invitacion.codigo_validacion || "-"}</td>
                                <td>{invitacion.tipo_reserva === "invitacion" ? "-" : `${invitacion.prezo_entrada ?? 0} €`}</td>
                                <td>{formatTipoReservaDisplay(invitacion.tipo_reserva)}</td>
                                <td className="no-print text-center">
                                  <button
                                    style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                    onClick={() => handleDownloadInvitacionPdf(invitacion.id)}
                                    title="Descargar invitación en PDF"
                                  >
                                    <FaPrint color="#000" />
                                  </button>
                                  <button
                                    style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                    onClick={() => handleEnviarInvitacionEmail(invitacion)}
                                    title="Enviar invitación por email"
                                  >
                                    <FaEnvelope color="#000" />
                                  </button>
                                  {invitacion.tipo_reserva === "invitacion" && (
                                    <>
                                      {editingId === invitacion.id ? (
                                        <button
                                          style={{ background: "none", border: "none", color: "red", cursor: "pointer", padding: "4px 8px" }}
                                          onClick={handleCancelarEdicion}
                                          title="Cancelar"
                                        >
                                          <FaTimes />
                                        </button>
                                      ) : (
                                        <>
                                          <button
                                            style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={() => handleEditarInvitacion(invitacion.id, invitacion.nome_titular)}
                                            title="Editar invitación"
                                          >
                                            <FaEdit color="#000" />
                                          </button>
                                          <button
                                            style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={() => handleEliminarInvitacion(invitacion.id)}
                                            title="Eliminar invitación"
                                          >
                                            <FaTrash color="#000" />
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </td>
                              </>
                            ) : (
                              <>
                                <td>{formatZonaDisplay(invitacion.zona)}</td>
                                <td>{invitacion.fila ?? "-"}</td>
                                <td>{invitacion.butaca ?? "-"}</td>
                                <td>
                                  {editingId === invitacion.id ? (
                                    <input
                                      type="text"
                                      className="form-control"
                                      value={editingNome}
                                      onChange={(e) => setEditingNome(e.target.value)}
                                      autoFocus
                                      ref={editingInputRef}
                                    />
                                  ) : (
                                    invitacion.nome_titular || "Invitación"
                                  )}
                                </td>
                                <td>{invitacion.email || "-"}</td>
                                <td>{invitacion.codigo_validacion || "-"}</td>
                                <td>{invitacion.tipo_reserva === "invitacion" ? "-" : `${invitacion.prezo_entrada ?? 0} €`}</td>
                                <td>{formatTipoReservaDisplay(invitacion.tipo_reserva)}</td>
                                <td className="no-print text-center">
                                  {invitacion.tipo_reserva === "invitacion" && (
                                    <>
                                      {editingId === invitacion.id ? (
                                        <>
                                          <button
                                            style={{ background: "none", border: "none", color: "red", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={handleCancelarEdicion}
                                            title="Cancelar"
                                          >
                                            <FaTimes />
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={() => handleDownloadInvitacionPdf(invitacion.id)}
                                            title="Descargar invitación en PDF"
                                          >
                                            <FaPrint color="#000" />
                                          </button>
                                          <button
                                            style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={() => handleEditarInvitacion(invitacion.id, invitacion.nome_titular)}
                                            title="Editar invitación"
                                          >
                                            <FaEdit color="#000" />
                                          </button>
                                          <button
                                            style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={() => handleEnviarInvitacionEmail(invitacion)}
                                            title="Enviar invitación por email"
                                          >
                                            <FaEnvelope color="#000" />
                                          </button>
                                          <button
                                            style={{ background: "none", border: "none", color: "#000", cursor: "pointer", padding: "4px 8px" }}
                                            onClick={() => handleEliminarInvitacion(invitacion.id)}
                                            title="Eliminar invitación"
                                          >
                                            <FaTrash color="#000" />
                                          </button>
                                        </>
                                      )}
                                    </>
                                  )}
                                </td>
                              </>
                            )}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={esSinPlano ? 6 : 9} className="text-center text-muted py-4">
                            Non hai invitacións reservadas
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Botóns de acción */}
                <div className="d-flex justify-content-between gap-2 mt-3 no-print">
                  <button
                    type="button"
                    className="boton-avance"
                    onClick={() => navigate(-1)}
                  >
                    <FaArrowLeft className="me-2" />
                    Volver
                  </button>
                  <button
                    type="button"
                    className="reserva-entrada-btn"
                    onClick={editingId !== null ? handleGuardarEdicion : () => window.print()}
                  >
                    {editingId !== null ? "Gardar Cambios" : "Imprimir"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      {/* Modal para enviar invitación por email */}
      <Modal show={showEmailModal} onHide={handleCloseEmailModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaEnvelope style={{ color: '#ff0093', marginRight: 8, verticalAlign: 'middle' }} />
            Enviar invitación por email
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label">Email destinatario</label>
            <input
              type="email"
              className="form-control"
              value={emailToSend}
              onChange={e => setEmailToSend(e.target.value)}
              placeholder="Introduce o email"
            />
          </div>
          {currentInvitacion && (!currentInvitacion.nome_titular || currentInvitacion.nome_titular.trim() === '' || currentInvitacion.nome_titular === 'Invitación') && (
            <div className="mb-3">
              <label className="form-label">Nome titular</label>
              <input
                type="text"
                className="form-control"
                value={nomeTitularToSend}
                onChange={e => setNomeTitularToSend(e.target.value)}
                placeholder="Introduce o nome do titular"
              />
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between' }}>
            <button className="boton-avance" onClick={handleCloseEmailModal}>Cancelar</button>
            <button
              className="reserva-entrada-btn"
              onClick={handleSendEmail}
              disabled={
                sendingEmail ||
                !isValidEmail(emailToSend) ||
                (() => {
                  const nome = (currentInvitacion?.nome_titular || '').trim();
                  const needsNomeInput = nome === '' || nome === 'Invitación';
                  if (needsNomeInput && !nomeTitularToSend.trim()) return true;
                  return false;
                })()
              }
            >
              {sendingEmail ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </Modal.Footer>
      </Modal>
    </>
  );
}
