import React, { useEffect, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button, Form, Container, Card } from "react-bootstrap";
import { aforoAuditorios } from "../planoAuditorios/aforoAuditorios";
import type { OutletContext } from "../crearEvento/0ElementoPadre";
import { FaArrowLeft } from "react-icons/fa";

const Entradas: React.FC = () => {
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [entradas, setEntradas] = useState<number | "">(
    evento.entradas ? Number(evento.entradas) : ""
  );
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lugarKey = normalizar(evento.lugar);

  const aforoAuditorio = aforoAuditorios[lugarKey];
  const esAuditorio = typeof aforoAuditorio === "number";


  useEffect(() => {
    if (esAuditorio && aforoAuditorio) {
      setEntradas(aforoAuditorio);
      setEvento((prev) => ({ ...prev, entradas: aforoAuditorio 
      }));
    }
  }, [esAuditorio, aforoAuditorio]);

  const handleSubmit = () => {
    if (entradas === "" || entradas <= 0) {
      setError("Por favor, introduce un número válido de entradas");
      return;
    }
    setError("");
    setEvento({ ...evento, entradas: Number(entradas) });

    // Navegar ao seguinte paso
    navigate("/crear-evento/gestion-entradas");
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">
            Número de prazas
          </h3>
          <Form>
            <Form.Group className="mb-3">
              <Form.Control
                type="number"
                min={1}
                value={entradas}
                disabled={esAuditorio}
                placeholder="Introduce o número máximo de entradas"
                onChange={(e) =>
                  setEntradas(e.target.value === "" ? "" : Number(e.target.value))
                }
                style={{
                  backgroundColor: esAuditorio ? "#ffe6f2" : undefined,
                  cursor: esAuditorio ? "not-allowed" : "text",
                }}
                className="py-2"
              />
            </Form.Group>

            {esAuditorio && (
              <p className="text-secondary">
                Este auditorio ten un aforo máximo de {aforoAuditorio} butacas. 
                Unha vez publicado o evento, poderás reservar ou xestionar as entradas no teu panel de usuario.
              </p>
            )}
            {error && <p style={{ color: "red", marginBottom: 10 }}>{error}</p>}

            <div className="d-flex justify-content-between mt-4">
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>

              <Button
                onClick={handleSubmit}
                className="reserva-entrada-btn"
                disabled={entradas === "" || entradas <= 0}
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

export default Entradas;
