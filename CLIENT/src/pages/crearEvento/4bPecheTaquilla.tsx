import { Container, Card, Form, Button } from "react-bootstrap";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DatePicker, { registerLocale } from "react-datepicker";
import { gl } from "date-fns/locale/gl";
import "react-datepicker/dist/react-datepicker.css";
import "../../estilos/datepicker-custom.css";

type TipoPeche = "inicio" | "30min" | "2h" | "personalizado";

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
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:00`;

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
  const { evento, setEvento }: any = useOutletContext();
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

  const hourValue = hora.split(":")[0] || "";
  const minuteValue = hora.split(":")[1] || "";

  const hoxe = new Date();
  hoxe.setHours(0, 0, 0, 0);

  const personalizadoIncompleto = tipo === "personalizado" && (!fecha || !/^\d{2}:\d{2}$/.test(hora));

  const handleSubmit = () => {
    if (!tipo) return;
    if (!inicioEvento) {
      setError("Primeiro tes que seleccionar a data do evento");
      return;
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

    setEvento({
      ...evento,
      peche_taquilla_tipo: tipo,
      data_peche_taquilla: formatLocal(peche),
    });
    navigate("/crear-evento/lugar");
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">Cando queres pechar a taquilla?</h3>
          <Form>
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
                disabled={!tipo || personalizadoIncompleto}
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
