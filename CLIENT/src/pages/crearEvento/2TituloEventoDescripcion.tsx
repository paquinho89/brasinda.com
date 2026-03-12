import { Container, Card, Form, Button } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";

export default function TituloEvento() {
  const navigate = useNavigate();
  const { evento, setEvento }: any = useOutletContext();

  return (
    <Container className="py-5 d-flex justify-content-center">
      
        <Card.Body className="p-4">
            <div className="mb-3">
            <Button
                
                className="boton-avance"
                onClick={() => navigate(-1)} // Volve ao paso anterior
            >
              <FaArrowLeft className="me-2" />
              Volver
            </Button>
          </div>
          <h3 className="mb-2">Nome do evento</h3>

          <Form>
            <Form.Control
              type="text"
              placeholder="Ex: Concerto de primavera 2026"
              value={evento.tituloEvento || ""}
              onChange={(e) =>
                setEvento({ ...evento, tituloEvento: e.target.value })
              }
              className="py-3 fs-5"
              autoFocus
            />
          </Form>
        
          {/* Flecha de retroceso */}
          <h3 className=" mb-2 mt-4">Descripción do evento</h3>

          <Form>
            <Form.Control
              as="textarea"
              placeholder="Describe o teu evento..."
              value={evento.descripcionEvento || ""}
              onChange={(e) =>
                setEvento({ ...evento, descripcionEvento: e.target.value })
              }
              className="py-3 fs-5"
              rows={5}
              autoFocus
            />

            <div className="d-flex gap-3 mt-4">
              <Button
                className="flex-fill boton-avance"
                variant="outline-secondary"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
              <Button
                className="flex-fill reserva-entrada-btn"
                disabled={!evento.descripcionEvento || !evento.tituloEvento}
                onClick={() => navigate("/crear-evento/cartel")}
              >
                Continuar
              </Button>
            </div>

          </Form>
        </Card.Body>
      
    </Container>
  );
}
