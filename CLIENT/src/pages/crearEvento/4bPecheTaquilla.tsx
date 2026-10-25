import { Container, Card, Form, Button } from "react-bootstrap";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DatePicker, { registerLocale } from "react-datepicker";
import { gl } from "date-fns/locale/gl";
import type { OutletContext } from "./0ElementoPadre";
import "react-datepicker/dist/react-datepicker.css";
import "../../estilos/datepicker-custom.css";

type TipoPeche = "inicio" | "30min" | "2h" | "personalizado";
type TipoApertura = "hoxe" | "manha" | "pasado" | "personalizado";

const OPCIONS_APERTURA: { valor: TipoApertura; texto: string }[] = [
  { valor: "hoxe", texto: "Hoxe" },
  { valor: "manha", texto: "Mañá" },
  { valor: "pasado", texto: "Pasado mañá" },
  { valor: "personalizado", texto: "Escoller día e hora" },
];

const DIAS_APERTURA: Record<Exclude<TipoApertura, "personalizado">, number> = { hoxe: 0, manha: 1, pasado: 2 };

const OPCIONS: { valor: TipoPeche; texto: string }[] = [
  { valor: "inicio", texto: "Xusto á hora do comezo" },
  { valor: "30min", texto: "30 min antes do comezo" },
  { valor: "2h", texto: "2 horas antes do comezo" },
  { valor: "personalizado", texto: "Escoller eu o día e a hora" },
];

const MINUTOS_ANTES: Record<Exclude<TipoPeche, "personalizado">, number> = {
  inicio: 0,
  "30min": 30,
  "2h": 120,
};

const pad = (n: number) => String(n).padStart(2, "0");

const formatLocal = (d: Date) =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

function parseLocal(valor?: string): Date | null {
  if (!valor) return null;
  const [datePart, timePart = "00:00"] = String(valor).split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
}

interface SelectorProps {
  label: string;
  placeholder: string;
  opcions: string[];
  valor: string;
  onChange: (v: string) => void;
}

