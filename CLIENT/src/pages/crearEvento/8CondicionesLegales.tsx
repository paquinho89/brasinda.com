import React, { useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button, Form, Container, Card } from "react-bootstrap";
import type { OutletContext } from "../crearEvento/0ElementoPadre";
import { FaArrowLeft } from "react-icons/fa";

const CondicionesLegales: React.FC = () => {
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [aceptacionCondiciones, setAceptacionCondiciones] =
    useState<boolean>(evento.condicionesConfirmacion || false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = () => {
    if (!aceptacionCondiciones) {
      setError("Por favor, acepta as condicións legais");
      return;
    }
    setError("");

    setEvento({
      ...evento,
      condicionesConfirmacion: aceptacionCondiciones,
    });

    navigate("/crear-evento/resumen");
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card
        className="shadow-sm"
        style={{ maxWidth: "600px", width: "100%" }}
      >
        <Card.Body className="p-4">

          <h3 className="text-center mb-4">Condicións legais</h3>

          <div className="mb-4">
            <ul className="ps-3">
              <li>A páxina web non cobra ningún gasto de xestión.</li>
              <li>
                O organizador responsabilízase de ter seguro e do que poida
                ocorrer no evento. A páxina exímese de responsabilidade.
              </li>
              <li>
                En caso de cancelación, o diñeiro recadado devolverase ao espectador.
              </li>
              <li>
                No caso de que o evento teña un prezo, o importe recadado poderá solicitarse a partir das 00:00 horas
                do día seguinte ao evento.
              </li>
              <li>
                A páxina resérvase o dereito de buscar patrocinadores para o
                evento e quedar coas ganancias.
              </li>
            </ul>
          </div>

          <Form>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Lin e acepto as condicións legais"
                checked={aceptacionCondiciones}
                onChange={(e) =>
                  setAceptacionCondiciones(e.target.checked)
                }
              />
            </Form.Group>

            {error && (
              <div className="text-danger mb-3">{error}</div>
            )}

            <div className="d-flex justify-content-between mt-4">
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>

              <Button
                className="reserva-entrada-btn"
                onClick={handleSubmit}
                disabled={!aceptacionCondiciones}
              >
                Continuar
              </Button>
            </div>
          </Form>

        </Card.Body>
      </Card>
    </Container>
  );
};

export default CondicionesLegales;
