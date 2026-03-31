import { Button, Container, Form, Card, InputGroup, Modal } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import React, { useState, useEffect } from "react";
import type { OutletContext } from "../crearEvento/0ElementoPadre";
import { FaArrowLeft, FaExclamationTriangle } from "react-icons/fa";

const PrezoContaBancaria: React.FC = () => {
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const [prezo, setPrezo] = useState<string>("");
  const [errorPrezo, setErrorPrezo] = useState<string>("");
  const navigate = useNavigate();

  const [tipoEntrada, setTipoEntrada] = useState<"gratis" | "pago" | null>(null);
  const [showManualPaymentModal, setShowManualPaymentModal] = useState<boolean>(false);
  const [manualPaymentProcedure, setManualPaymentProcedure] = useState<string>("");
  const prezoNumericoVista = Number(prezo.replace(",", "."));
  const prezoValidoVista = prezo !== "" && !isNaN(prezoNumericoVista) && prezoNumericoVista > 0;
  const recibesPorEntrada = prezoValidoVista ? prezoNumericoVista * 0.95 : 0;

  // 🔹 Inicializar cos valores gardados
  useEffect(() => {
  if (evento.precio) {
    const precioNum = Number(evento.precio.replace(",", "."));
    if (!isNaN(precioNum) && precioNum > 0) {
      setPrezo(precioNum.toFixed(2).replace(".", ","));
    } else {
      setPrezo("");
    }
  } else {
    setPrezo("");
  }
}, [evento]);

  const handleSubmit = () => {
    let hasError = false;
    const precioNumerico = Number(prezo.replace(",", "."));
    if (!prezo || isNaN(precioNumerico) || precioNumerico <= 0) {
      setErrorPrezo("Por favor, introduce un prezo válido");
      hasError = true;
    } else {
      setErrorPrezo("");
    }

    if (hasError) return;

    setEvento({ ...evento, precio: precioNumerico.toFixed(2).replace(".", ",") });
    navigate("/crear-evento/condiciones-legales");
  };

  return (
  <Container className="py-5 d-flex justify-content-center">
    <Card className="shadow-sm" style={{ maxWidth: "500px", width: "100%" }}>
      <Card.Body className="p-4">

        {/* PANTALLA 1 — PREGUNTA */}
        {!tipoEntrada && (
          <>
            <h3 className="text-center mb-4">
              Queres xestionar o importe da entrada a través da páxina?
            </h3>

            <div className="d-grid gap-3">
              <Button
                className="reserva-entrada-btn"
                onClick={() => {
                  const precioNum = Number((evento.precio || "").replace(",", "."));
                  if (!evento.precio || isNaN(precioNum) || precioNum <= 0) {
                    setPrezo("");
                  }
                  setEvento({ ...evento, tipo_gestion_entrada: "pagina" });
                  setTipoEntrada("pago");
                }}
              >
                Si, fareino a través da páxina
              </Button>

              <Button
                className="reserva-entrada-btn"
                onClick={() => setShowManualPaymentModal(true)}
              >
                Non, fareino eu mesmo
              </Button>

              <Button
                className="reserva-entrada-btn"
                onClick={() => {
                  setEvento({ ...evento, precio: "0,00", tipo_gestion_entrada: "gratis" });
                  navigate("/crear-evento/condiciones-legales");
                }}
              >
                Non fai falta, o evento é gratuíto
              </Button>
            </div>

            <div className="mt-3 text-secondary small">
              <div>*No caso de que a entrada sexa gratuíta ou o importe non se xestione a través da páxina, <strong>NON hai costes de xestión.</strong></div>
              <div>Para os eventos cuxo importe sexa xestionado pola páxina, o coste será dun 5% sobre o valor da entrada.</div>
            </div>

            <div className="mt-4">
              <Button
                className="boton-avance"
                onClick={() => navigate(-1)}
              >
                <FaArrowLeft className="me-2" />
                Volver
              </Button>
            </div>
          </>
        )}

        {/* PANTALLA 2 — FORMULARIO DE PAGO */}
        {tipoEntrada === "pago" && (
          <>
            <h3 className="text-center mb-4">Prezo da entrada</h3>

            <Form>

              {/* PREZO */}
              <Form.Group className="mb-3">
                <Form.Label>Prezo da entrada (€)</Form.Label>
                <InputGroup>
                  <InputGroup.Text>€</InputGroup.Text>
                  <Form.Control
                    type="text"
                    inputMode="decimal"
                    value={prezo}
                    placeholder="Introduce o prezo da entrada en euros (€)"
                    onChange={(e) => {
                      const value = e.target.value.replace(".", ",");
                      const regex = /^\d*(,\d{0,2})?$/;
                      if (regex.test(value)) {
                        setPrezo(value);
                      }
                    }}
                    onBlur={() => {
                      if (!prezo) return;

                      let [intPart, decPart] = prezo.split(",");
                      if (!decPart) decPart = "00";
                      else if (decPart.length === 1) decPart += "0";
                      else if (decPart.length > 2) decPart = decPart.slice(0, 2);

                      setPrezo(`${intPart},${decPart}`);
                    }}
                  />
                </InputGroup>
                {errorPrezo && (
                  <div className="text-danger mt-2">{errorPrezo}</div>
                )}

                {prezoValidoVista && evento.tipo_gestion_entrada === "pagina" && (
                  <div className="mt-2 text-secondary">
                    <div>
                      <ul>
                        <li>Importe recibido por entrada: {recibesPorEntrada.toFixed(2).replace(".", ",")} €.</li>
                        <li>Gastos de xestión (5%): {(prezoNumericoVista * 0.05).toFixed(2).replace(".", ",")} €.</li>
                      </ul>
                    </div>
                  </div>
                )}
              </Form.Group>

              {/* BOTÓNS */}
              <div className="d-flex justify-content-between mt-4">
                <Button
                  className="boton-avance"
                  onClick={() => setTipoEntrada(null)}
                >
                  <FaArrowLeft className="me-2" />
                  Volver
                </Button>

                <Button
                  className="reserva-entrada-btn"
                  onClick={handleSubmit}
                >
                  Continuar
                </Button>
              </div>

            </Form>
          </>
        )}

      </Card.Body>
      
      {/* MODAL — AVISO COBRO MANUAL */}
      <Modal show={showManualPaymentModal} onHide={() => setShowManualPaymentModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaExclamationTriangle className="me-2 mb-2" style={{ color: '#ff0093' }} />
            Aviso importante!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Esta opción <strong>NON é recomendable</strong> para facer unha xestión robusta do cobro das entradas.
          </p>
          <p className="mt-3 mb-3">
            Non obstante, se decide continuar pode indicar no seguinte cadro como se vai proceder ao cobro das entradas:
          </p>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={4}
              placeholder={`- A través de transferencia bancaria a ES11...
- A través de Bizum ao número 666...
- En locales asociados
- No propio día e lugar do evento`}
              value={manualPaymentProcedure}
              onChange={(e) => setManualPaymentProcedure(e.target.value)}
            />
            <Form.Text className="text-secondary d-block mt-2">
              *Este texto será visible para os compradores das entradas.
            </Form.Text>
          </Form.Group>
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <Button
            className="boton-avance"
            onClick={() => setShowManualPaymentModal(false)}
          >
            <FaArrowLeft className="me-2" />
            Volver
          </Button>
          <Button
            className="reserva-entrada-btn"
            disabled={!manualPaymentProcedure.trim()}
            onClick={() => {
              setEvento({ ...evento, tipo_gestion_entrada: "manual", procedimiento_cobro_manual: manualPaymentProcedure });
              setShowManualPaymentModal(false);
              setTipoEntrada("pago");
            }}
          >
            Continuar
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  </Container>
);
};

export default PrezoContaBancaria;