function Selector({ label, placeholder, opcions, valor, onChange }: SelectorProps) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="flex-fill" style={{ position: "relative" }}>
      <Form.Label>{label}</Form.Label>
      <div
        className="form-control"
        style={{ cursor: "pointer", userSelect: "none" }}
        tabIndex={0}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => setAberto((v) => !v)}
      >
        {valor ? valor : <span style={{ color: "#aaa" }}>{placeholder}</span>}
      </div>
      {aberto && (
        <div
          style={{
            position: "absolute",
            zIndex: 10,
            background: "#fff",
            border: "1px solid #ddd",
            borderRadius: 6,
            maxHeight: 180,
            overflowY: "auto",
            width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {opcions.map((op) => (
            <div
              key={op}
              style={{ padding: "6px 12px", cursor: "pointer", background: valor === op ? "#f0e6f7" : undefined }}
              onClick={() => {
                onChange(op);
                setAberto(false);
              }}
            >
              {op}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const HORAS = [...Array(24)].map((_, i) => pad(i));
const MINUTOS = [...Array(60)].map((_, i) => pad(i));

export default function PecheTaquilla() {
  const navigate = useNavigate();
  const { evento, setEvento } = useOutletContext<OutletContext>();
  registerLocale("gl", gl);

  const inicioEvento = parseLocal(evento.data_evento_inicio || evento.fecha);
  const fimEvento = parseLocal(evento.data_evento_fin) || inicioEvento;

  const pechePrevio = parseLocal(evento.data_peche_taquilla);
  const [tipo, setTipo] = useState<TipoPeche | null>(evento.peche_taquilla_tipo || null);
  // Por defecto a data é a do evento
  const [fecha, setFecha] = useState<Date | null>(
    evento.peche_taquilla_tipo === "personalizado" && pechePrevio ? pechePrevio : inicioEvento
  );
  const [hora, setHora] = useState(
    evento.peche_taquilla_tipo === "personalizado" && pechePrevio
      ? `${pad(pechePrevio.getHours())}:${pad(pechePrevio.getMinutes())}`
      : ""
  );
  const [error, setError] = useState("");

  const aperturaPrevia = parseLocal(evento.data_apertura_taquilla);
  const [aperturaTipo, setAperturaTipo] = useState<TipoApertura | null>(evento.apertura_taquilla_tipo || null);
  const [aperturaFecha, setAperturaFecha] = useState<Date | null>(
    evento.apertura_taquilla_tipo === "personalizado" && aperturaPrevia ? aperturaPrevia : null
  );
  const [aperturaHora, setAperturaHora] = useState(
    evento.apertura_taquilla_tipo === "personalizado" && aperturaPrevia
      ? `${pad(aperturaPrevia.getHours())}:${pad(aperturaPrevia.getMinutes())}`
      : ""
  );
  const aperturaHourValue = aperturaHora.split(":")[0] || "";
  const aperturaMinuteValue = aperturaHora.split(":")[1] || "";
  const aperturaIncompleta =
    aperturaTipo === "personalizado" && (!aperturaFecha || !/^\d{2}:\d{2}$/.test(aperturaHora));

  const hourValue = hora.split(":")[0] || "";
  const minuteValue = hora.split(":")[1] || "";

  const hoxe = new Date();
  hoxe.setHours(0, 0, 0, 0);

  const personalizadoIncompleto = tipo === "personalizado" && (!fecha || !/^\d{2}:\d{2}$/.test(hora));

  const handleSubmit = () => {
    if (!tipo || !aperturaTipo) return;
    if (!inicioEvento) {
      setError("Primeiro tes que seleccionar a data do evento");
      return;
    }

    let apertura: Date;
    if (aperturaTipo === "personalizado") {
      if (!aperturaFecha || !/^\d{2}:\d{2}$/.test(aperturaHora)) {
        setError("Selecciona día e hora de apertura");
        return;
      }
      const [ah, am] = aperturaHora.split(":").map(Number);
      apertura = new Date(aperturaFecha);
      apertura.setHours(ah, am, 0, 0);
      if (apertura.getTime() < Date.now() - 60000) {
        setError("A apertura da taquilla non pode ser anterior ao momento actual");
        return;
      }
    } else {
      apertura = new Date();
      apertura.setDate(apertura.getDate() + DIAS_APERTURA[aperturaTipo]);
      apertura.setHours(23, 59, 59, 0);
    }

    let peche: Date;
    if (tipo === "personalizado") {
      if (!fecha || !/^\d{2}:\d{2}$/.test(hora)) {
        setError("Selecciona día e hora");
        return;
      }
      const [h, m] = hora.split(":").map(Number);
      peche = new Date(fecha);
      peche.setHours(h, m, 0, 0);
      if (peche <= new Date()) {
        setError("O peche da taquilla debe ser posterior ao momento actual");
        return;
      }
      if (fimEvento && peche > fimEvento) {
        setError("O peche da taquilla non pode ser posterior ao fin do evento");
        return;
      }
    } else {
      peche = new Date(inicioEvento.getTime() - MINUTOS_ANTES[tipo] * 60000);
    }

    if (aperturaTipo === "personalizado" && apertura >= peche) {
      setError("A apertura da taquilla debe ser anterior ao peche");
      return;
    }

    setEvento({
      ...evento,
      apertura_taquilla_tipo: aperturaTipo,
      data_apertura_taquilla: formatLocal(apertura),
      peche_taquilla_tipo: tipo,
      data_peche_taquilla: formatLocal(peche),
    });
    navigate("/crear-evento/lugar");
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">Cando queres abrir a taquilla?</h3>
          <Form>
            <div className="d-grid gap-2 mb-3">
              {OPCIONS_APERTURA.map((op) => (
                <Form.Check
                  key={op.valor}
                  type="radio"
                  id={`apertura-${op.valor}`}
                  name="apertura-taquilla"
                  label={op.texto}
                  checked={aperturaTipo === op.valor}
                  onChange={() => {
                    setAperturaTipo(op.valor);
                    setEvento((actual) => ({
                      ...actual,
                      apertura_taquilla_tipo: op.valor,
                    }));
                    setError("");
                  }}
                />
              ))}
            </div>

            {aperturaTipo === "personalizado" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Data</Form.Label>
                  <div>
                    <DatePicker
                      selected={aperturaFecha}
                      onChange={(date: Date | null) => setAperturaFecha(date)}
                      minDate={hoxe}
                      maxDate={fimEvento || undefined}
                      dateFormat="dd/MM/yyyy"
                      locale="gl"
                      placeholderText="Selecciona a data"
                      className="form-control"
                      showPopperArrow={false}
                      todayButton="Hoxe"
                      onFocus={(e) => ((e.target as HTMLInputElement).readOnly = true)}
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <div className="d-flex gap-3">
                    <Selector
                      label="Hora"
                      placeholder="HH"
                      opcions={HORAS}
                      valor={aperturaHourValue}
                      onChange={(h) => setAperturaHora(`${h}:${aperturaMinuteValue || "00"}`)}
                    />
                    <Selector
                      label="Minutos"
                      placeholder="MM"
                      opcions={MINUTOS}
                      valor={aperturaMinuteValue}
                      onChange={(m) => setAperturaHora(`${aperturaHourValue || "00"}:${m}`)}
                    />
                  </div>
                </Form.Group>
              </>
            )}

            <hr className="my-4" />
            <h3 className="text-center mb-4">Cando queres pechar a taquilla?</h3>
            <div className="d-grid gap-2 mb-3">
              {OPCIONS.map((op) => (
                <Form.Check
                  key={op.valor}
                  type="radio"
                  id={`peche-${op.valor}`}
                  name="peche-taquilla"
                  label={op.texto}
                  checked={tipo === op.valor}
                  onChange={() => {
                    setTipo(op.valor);
                    setEvento((actual) => ({
                      ...actual,
                      peche_taquilla_tipo: op.valor,
                    }));
                    setError("");
                  }}
                />
              ))}
            </div>

            {tipo === "personalizado" && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Data</Form.Label>
                  <div>
                    <DatePicker
                      selected={fecha}
                      onChange={(date: Date | null) => setFecha(date)}
                      minDate={hoxe}
                      maxDate={fimEvento || undefined}
                      dateFormat="dd/MM/yyyy"
                      locale="gl"
                      placeholderText="Selecciona a data"
                      className="form-control"
                      showPopperArrow={false}
                      todayButton="Hoxe"
                      onFocus={(e) => ((e.target as HTMLInputElement).readOnly = true)}
                      dayClassName={(date: Date) => {
                        const day = date.getDay();
                        if (day === 0) return "react-datepicker__day--sunday";
                        if (day === 6) return "react-datepicker__day--saturday";
                        return "";
                      }}
                    />
                  </div>
                </Form.Group>
                <Form.Group className="mb-3">
                  <div className="d-flex gap-3">
                    <Selector
                      label="Hora"
                      placeholder="HH"
                      opcions={HORAS}
                      valor={hourValue}
                      onChange={(h) => setHora(`${h}:${minuteValue || "00"}`)}
                    />
                    <Selector
                      label="Minutos"
                      placeholder="MM"
                      opcions={MINUTOS}
                      valor={minuteValue}
                      onChange={(m) => setHora(`${hourValue || "00"}:${m}`)}
                    />
                  </div>
                </Form.Group>
              </>
            )}

            {error && <div className="alert alert-danger mt-2">{error}</div>}

            <div className="mt-4 d-flex justify-content-between">
              <Button className="boton-avance" onClick={() => navigate(-1)}>
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
              <Button
                className="reserva-entrada-btn"
                disabled={!tipo || personalizadoIncompleto || !aperturaTipo || aperturaIncompleta}
                onClick={handleSubmit}
              >
                Continuar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
