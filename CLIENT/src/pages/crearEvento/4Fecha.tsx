import { Container, Card, Form, Button, InputGroup } from "react-bootstrap";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import DatePicker, { registerLocale } from "react-datepicker";
import { gl } from "date-fns/locale/gl";
import "react-datepicker/dist/react-datepicker.css";
import "../../estilos/datepicker-custom.css";

export default function Fecha() {
  const navigate = useNavigate();
  const { evento, setEvento }: any = useOutletContext();

  // Calculamos hoxe en formato yyyy-mm-dd
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const fechaMinima = `${yyyy}-${mm}-${dd}`;

  registerLocale("gl", gl);
  const [fecha, setFecha] = useState(evento.fecha ? new Date(String(evento.fecha).split("T")[0]) : null);
  // Extraer hora de evento.fecha se existe
  let horaInicial = "";
  if (evento.fecha && evento.fecha.includes("T")) {
    const partes = evento.fecha.split("T");
    if (partes[1]) {
      horaInicial = partes[1].slice(0,5); // formato HH:MM
    }
  }
  const [hora, setHora] = useState(horaInicial);
  // Duración do evento (opcional)
  const [duracion, setDuracion] = useState(evento.duracion || "");
  const fechaValida = fecha instanceof Date && !isNaN(fecha.getTime());
  const horaValida = /^\d{2}:\d{2}$/.test(hora);
  const formularioIncompleto = !fechaValida || !horaValida;
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!fechaValida || !horaValida) {
      setError("Selecciona data e hora");
      return;
    }

    // Validación: se a data é hoxe, a hora debe ser posterior á actual
    const agora = new Date();
    const selectedDate = new Date(fecha!);
    const [h, m] = hora.split(":").map(Number);
    selectedDate.setHours(h, m, 0, 0);

    // Só comprobar hora se a data é hoxe
    const isToday = fecha && fecha instanceof Date && fecha.getFullYear() === agora.getFullYear() && fecha.getMonth() === agora.getMonth() && fecha.getDate() === agora.getDate();
    if (isToday && selectedDate <= agora) {
      setError("A hora debe ser posterior á actual");
      return;
    }

    const formattedDate = fecha instanceof Date
      ? `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}-${String(fecha.getDate()).padStart(2, "0")}`
      : "";
    const fechaCompleta = `${formattedDate}T${hora}:00`;

    setEvento({ 
      ...evento, 
      fecha: fechaCompleta,
      duracion: duracion ? Number(duracion) : 0
    });

    navigate("/crear-evento/lugar");
  };

  // Custom dropdowns para hora e minutos
  const [showHour, setShowHour] = useState(false);
  const [showMinute, setShowMinute] = useState(false);
  const hourValue = hora.split(":")[0] || "";
  const minuteValue = hora.split(":")[1] || "";

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-3">Data do evento</h3>
          <Form>
            {/* Data */}
            <Form.Group className="mb-3">
              <Form.Label>Data</Form.Label>
              <div>
                <DatePicker
                  selected={fecha}
                  onChange={(date: Date | null) => setFecha(date)}
                  minDate={new Date(fechaMinima)}
                  dateFormat="dd/MM/yyyy"
                  locale="gl"
                  placeholderText="Selecciona a data"
                  className="form-control"
                  showPopperArrow={false}
                  todayButton="Hoxe"
                  onFocus={(e) => (e.target as HTMLInputElement).readOnly = true}
                  dayClassName={(date: Date) => {
                    const day = date.getDay();
                    if (day === 0) return "react-datepicker__day--sunday";
                    if (day === 6) return "react-datepicker__day--saturday";
                    return "";
                  }}
                />
              </div>
            </Form.Group>
            {/* Hora personalizada */}
            <Form.Group className="mb-3">
              <div className="d-flex gap-3">
                {/* Columna Hora */}
                <div className="flex-fill" style={{ position: "relative" }}>
                  <Form.Label>Hora</Form.Label>
                  <div
                    className="form-control"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    tabIndex={0}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowHour((v) => !v)}
                  >
                    {hourValue ? hourValue : <span style={{ color: "#aaa" }}>HH</span>}
                  </div>
                  {showHour && (
                    <div style={{
                      position: "absolute",
                      zIndex: 10,
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      maxHeight: 180,
                      overflowY: "auto",
                      width: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}>
                      {[...Array(24)].map((_, i) => {
                        const hour = String(i).padStart(2, "0");
                        return (
                          <div
                            key={hour}
                            style={{ padding: "6px 12px", cursor: "pointer", background: hourValue === hour ? "#f0e6f7" : undefined }}
                            onClick={() => {
                              setHora(`${hour}:${minuteValue || "00"}`);
                              setShowHour(false);
                            }}
                          >
                            {hour}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
                {/* Columna Minutos */}
                <div className="flex-fill" style={{ position: "relative" }}>
                  <Form.Label>Minutos</Form.Label>
                  <div
                    className="form-control"
                    style={{ cursor: "pointer", userSelect: "none" }}
                    tabIndex={0}
                    onMouseDown={e => e.preventDefault()}
                    onClick={() => setShowMinute((v) => !v)}
                  >
                    {minuteValue ? minuteValue : <span style={{ color: "#aaa" }}>MM</span>}
                  </div>
                  {showMinute && (
                    <div style={{
                      position: "absolute",
                      zIndex: 10,
                      background: "#fff",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      maxHeight: 180,
                      overflowY: "auto",
                      width: "100%",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)"
                    }}>
                      {[...Array(60)].map((_, i) => {
                        const minute = String(i).padStart(2, "0");
                        return (
                          <div
                            key={minute}
                            style={{ padding: "6px 12px", cursor: "pointer", background: minuteValue === minute ? "#f0e6f7" : undefined }}
                            onClick={() => {
                              setHora(`${hourValue || "00"}:${minute}`);
                              setShowMinute(false);
                            }}
                          >
                            {minute}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </Form.Group>

            {/* Duración do evento (opcional) */}
            <div style={{ height: 20 }} />
            <Form.Group className="mb-3">
              <Form.Label>Duración do evento <span style={{ color: '#888', fontWeight: 400 }}>(opcional)</span></Form.Label>
              <InputGroup>
                <Form.Control
                  type="number"
                  min="1"
                  step="1"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="0"
                  value={duracion}
                  onChange={e => setDuracion(e.target.value.replace(/[^0-9]/g, ""))}
                  style={{ maxWidth: 180 }}
                />
                <InputGroup.Text>min</InputGroup.Text>
              </InputGroup>
            </Form.Group>

            {error && <div className="alert alert-danger mt-2">{error}</div>}

            <div className="mt-4 d-flex justify-content-between">
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
              <Button
                className="reserva-entrada-btn"
                disabled={formularioIncompleto}
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
