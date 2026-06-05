import { Button } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import { FaCalendarAlt, FaMapMarkerAlt, FaEuroSign, FaExclamationTriangle, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";
interface Evento {
  id: number;
  nome_evento: string;
  data_evento: string;
  localizacion: string;
  entradas_venta: number;
  entradas_vendidas?: number;
  entradas_reservadas?: number;
  prezo_evento?: number;
  gastos_xestion?: number;
  email_organizador?: string;
  evento_cobrado?: boolean;
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";



export default function CobroEvento() {
  const [stripeOnboardingCompleted, setStripeOnboardingCompleted] = useState(false);
  const [stripeStatusLoading, setStripeStatusLoading] = useState(true);
  const [stripeStatusError, setStripeStatusError] = useState<string | null>(null);
  const [stripeOnboardingLoading, setStripeOnboardingLoading] = useState(false);
  const [stripeRecreateLoading, setStripeRecreateLoading] = useState(false);
  const [stripeDashboardLoading, setStripeDashboardLoading] = useState(false);
  const [stripeBankLast4, setStripeBankLast4] = useState<string | null>(null);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error] = useState<string | null>(null);
  const [entradasVerificadas, setEntradasVerificadas] = useState<number>(0);
  const [totalVendasConfirmadas, setTotalVendasConfirmadas] = useState<number>(0);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const resp = await fetch(`${API_BASE_URL}/crear-eventos/${id}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) throw new Error("Evento non atopado");
        const data = await resp.json();
        setEvento(data);

        // Buscar entradas escaneadas
        try {
          const respInv = await fetch(`${API_BASE_URL}/eventos/${id}/listado-invitacions/`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          if (respInv.ok) {
            const dataInv = await respInv.json();
            const vendasConf: any[] = (dataInv.invitacions || []).filter(
              (r: any) => r.tipo_reserva === "venta" && r.estado === "confirmado"
            );
            setTotalVendasConfirmadas(vendasConf.length);
            setEntradasVerificadas(vendasConf.filter((r: any) => r.entrada_usada_validacion).length);
          }
        } catch {}
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEvento();
  }, [id]);

  useEffect(() => {
    const fetchStripeStatus = async () => {
      try {
        setStripeStatusLoading(true);
        setStripeStatusError(null);
        const token = localStorage.getItem("access_token");
        const resp = await fetch(`${API_BASE_URL}/organizador/stripe/onboarding-status/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        const data = await resp.json().catch(() => ({}));
        if (!resp.ok) {
          throw new Error(data?.error || "Non se puido comprobar o estado de Stripe");
        }
        setStripeOnboardingCompleted(Boolean(data?.onboarding_completed));
        setStripeBankLast4(data?.bank_last4 ? String(data.bank_last4) : null);
      } catch (e: any) {
        setStripeStatusError(e?.message || "Erro comprobando Stripe");
      } finally {
        setStripeStatusLoading(false);
      }
    };

    fetchStripeStatus();
  }, []);

  if (loading) return <div className="container py-4">Cargando evento…</div>;
  if (error) return <div className="container py-4 text-danger">{error}</div>;
  if (!evento) return <div className="container py-4">Evento non encontrado</div>;

  const importeRecaudadoBruto = (evento.entradas_vendidas || 0) * (evento.prezo_evento || 0);

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
    const dataCapitalizada = data.charAt(0).toUpperCase() + data.slice(1);
    return `${dataCapitalizada} ás ${hora}`;
  };

  const dataFormato = formatDataCompleta(evento.data_evento);

  const aforoTotal = evento.entradas_venta || 0;
  const vendidas = evento.entradas_vendidas ?? 0;
  const reservadas = evento.entradas_reservadas ?? 0;
  const senVender = Math.max(0, aforoTotal - vendidas - reservadas);

  const pctVendidas = aforoTotal > 0 ? (vendidas / aforoTotal) * 100 : 0;
  const pctReservadas = aforoTotal > 0 ? (reservadas / aforoTotal) * 100 : 0;
  const pctSenVender = aforoTotal > 0 ? (senVender / aforoTotal) * 100 : 0;

  // Usar comisión do backend (gastos_xestion)
  const comisionPct = (evento.gastos_xestion ?? 5) / 100;
  const comisionPorEntrada = (evento.prezo_evento || 0) * comisionPct;
  const comisionTotal = (evento.entradas_vendidas || 0) * comisionPorEntrada * 1.21; // 21% IVA sobre a comisión
  const importeTotal = importeRecaudadoBruto - comisionTotal;

  const abrirStripeDashboard = async () => {
    const token = localStorage.getItem("access_token");
    try {
      setStripeDashboardLoading(true);
      const resp = await fetch(`${API_BASE_URL}/organizador/stripe/dashboard-link/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      const data = await resp.json().catch(() => ({}));
      if (!resp.ok) throw new Error(data?.error || "Non se puido abrir o dashboard de Stripe");
      if (data?.url) {
        window.open(data.url, "_blank", "noopener,noreferrer");
      }
    } catch (e: any) {
      setStripeStatusError(e?.message || "Erro abrindo o dashboard de Stripe");
    } finally {
      setStripeDashboardLoading(false);
    }
  };

  const crearLinkOnboarding = async (forceRecreate = false) => {
    const token = localStorage.getItem("access_token");
    const resp = await fetch(`${API_BASE_URL}/organizador/stripe/onboarding-link/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        evento_id: evento.id,
        return_path: `/panel-organizador/cobro/${evento.id}`,
        ...(forceRecreate ? { force_recreate: true } : {}),
      }),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok) {
      throw new Error(data?.error || "Non se puido xerar o link de onboarding de Stripe");
    }
    return data;
  };

  return (
    <>
      <MainNavbar />
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-4">
              <h2 className="m-0 flex-grow-1">{evento.nome_evento}</h2>
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-1" />
                Volver
              </Button>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="fw-bold" >
                  <FaCalendarAlt className="me-2" style={{ color: "#ff0093" }}/>
                  Data do evento:
                </label>
                <p>{dataFormato}</p>
              </div>
              <div className="col-md-6">
                <label className="fw-bold">
                  <FaMapMarkerAlt className="me-2" style={{ color: "#ff0093" }}/>
                  Localización:
                </label>
                <p>{evento.localizacion}</p>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="fw-bold">
                  <FaEuroSign className="me-2" style={{ color: "#ff0093" }}/>
                  Precio por entrada:
                </label>
                <p>{evento.prezo_evento || 0} €</p>
              </div>
            </div>


            {/* Barra visual de estado das entradas (idéntica a eventoDetalle.tsx salvo "Sen vender" en vez de "Disponibles") */}
            <div className="mb-3 mt-2">
              <label className="fw-bold d-block mb-2">Resumo:</label>
              <div
                className="d-flex w-100 mb-3"
                style={{
                  height: "40px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #ddd",
                }}
              >
                {/* Vendidas - Morado */}
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

                {/* Invitacións - Rosa */}
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

                {/* Sen vender - Verde */}
                {pctSenVender > 0 && (
                  <div
                    style={{
                      width: `${pctSenVender}%`,
                      backgroundColor: "#60dd49",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "0.85rem",
                      fontWeight: "bold",
                    }}
                    title={`Sen vender: ${senVender}`}
                  >
                    {pctSenVender > 8 && senVender}
                  </div>
                )}
              </div>

              {/* Leyenda igual que eventoDetalle.tsx */}
              <div className="row g-2">
                <div className="col-6 col-md-4">
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
                <div className="col-6 col-md-4">
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
                      <small className="text-muted d-block">Invitacións</small>
                      <strong>{reservadas}</strong>
                    </div>
                  </div>
                </div>
                <div className="col-6 col-md-4">
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
                      <small className="text-muted d-block">Sen vender</small>
                      <strong>{senVender}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Entradas Escaneadas */}
              <div className="text-center mt-3 mb-1">
                <h5 className="text-muted d-block mb-1">Índice de Asistencia ao Evento</h5>
                <div style={{ fontSize: "3rem", fontWeight: "bold", lineHeight: 1 }}>
                  {totalVendasConfirmadas > 0 ? Math.round((entradasVerificadas / totalVendasConfirmadas) * 100) : 0}%
                </div>
                <div className="text-muted" style={{ fontSize: "1rem" }}>
                  {entradasVerificadas} escaneadas de {totalVendasConfirmadas} vendidas
                </div>
              </div>
            </div>

            {evento.evento_cobrado && (
              <div className="text-center fw-bold fs-5 mt-3 p-3" style={{ backgroundColor: "rgba(255, 0, 147, 0.15)", borderRadius: "8px", color: "#000" }}>
                <FaCheckCircle className="me-2" style={{ color: "#ff0093" }} />
                Evento Cobrado
              </div>
            )}

            {!evento.evento_cobrado && (
            <div className="row">
              <div className="col-md-12">
                <label className="fw-bold h4">Importe Total a Cobrar:</label>
                <div className="p-3" style={{ border: "1px solid #ddd", borderRadius: "6px" }}>
                  <h3 className="mb-0">
                    {importeTotal.toFixed(2)} €
                  </h3>
                  <small className="text-muted d-block mt-2">
                    Recaudado bruto: {importeRecaudadoBruto.toFixed(2)} €
                  </small>
                  <small className="text-muted d-block">
                    Comisión ({(comisionPct * 100)}%) + 21% IVA: {comisionTotal.toFixed(2)} €
                  </small>
                </div>
              </div>
            </div>
            )}

            {!evento.evento_cobrado && (
            <div className="row mb-3 mt-4">
              <div className="col-md-12">
                {stripeStatusLoading ? (
                  <div className="p-3" style={{ border: "1px solid #ddd", borderRadius: "6px" }}>
                    <small className="text-muted">Comprobando estado de Stripe...</small>
                  </div>
                ) : stripeOnboardingCompleted ? (
                  <>
                    <label className="fw-bold h5">Conta para ingresar o diñeiro</label>
                    <div className="p-3" style={{ border: "1px solid #ddd", borderRadius: "6px" }}>
                      {stripeBankLast4 ? (
                        <>
                          <div>
                            <div>
                              <strong className="d-block mt-2">**** **** **** {stripeBankLast4}</strong>
                              <small className="text-muted d-block">O IBAN é xestionado polo noso proveedor financieiro.</small>
                              <small className="text-muted d-block">
                                No caso de querer modificalo vaia a{" "}
                                <a
                                  href="#"
                                  onClick={async (e) => {
                                    e.preventDefault();
                                    if (!stripeDashboardLoading) {
                                      await abrirStripeDashboard();
                                    }
                                  }}
                                  aria-disabled={stripeDashboardLoading}
                                  style={{
                                    pointerEvents: stripeDashboardLoading ? "none" : "auto",
                                  }}
                                >
                                  <strong>Consulta los detalles &gt; Actualizar la configuración de transferencias</strong>
                                </a>
                              </small>
                            </div>
                          </div>
                        </>
                      ) : (
                        <small className="text-muted">Conta para ingresar o diñeiro</small>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-3" style={{ border: "1px solid #ddd", borderRadius: "6px" }}>
                    <div className="d-flex align-items-start gap-2 mb-2" style={{ color: "#ff0093" }}>
                      <FaExclamationTriangle className="mt-1" style={{ fontSize: "1.35rem" }} />
                      <span className="fw-bold" style={{ fontSize: "1.25rem", fontWeight: 900, color: "#000" }}>Importante</span>
                    </div>
                    <p className="mb-3">
                      Para proceder ao cobro das entradas necesitamos que configures a túa conta co noso proveedor financieiro.
                    </p>
                    <p className="mb-3">
                      Se precisas axuda, contacta con nós en <strong>eventos@brasinda.com</strong> ou a través do <strong>6xxxxxx</strong>
                    </p>
                    <Button
                      variant="outline-secondary"
                      className="ms-0"
                      onClick={async () => {
                        const pendingTab = window.open("", "_blank", "noopener,noreferrer");
                        let navigated = false;
                        try {
                          setStripeRecreateLoading(true);
                          setStripeStatusError(null);
                          const data = await crearLinkOnboarding(true);
                          if (data?.onboarding_completed) {
                            setStripeOnboardingCompleted(true);
                            return;
                          }
                          if (!data?.url) {
                            throw new Error("Stripe non devolveu URL de onboarding");
                          }
                          if (pendingTab) {
                            pendingTab.location.href = data.url;
                            navigated = true;
                          } else {
                            const newTab = window.open(data.url, "_blank", "noopener,noreferrer");
                            if (!newTab) {
                              window.location.assign(data.url);
                            }
                          }
                        } catch (e: any) {
                          if (pendingTab && !navigated) {
                            pendingTab.close();
                          }
                          setStripeStatusError(e?.message || "Erro recreando conta de Stripe");
                        } finally {
                          setStripeRecreateLoading(false);
                        }
                      }}
                      disabled={stripeRecreateLoading || stripeOnboardingLoading}
                    >
                      {stripeRecreateLoading ? "Recreando conta test..." : "Recrear conta test"}
                    </Button>

                    {stripeStatusError && <small className="text-danger d-block mt-2">{stripeStatusError}</small>}
                  </div>
                )}
              </div>
            </div>
            )}

            {!evento.evento_cobrado && (
            <div className="d-flex gap-2 justify-content-between mt-4">
              <Button
                className="reserva-entrada-btn"
                onClick={async () => {
                  if (stripeOnboardingCompleted) {
                    try {
                      const token = localStorage.getItem("access_token");
                      await fetch(`${API_BASE_URL}/crear-eventos/${evento.id}/`, {
                        method: "PATCH",
                        headers: {
                          "Content-Type": "application/json",
                          ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                        body: JSON.stringify({ evento_cobrado: true }),
                      });
                    } catch {
                      // Non bloquear a navegación se falla
                    }
                    navigate("/panelOrganizador/cobroExitoso");
                    return;
                  }
                  try {
                    const pendingTab = window.open("about:blank", "_blank");
                    let navigated = false;
                    setStripeOnboardingLoading(true);
                    setStripeStatusError(null);
                    const data = await crearLinkOnboarding(false);
                    if (data?.onboarding_completed) {
                      if (pendingTab && !navigated) {
                        pendingTab.close();
                      }
                      setStripeOnboardingCompleted(true);
                      navigate("/panelOrganizador/cobroExitoso");
                      return;
                    }
                    if (!data?.url) {
                      throw new Error("Stripe non devolveu URL de onboarding");
                    }
                    if (pendingTab) {
                      pendingTab.opener = null;
                      pendingTab.location.href = data.url;
                      navigated = true;
                    } else {
                      throw new Error("O navegador bloqueou a apertura da nova pestaña de Stripe");
                    }
                  } catch (e: any) {
                    setStripeStatusError(e?.message || "Erro conectando con Stripe");
                  } finally {
                    setStripeOnboardingLoading(false);
                  }
                }}
                disabled={stripeOnboardingLoading}
              >
                {stripeOnboardingLoading
                  ? "Abrindo Stripe..."
                  : stripeOnboardingCompleted
                  ? "Cobrar diñeiro"
                  : "Configurar Conta"}
              </Button>
              <Button
                className="cancelar-evento-btn"
                onClick={() => navigate(-1)}
              >
                Volver
              </Button>
            </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
