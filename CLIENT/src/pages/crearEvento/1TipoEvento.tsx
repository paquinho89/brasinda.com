import { Container, Card, Row, Col } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";

const TIPOS_EVENTO = [
  "Concerto",
  "Obra de Teatro",
  "Musical",
  "Monólogo",
  "Coloquio",
  "Xantar/Cea Popular",
  "Festa Popular",
  "Festival",
  "Feira",
  "Charla",
  "Outros",
];

export default function TipoEvento() {
  const navigate = useNavigate();
  const { evento, setEvento }: any = useOutletContext();

  const seleccionarTipo = (tipoEvento: string) => {
    setEvento({ ...evento, tipo: tipoEvento });
    navigate("/crear-evento/titulo"); // seguinte paso
  };
  console.log("Evento no tipo:", evento); // Verificar que o estado se actualiza correctamente

  return (
    <Container className="py-5">
      <h3 className="text-center mb-4">Qué tipo de evento queres organizar?</h3>

      <Row className="g-4">
        {TIPOS_EVENTO.map((tipo) => (
          <Col md={4} sm={6} xs={12} key={tipo}>
            <Card
              className={`h-100 text-center shadow-sm tipo-card ${
                evento.tipo === tipo ? "tipo-card-selected" : "" //a constante evento ven do elemento pai (0ElementoPadre.tsx)
              }`}
              style={{
                cursor: "pointer",
                minHeight: "120px",
                display: "flex",
                justifyContent: "center",
              }}
              onClick={() => seleccionarTipo(tipo)}
            >
              <Card.Body className="d-flex align-items-center justify-content-center">
                <h5 className="mb-0">{tipo}</h5>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
