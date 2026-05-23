import { Button } from "react-bootstrap";
import MainNavbar from "../componentes/NavBar";
import { FaCalendarAlt, FaMapMarkerAlt, FaEuroSign } from "react-icons/fa";
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
  numero_iban?: string | null;
  gastos_xestion?: number;
  email_organizador?: string;
}

import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";



export default function CobroEvento() {
  const ibanInputRef = useRef<HTMLInputElement>(null);
  const [ibanError, setIbanError] = useState(false);
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Usar comisión do backend (gastos_xestion)
  const comisionPct = (evento.gastos_xestion ?? 5) / 100;
  const comisionPorEntrada = (evento.prezo_evento || 0) * comisionPct;
  const comisionTotal = (evento.entradas_vendidas || 0) * comisionPorEntrada;
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


            {/* Barra visual de estado das entradas (idéntica a eventoDetalle.tsx salvo "Sen vender" en vez de "Disponibles") */}
            <div className="mb-3 mt-2">
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
            </div>

            <hr />

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
                    Comisión ({(comisionPct * 100).toFixed(2)}%): {comisionTotal.toFixed(2)} €
                  </small>
                </div>
              </div>
            </div>


            {/* Input para introducir IBAN sempre visible */}
            <div className="row mt-4">
              <div className="col-md-12">
                <label htmlFor="iban-input" className="fw-bold">Número de conta (IBAN):</label>
                <input
                  id="iban-input"
                  ref={ibanInputRef}
                  type="text"
                  className={`form-control font-monospace p-2 rounded${ibanError ? ' is-invalid' : ''}`}
                  placeholder="ES00 0000 0000 00 0000000000"
                  defaultValue={evento.numero_iban ? formatIBANParts(evento.numero_iban) : ""}
                  onInput={e => {
                    const input = e.target as HTMLInputElement;
                    const raw = input.value.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
                    input.value = formatIBANParts(raw);
                    if (ibanError) setIbanError(false);
                  }}
                  style={{ fontFamily: 'monospace', fontSize: '1.1em', marginTop: 4, backgroundColor: 'transparent', border: '1px solid #ddd' }}
                />
                {ibanError && (
                  <div className="invalid-feedback" style={{ display: 'block' }}>
                    Introduce un número de conta (IBAN) válido.
                  </div>
                )}
              </div>
            </div>

            <div className="d-flex gap-2 justify-content-between mt-4">
              <Button
                className="reserva-entrada-btn"
                onClick={async () => {
                  const iban = ibanInputRef.current?.value || "";
                  if (!validarIBAN(iban)) {
                    setIbanError(true);
                    ibanInputRef.current?.focus();
                    return;
                  }
                  // Gardar IBAN no backend
                  try {
                    const token = localStorage.getItem("access_token");
                    const resp = await fetch(`${API_BASE_URL}/organizador/actualizar-iban/`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                      },
                      body: JSON.stringify({ evento_id: evento.id, iban: iban.replace(/[^A-Za-z0-9]/g, "").toUpperCase() }),
                    });
                    if (!resp.ok) throw new Error("Erro ao gardar IBAN");
                    setIbanError(false);
                    navigate("/panelOrganizador/cobroExitoso", { state: { email: evento.email_organizador } });
                  } catch (e) {
                    setIbanError(true);
                  }
                }}
                disabled={importeTotal === 0}
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

// Formato IBAN español: ESkk BBBB BBBB BBBB BBBB BBBB
function formatIBANParts(iban: string) {
  const limpio = iban.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  // ESkk BBBB BBBB BBBB BBBB BBBB
  const cc = limpio.slice(0, 2); // ES
  const kk = limpio.slice(2, 4); // díxitos de control
  const bloques = [
    limpio.slice(4, 8),
    limpio.slice(8, 12),
    limpio.slice(12, 16),
    limpio.slice(16, 20),
    limpio.slice(20, 24)
  ];
  let out = cc;
  if (kk) out += " " + kk;
  for (const b of bloques) {
    if (b) out += " " + b;
  }
  return out.trim();
}

// Validación IBAN español (formato e módulo 97)
function validarIBAN(iban: string) {
  // Limpar espazos e caracteres non válidos, pasar a maiúsculas
  const limpio = iban.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  // Debe comezar por ES e ter 24 caracteres (letras e díxitos)
  if (!/^ES\d{2}[0-9A-Z]{20}$/.test(limpio)) return false;
  // Algoritmo de validación IBAN (módulo 97)
  // 1. Mover os 4 primeiros caracteres ao final
  const rearr = limpio.slice(4) + limpio.slice(0, 4);
  // 2. Substituír letras por números (A=10, B=11, ..., Z=35)
  let expanded = "";
  for (let i = 0; i < rearr.length; i++) {
    const c = rearr[i];
    if (c >= "A" && c <= "Z") {
      expanded += (c.charCodeAt(0) - 55).toString();
    } else {
      expanded += c;
    }
  }
  // 3. Calcular o módulo 97 de forma segura para números longos (carácter a carácter)
  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    remainder = (remainder * 10 + parseInt(expanded[i], 10)) % 97;
  }
  return remainder === 1;
}
