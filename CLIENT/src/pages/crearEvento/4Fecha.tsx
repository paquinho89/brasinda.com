import { Container, Card, Form, Button } from "react-bootstrap";
import { useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function Fecha() {
  const navigate = useNavigate();
  const { evento, setEvento }: any = useOutletContext();

  // Calculamos hoxe en formato yyyy-mm-dd
  const hoy = new Date();
  const yyyy = hoy.getFullYear();
  const mm = String(hoy.getMonth() + 1).padStart(2, "0");
  const dd = String(hoy.getDate()).padStart(2, "0");
  const fechaMinima = `${yyyy}-${mm}-${dd}`;

  const [fecha, setFecha] = useState(evento.fecha ? String(evento.fecha).split("T")[0] : "");
  const [hora, setHora] = useState("");
  const fechaValida = /^\d{4}-\d{2}-\d{2}$/.test(fecha);
  const horaValida = /^\d{2}:\d{2}$/.test(hora);
  const formularioIncompleto = !fechaValida || !horaValida;
  const [error, setError] = useState("");

  const handleSubmit = () => {
    if (!fechaValida || !horaValida) {
      setError("Selecciona data e hora");
      return;
    }

    const fechaCompleta = `${fecha}T${hora}:00`;

    setEvento({ 
      ...evento, 
      fecha: fechaCompleta 
    });

    navigate("/crear-evento/lugar");
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-3">Data do evento</h3>
          <Form>
          {/* Data */}
          <Form.Group className="mb-3">
            <Form.Label>Data</Form.Label>
            <Form.Control
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              min={fechaMinima}
              onFocus={e => (e.target as HTMLInputElement).showPicker && (e.target as HTMLInputElement).showPicker()}
            />
          </Form.Group>
          {/* Hora */}
          <Form.Group className="mb-3">
            <div className="d-flex gap-3">
              {/* Columna Hora */}
              <div className="flex-fill">
                <Form.Label>Hora</Form.Label>
                <Form.Select
                  value={hora.split(":")[0] || ""}
                  onChange={(e) =>
                    setHora(`${e.target.value}:${hora.split(":")[1] || "00"}`)
                  }
                >
                  <option value="">HH</option>
                  {[...Array(24)].map((_, i) => {
                    const hour = String(i).padStart(2, "0");
                    return (
                      <option key={hour} value={hour}>
                        {hour}
                      </option>
                    );
                  })}
                </Form.Select>
              </div>
              {/* Columna Minutos */}
              <div className="flex-fill">
                <Form.Label>Minutos</Form.Label>
                <Form.Select
                  value={hora.split(":")[1] || ""}
                  onChange={(e) =>
                    setHora(`${hora.split(":")[0] || "00"}:${e.target.value}`)
                  }
                >
                  <option value="">MM</option>
                  {[...Array(60)].map((_, i) => {
                    const minute = String(i).padStart(2, "0");
                    return (
                      <option key={minute} value={minute}>
                        {minute}
                      </option>
                    );
                  })}
                </Form.Select>
              </div>
            </div>
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
