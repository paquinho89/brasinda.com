import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import { FaCalendarAlt, FaMapMarkerAlt, FaEuroSign } from "react-icons/fa";

interface Evento {
  id: number;
  nome_evento: string;
  data_evento: string;
  localizacion: string;
  entradas_venta: number;
  entradas_vendidas?: number;
  entradas_reservadas?: number;
  prezo_evento?: number;
  numero_iban?: string | null;
}

export default function CobroEvento() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvento = async () => {
      try {
        const token = localStorage.getItem("access_token");
        const resp = await fetch(`http://localhost:8000/crear-eventos/${id}/`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!resp.ok) throw new Error("Evento non atopado");
        const data = await resp.json();
        setEvento(data);
      } catch (e: any) {
        setError(e.message || "Erro ao cargar evento");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchEvento();
  }, [id]);

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

  const comisionPct = 0.05;
  const comisionPorEntrada = (evento.prezo_evento || 0) * comisionPct;
  const comisionTotal = vendidas * comisionPorEntrada;
  const importeTotal = importeRecaudadoBruto - comisionTotal;

  return (
    <>
      <MainNavbar />
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="card-body">
            <div className="d-flex align-items-center mb-4">
              <h2 className="m-0 flex-grow-1">{evento.nome_evento}</h2>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <label className="fw-bold">
                  <FaCalendarAlt className="me-2" />
                  Data do evento:
                </label>
                <p>{dataFormato}</p>
              </div>
              <div className="col-md-6">
                <label className="fw-bold">
                  <FaMapMarkerAlt className="me-2" />
                  Localización:
                </label>
                <p>{evento.localizacion}</p>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-12">
                <label className="fw-bold">
                  <FaEuroSign className="me-2" />
                  Precio por entrada:
                </label>
                <p>{evento.prezo_evento || 0} €</p>
              </div>
            </div>

            <div className="mb-3">
              <label className="fw-bold d-block mb-2">Estado das entradas:</label>
              <div
                className="d-flex w-100 mb-3"
                style={{
                  height: "40px",
                  borderRadius: "8px",
                  overflow: "hidden",
                  border: "1px solid #ddd",
                }}
              >
                {pctVendidas > 0 && (
                  <div
                    style={{
                      width: `${pctVendidas}%`,
                      backgroundColor: "#60dd49",
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
                    title={`Reservadas: ${reservadas}`}
                  >
                    {pctReservadas > 8 && reservadas}
                  </div>
                )}

                {pctSenVender > 0 && (
                  <div
                    style={{
                      width: `${pctSenVender}%`,
                      backgroundColor: "#82CAD3",
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

              <div className="row g-2">
                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Vendidas</small>
                  <strong>{vendidas}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Reservadas</small>
                  <strong>{reservadas}</strong>
                </div>
                <div className="col-6 col-md-4">
                  <small className="text-muted d-block">Sen vender</small>
                  <strong>{senVender}</strong>
                </div>
              </div>
            </div>

            <hr />

            <div className="row">
              <div className="col-md-12">
                <label className="fw-bold h4">Importe Total a Cobrar:</label>
                <div className="p-3" style={{ backgroundColor: "#fff5fa", border: "1px solid #ffccdd", borderRadius: "6px" }}>
                  <h3 className="mb-0">
                    <FaEuroSign className="me-2" />
                    {importeTotal.toFixed(2)} €
                  </h3>
                  <small className="text-muted d-block mt-2">
                    Recaudado bruto: {importeRecaudadoBruto.toFixed(2)} €
                  </small>
                  <small className="text-muted d-block">
                    Comisión (5%): {comisionTotal.toFixed(2)} €
                  </small>
                </div>
              </div>
            </div>

            {evento.numero_iban && (
              <div className="row mt-4">
                <div className="col-md-12">
                  <label className="fw-bold">Número de conta (IBAN):</label>
                  <p className="font-monospace bg-light p-2 rounded">
                    {evento.numero_iban}
                  </p>
                </div>
              </div>
            )}

            <div className="d-flex gap-2 justify-content-between mt-4">
              <Button
                className="reserva-entrada-btn"
              >
                Cobrar importe
              </Button>
              <Button
                className="cancelar-evento-btn"
                onClick={() => navigate(-1)}
              >
                Volver
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
