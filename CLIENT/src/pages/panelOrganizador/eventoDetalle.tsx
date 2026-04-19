import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import AuditorioSelectorVerin from "../planoAuditorios/auditorioBotones/auditorioVerin";
import AuditorioSelectorOurense from "../planoAuditorios/auditorioBotones/auditorioOurense";
import ReservaSinPlano from "./componentes/reservaSinPlano";
import MainNavbar from "../componentes/NavBar";
import TablaPrezosZonas from "./TablaPrezosZonas";
import { FaCalendarAlt, FaUsers, FaEuroSign, FaImage, FaRegFileAlt, FaExclamationTriangle, FaMoneyBill, FaArrowLeft, FaTicketAlt, FaMapMarkerAlt } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";


interface Evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  descripcion_evento?: string;
  data_evento: string;
  localizacion: string;
  nota_lugar?: string;
  entradas_venta: number;
  entradas_reservadas?: number;
  entradas_vendidas?: number;
  prezo_evento?: number;
  prezo_pvp?: number;
  prezo_areas?: boolean;
  numero_iban?: string | null;
  tipo_gestion_entrada?: "pagina" | "manual" | "gratis" | null;
  evento_cancelado?: boolean;
  xustificacion_cancelacion?: string | null;
}

export default function EventoDetalle() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [aforoHabilitado, setAforoHabilitado] = useState<number | null>(null);
  const [imageFileName, setImageFileName] = useState("");
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelConfirmText, setCancelConfirmText] = useState("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState("");
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState({
    nome_evento: "",
    descripcion_evento: "",
    data_evento: "",
    localizacion: "",
    prezo_evento: "",
    imaxe_evento: "",
    nota_lugar: "",
  });
  const navigate = useNavigate();

  const fetchEvento = async (silent = false) => {
    if (!id) return;
    if (!silent) {
      setLoading(true);
    }
    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!resp.ok) throw new Error("Evento non atopado");
      const data = await resp.json();
      setEvento(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Erro ao cargar evento");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchEvento();
  }, [id]);

  if (loading) return <div className="container py-4">Cargando evento…</div>;
  if (error) return <div className="container py-4 text-danger">{error}</div>;
  if (!evento) return <div className="container py-4">Evento non encontrado</div>;

  
  const formatDataCompleta = (dateString: string) => {
  const date = new Date(dateString);

  const data = new Intl.DateTimeFormat("gl-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const hora = new Intl.DateTimeFormat("gl-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  // Primeira letra en maiúscula
  const dataCapitalizada =
    data.charAt(0).toUpperCase() + data.slice(1);

    return `${dataCapitalizada} ás ${hora}`;
  };
  
  const dataFormato = formatDataCompleta(evento.data_evento);

  const img = evento.imaxe_evento
    ? evento.imaxe_evento.startsWith("http")
      ? evento.imaxe_evento
      : `${API_BASE_URL}${evento.imaxe_evento}`
    : null;

  const editImg = form.imaxe_evento
    ? form.imaxe_evento.startsWith("http")
      ? form.imaxe_evento
      : `${API_BASE_URL}${form.imaxe_evento}`
    : null;

  const startEdit = () => {
    setForm({
      nome_evento: evento.nome_evento || "",
      descripcion_evento: evento.descripcion_evento || "",
      data_evento: evento.data_evento || "",
      localizacion: evento.localizacion || "",
      prezo_evento: evento.prezo_evento != null ? String(evento.prezo_evento) : "",
      imaxe_evento: evento.imaxe_evento || "",
      nota_lugar: evento.nota_lugar || "",
    });
    setImageFileName(evento.imaxe_evento ? evento.imaxe_evento.split("/").pop() || "" : "");
    setImagePreviewUrl(null);
    setImageFile(null);
    setIsEditing(true);
  };
  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lugarKey = normalizar(evento.localizacion);
  const isAuditorioOurenseOuVerin =
    lugarKey.includes("auditorio") &&
    (lugarKey.includes("ourense") || lugarKey.includes("verin"));

  const auditorios = [
    {
      ciudad: "verin",
      componente: AuditorioSelectorVerin,
    },
    {
      ciudad: "ourense",
      componente: AuditorioSelectorOurense,
    },
  ];

  const AuditorioComponente = isAuditorioOurenseOuVerin
    ? auditorios.find((a) => lugarKey.includes(a.ciudad))?.componente
    : null;

  const formatImporteEuro = (value: number) => {
    return Number.isInteger(value) ? String(value) : value.toFixed(2);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: value }));
  };

  const handleImagePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFileName(file.name);
    setImagePreviewUrl(URL.createObjectURL(file));
    setImageFile(file);
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      let resp: Response;

      if (imageFile) {
        const formData = new FormData();
        formData.append("descripcion_evento", form.descripcion_evento);
        formData.append("imaxe_evento", imageFile);
        formData.append("nota_lugar", form.nota_lugar || "");

        resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
          method: 'PATCH',
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: formData,
        });
      } else {
        const payload: any = {
          descripcion_evento: form.descripcion_evento,
          nota_lugar: form.nota_lugar || "",
        };

        resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
        });
      }
      if (!resp.ok) throw new Error('Erro ao gardar cambios');
      const data = await resp.json();
      setEvento(data);
      setIsEditing(false);
    } catch (e) {
      console.error(e);
      setErrorModalMessage('Produciuse un erro ao actualizar o evento. Inténtao de novo.');
      setShowErrorModal(true);
    }
  };

  const deleteEvento = () => {
    setShowCancelModal(true);
    setCancelReason("");
    setCancelConfirmText("");
  };


  const confirmCancelEvento = async () => {
    if (cancelConfirmText.toLowerCase() !== "cancelar evento") {
      alert("Por favor, escribe 'Cancelar evento' para confirmar");
      return;
    }

    if (!cancelReason) {
      alert("Por favor, selecciona una razón para cancelar");
      return;
    }

    try {
      const token = localStorage.getItem("access_token");
      const resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ razon: cancelReason }),
      });
      if (resp.status !== 204) throw new Error("Erro ao cancelar evento");
      alert("Evento cancelado correctamente");
      setShowCancelModal(false);
      navigate("/panel-organizador");
    } catch (e) {
      console.error(e);
      alert("Erro ao cancelar o evento");
    }
  };

  const textoXestionImporte =
    evento.tipo_gestion_entrada === "pagina"
      ? "Xestionado a través da páxina"
      : evento.tipo_gestion_entrada === "manual"
      ? "Xestionado polo organizador"
      : null;

  return (
    <>
    <MainNavbar />
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="p-3">
            <div className="d-flex align-items-start pb-3 mb-4">
              <Button
                className="boton-avance me-3"
                onClick={() => navigate('/panel-organizador')}
              >
                <FaArrowLeft className="me-0 me-sm-2" />
                <span className="d-none d-sm-inline">Volver</span>
              </Button>
              <div className="flex-grow-1 text-center">
                <h2 className="m-0 mb-2">
                  {evento.nome_evento}
                </h2>
                <p className="text-center mb-1 mt-0">
                  <FaCalendarAlt className="me-1" />
                  {dataFormato}
                </p>
                <p className="text-center mb-0 mt-0">
                  <FaMapMarkerAlt className="me-2"/>
                  <strong>{evento.localizacion}</strong> ({evento.nota_lugar})
                </p>
              </div>
              {/* Espaciador para equilibrar o botón */}
              <div style={{ width: "100px" }}></div>
            </div>
          {!isEditing && (
            AuditorioComponente ? (
              <AuditorioComponente
                eventoId={evento.id}
                onZonaClick={(zona) => {
                  console.log("Zona seleccionada:", zona);
                }}
                onEntradasUpdate={() => fetchEvento(true)}
                onAforoHabilitadoChange={setAforoHabilitado}
              />
            ) : (
              <ReservaSinPlano
                eventoId={evento.id}
                entradasVenta={evento.entradas_venta || 0}
                entradasVendidas={evento.entradas_vendidas || 0}
                entradasReservadas={evento.entradas_reservadas || 0}
                onEntradasUpdate={() => fetchEvento(true)}
              />
            )
          )}
          {!isEditing && (
            <p className="text-center mt-1 mb-1">
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  fontSize: "1rem",
                  fontWeight: "bold",
                  color: "#222222",
                  borderRadius: "999px",
                  padding: "0.3rem 0.75rem",
                }}
              >
                <FaExclamationTriangle style={{ color: "#ff0093" }} />
                As invitacións reservadas non se porán á venda.
              </span>
              <br />
            </p>
          )}
        </div>
          <div className="card-body">
            {!isEditing ? (
              <>
                {/* Barra visual de estado das entradas */}
                <div className="mb-3 mt-2">
                  {(() => {
                    const aforoTotal = evento.entradas_venta || 0;
                    const aforoHab = isAuditorioOurenseOuVerin
                      ? (aforoHabilitado ?? 0)
                      : (evento.entradas_venta || 0);
                    const vendidas = evento.entradas_vendidas ?? 0;
                    const reservadas = evento.entradas_reservadas ?? 0;
                    const disponibles = Math.max(0, aforoHab - vendidas - reservadas);
                    const inactivas = Math.max(0, aforoTotal - aforoHab);

                    const pctVendidas = aforoTotal > 0 ? (vendidas / aforoTotal) * 100 : 0;
                    const pctReservadas = aforoTotal > 0 ? (reservadas / aforoTotal) * 100 : 0;
                    const pctDisponibles = aforoTotal > 0 ? (disponibles / aforoTotal) * 100 : 0;
                    const pctInactivas = aforoTotal > 0 ? (inactivas / aforoTotal) * 100 : 0;

                    return (
                      <>
                        <div className="mb-3">
                          {isAuditorioOurenseOuVerin ? (
                            <p className="mb-2">
                              <FaUsers className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} /><strong>Aforo Habilitado:</strong> {aforoHab} | <strong>Aforo Total:</strong> {aforoTotal}
                            </p>
                          ) : (
                            <p className="mb-2">
                              <FaUsers className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} />Total Entradas: <strong>{aforoTotal}</strong>
                            </p>
                          )}
                        </div>

                        {/* Barra horizontal */}
                        <div
                          className="d-flex w-100 mb-3"
                          style={{
                            height: "40px",
                            borderRadius: "8px",
                            overflow: "hidden",
                            border: "1px solid #ddd",
                          }}
                        >
                          {/* Vendidas - Verde */}
                          {pctVendidas > 0 && (
                            <div
                              style={{
                                width: `${pctVendidas}%`,
                                backgroundColor: "#8e24aa",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                              }}
                              title={`Vendidas: ${vendidas}`}
                            >
                              {pctVendidas > 8 && vendidas}
                            </div>
                          )}

                          {/* Reservadas - Rosa */}
                          {pctReservadas > 0 && (
                            <div
                              style={{
                                width: `${pctReservadas}%`,
                                backgroundColor: "#ff0093",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                              }}
                              title={`Invitacións: ${reservadas}`}
                            >
                              {pctReservadas > 8 && reservadas}
                            </div>
                          )}

                          {/* Disponibles - Lila */}
                          {pctDisponibles > 0 && (
                            <div
                              style={{
                                width: `${pctDisponibles}%`,
                                backgroundColor: "#60dd49",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "white",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                              }}
                              title={`Dispoñibles: ${disponibles}`}
                            >
                              {pctDisponibles > 8 && disponibles}
                            </div>
                          )}

                          {/* Inactivas - Gris claro (só para auditorios) */}
                          {isAuditorioOurenseOuVerin && pctInactivas > 0 && (
                            <div
                              style={{
                                width: `${pctInactivas}%`,
                                backgroundColor: "#ccc",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#333",
                                fontSize: "0.85rem",
                                fontWeight: "bold",
                              }}
                              title={`Inactivas: ${inactivas}`}
                            >
                              {pctInactivas > 8 && inactivas}
                            </div>
                          )}
                        </div>

                        {/* Legenda con datos */}
                        <div className="row g-2">
                          <div className="col-6 col-md-3">
                            <div className="d-flex align-items-center">
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: "#8e24aa",
                                  borderRadius: "4px",
                                  marginRight: "8px",
                                }}
                              />
                              <div>
                                <small className="text-muted d-block">Vendidas</small>
                                <strong>{vendidas}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="d-flex align-items-center">
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: "#ff0093",
                                  borderRadius: "4px",
                                  marginRight: "8px",
                                }}
                              />
                              <div>
                                <small className="text-muted d-block">Reservadas</small>
                                <strong>{reservadas}</strong>
                              </div>
                            </div>
                          </div>
                          <div className="col-6 col-md-3">
                            <div className="d-flex align-items-center">
                              <div
                                style={{
                                  width: "20px",
                                  height: "20px",
                                  backgroundColor: "#60dd49",
                                  borderRadius: "4px",
                                  marginRight: "8px",
                                }}
                              />
                              <div>
                                <small className="text-muted d-block">Disponibles</small>
                                <strong>{disponibles}</strong>
                              </div>
                            </div>
                          </div>
                          {isAuditorioOurenseOuVerin && (
                            <div className="col-6 col-md-3">
                              <div className="d-flex align-items-center">
                                <div
                                  style={{
                                    width: "20px",
                                    height: "20px",
                                    backgroundColor: "#ccc",
                                    borderRadius: "4px",
                                    marginRight: "8px",
                                  }}
                                />
                                <div>
                                  <small className="text-muted d-block">Inactivas</small>
                                  <strong>{inactivas}</strong>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>

                <button
                  className="reserva-entrada-btn mb-3"
                  style={{
                    background: '#ff0093',
                  }}
                  onMouseOver={e => (e.currentTarget.style.background = 'white')}
                  onMouseOut={e => (e.currentTarget.style.background = '#ff0093')}
                  onClick={() => navigate(`/panel-organizador/evento/${id}/entradas`)}
                >
                  Descargar listado de reservas
                </button>
                <hr style={{ width: '100%', border: 0, borderTop: '4px solid #bdbdbd', margin: '22px 0 24px 0' }} />

                {evento.prezo_evento != null && Number(evento.prezo_evento) > 0 && <p><FaMoneyBill className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} /><strong>Diñeiro recadado:</strong> {formatImporteEuro(Number(evento.prezo_evento) * (evento.entradas_vendidas ?? 0))} €</p>}
                {/* Sempre mostrar título e icono, pero se é de balde só texto, sen táboa */}
                <p><FaEuroSign className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} /><strong>Prezo:</strong></p>
                {evento.prezo_evento === 0 || evento.tipo_gestion_entrada === 'gratis' ? (
                  <div style={{ fontWeight: 700, color: '#222', fontSize: '1.08rem', margin: '10px 0 18px 0' }}>Evento de Balde</div>
                ) : (
                  <>
                    {/* Táboa de prezo global cando prezo_areas é false */}
                    {evento.prezo_areas === false && evento.prezo_evento != null && (
                      <div className="row mb-3">
                        <div className="col-12">
                          <table className="w-100" style={{ background: '#fff', margin: 0, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#f5f5f5' }}>
                                <th style={{ border: 'none', padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>Prezo</th>
                                {evento.tipo_gestion_entrada !== 'manual' && <th style={{ border: 'none', padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>PVP</th>}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                <td style={{ border: 'none', padding: '10px 8px' }}>{Number(evento.prezo_evento).toFixed(2).replace('.', ',')} €</td>
                                {evento.tipo_gestion_entrada !== 'manual' && <td style={{ border: 'none', padding: '10px 8px' }}>{Number(evento.prezo_pvp ?? 0).toFixed(2).replace('.', ',')} €</td>}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {/* Táboa de prezos por zona cando prezo_areas é true */}
                    {evento.prezo_areas === true && (
                      <TablaPrezosZonas eventoId={evento.id} mostrarPVP={evento.tipo_gestion_entrada !== 'manual'} />
                    )}
                  </>
                )}
                {textoXestionImporte && <p><FaTicketAlt className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} /><strong>Xestión do cobro:</strong> {textoXestionImporte}</p>}
                {img && (
                  <div>
                    <p><FaImage className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} /><strong>Imaxe:</strong> {evento.imaxe_evento?.split("/").pop()}</p>
                    <img
                      src={img}
                      alt={evento.nome_evento}
                      style={{ marginTop: 8, maxWidth: 160, borderRadius: 6 }}
                    />
                  </div>
                )}
                {evento.descripcion_evento && (
                  <div className="mt-3">
                    <p><FaRegFileAlt className="me-1" style={{ color: '#ff0093', fontSize: '1.3em', verticalAlign: 'middle' }} /><strong>Descripción:</strong></p>
                    <p><em>{evento.descripcion_evento}</em></p>
                  </div>
                )}
                <div className="d-flex flex-column align-items-start gap-2">
                  <button className="reserva-entrada-btn" onClick={startEdit}>Editar evento</button>
                  <hr style={{ width: "100%", borderColor: "#ccc", opacity: 0.8, margin: "8px 0" }} />
                  <button className="cancelar-evento-btn" onClick={deleteEvento}><FaExclamationTriangle className="me-1" />Cancelar evento</button>
                </div>
              </>
            ) : (
              <div>
                <div className="mb-3">
                  <label className="form-label">Información sobre o lugar</label>
                  <input
                    type="text"
                    name="nota_lugar"
                    value={form.nota_lugar || ""}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="Nota adicional sobre o lugar (opcional)"
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Descripción</label>
                  <textarea name="descripcion_evento" value={form.descripcion_evento} onChange={handleChange} className="form-control" />
                </div>
                <div className="mb-3">
                  <label className="form-label">Imaxe</label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={imageFileName}
                      readOnly
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Buscar
                    </button>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImagePick}
                    style={{ display: "none" }}
                  />
                  {(imagePreviewUrl || editImg) && (
                    <img
                      src={imagePreviewUrl || editImg || ""}
                      alt={form.nome_evento}
                      style={{ marginTop: 8, maxWidth: 160, borderRadius: 6 }}
                    />
                  )}
                </div>
                <div className="d-flex gap-2">
                  <button className="reserva-entrada-btn me-2" onClick={saveEdit}>Gardar Cambios</button>
                  <button className="volver-btn" onClick={() => setIsEditing(false)}>Cancelar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de cancelación de evento */}
      {showCancelModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title d-flex align-items-center mb-0">
                  <FaExclamationTriangle className="me-2" style={{ color: "#ff0093" }} />
                  Cancelar evento
                </h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCancelModal(false)}
                />
              </div>
              <div className="modal-body">
                <div className="mb-3" style={{ color: "#ff0093", fontWeight: 700 }}>
                  No caso de que o importe das entradas se xestione a través da páxina,
                  éste será devolto aos asistentes.
                </div>

                <div className="mb-3">
                  <label className="form-label">Razón de cancelación</label>
                  <select
                    className="form-select"
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                  >
                    <option value="">Selecciona una razón</option>
                    <option value="Falta de asistentes">Falta de asistentes</option>
                    <option value="Falta de recursos económicos">Falta de recursos económicos</option>
                    <option value="Problema de saúde">Problema de saúde</option>
                    <option value="Problemas técnicos">Problemas técnicos</option>
                    <option value="Falta de artista">Falta de artista</option>
                    <option value="Cambio de data">Cambio de data</option>
                    <option value="Imposibilidade do local">Local non dispoñible</option>
                    <option value="Imposibilidade do local">Asuntos personales</option>
                    <option value="Outra">Outros</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Escribe <strong>"Cancelar evento"</strong> para confirmar
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Cancelar evento"
                    value={cancelConfirmText}
                    onChange={(e) => setCancelConfirmText(e.target.value)}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="cancelar-evento-btn"
                  onClick={confirmCancelEvento}
                  disabled={cancelConfirmText.toLowerCase() !== "cancelar evento"}
                >
                  <FaExclamationTriangle /> Cancelar evento
                </button>
                <button
                  type="button"
                  className="reserva-entrada-btn"
                  onClick={() => setShowCancelModal(false)}
                >
                  Volver
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="modal d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex={-1}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header text-white" style={{ backgroundColor: "#ff0093" }}>
                <h5 className="modal-title">Erro</h5>
                <button
                  type="button"
                  className="btn-close"
                  style={{ filter: "invert(1)" }}
                  onClick={() => setShowErrorModal(false)}
                />
              </div>
              <div className="modal-body">
                <div
                  style={{
                    color: "#ff0093",
                    fontWeight: 500,
                    padding: "12px",
                    backgroundColor: "#fff5fa",
                    borderRadius: "6px",
                    border: "1px solid #ffccdd",
                  }}
                >
                  {errorModalMessage}
                </div>
              </div>
              <div className="modal-footer" style={{ justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="reserva-entrada-btn"
                  onClick={() => setShowErrorModal(false)}
                >
                  Pechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

