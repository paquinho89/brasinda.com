
import { Button, Container, Card, Modal, Form } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import React, { useState } from "react";
import { FaExclamationTriangle } from "react-icons/fa";
import type { OutletContext } from "./0ElementoPadre";
import { FaArrowLeft } from "react-icons/fa";

const GestionEntradas: React.FC = () => {
  const { evento, setEvento } = useOutletContext<OutletContext>();
  const navigate = useNavigate();
  const [tipoEntrada, setTipoEntrada] = useState<"gratis" | "pago" | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualPaymentProcedure, setManualPaymentProcedure] = useState("");
  // 🔹 Inicializar cos valores gardados
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
                  setEvento({ ...evento, tipo_gestion_entrada: "pagina" });
                  navigate("/crear-evento/prezo");
                }}
              >
                Si, fareino a través da páxina
              </Button>
              <Button
                className="reserva-entrada-btn"
                onClick={() => setShowManualModal(true)}
              >
                Non, fareino eu mesmo
              </Button>
              {/* Modal para xestión manual do cobro */}
              <Modal show={showManualModal} onHide={() => setShowManualModal(false)} centered>
                <Modal.Body style={{ textAlign: 'left', position: 'relative' }}>
                  {/* Botón de peche (cruz) arriba á dereita */}
                  <button
                    type="button"
                    aria-label="Pechar"
                    onClick={() => setShowManualModal(false)}
                    style={{
                      position: 'absolute',
                      top: 6,
                      right: 10,
                      background: 'none',
                      border: 'none',
                      fontSize: 42,
                      color: '#888',
                      cursor: 'pointer',
                      zIndex: 2,
                      lineHeight: 1
                    }}
                  >
                    ×
                  </button>
                  <div className="mb-2 d-flex align-items-center" style={{gap: 8}}>
                    <FaExclamationTriangle size={22} color="#ff0093" style={{ marginRight: 8, marginBottom: 2 }} />
                    <h5 className="mb-0" style={{ color: '#111', fontWeight: 700, display: 'inline-block' }}>Aviso importante!</h5>
                  </div>
                  <hr style={{ border: 'none', borderTop: '1.5px solid #eee', margin: '0 0 18px 0' }} />
                  <div className="mb-3">
                    Esta opción <strong>NON é recomendable</strong> para facer unha xestión robusta do cobro das entradas.<br />
                    Se decide continuar, indique como se vai proceder ao cobro das entradas:
                  </div>
                  <Form.Control
                    as="textarea"
                    rows={3}
                    placeholder={"- Bizum\n- Transferencia bancaria\n- O mesmo día do evento\n- Locales asociados"}
                    className="mb-3"
                    value={manualPaymentProcedure}
                    onChange={e => setManualPaymentProcedure(e.target.value)}
                    autoFocus
                  />
                  <div style={{ color: '#888', fontSize: 15, marginTop: '-10px', marginBottom: '16px' }}>
                    <strong>*Este texto será visible ao público</strong>
                  </div>
                  <div className="d-flex justify-content-between">
                    <Button className="boton-avance" onClick={() => setShowManualModal(false)}>
                      Volver
                    </Button>
                    <Button
                      className="reserva-entrada-btn"
                      onClick={() => {
                        setEvento({ ...evento, tipo_gestion_entrada: "manual", procedimiento_cobro_manual: manualPaymentProcedure });
                        setShowManualModal(false);
                        navigate("/crear-evento/condiciones-legales");
                      }}
                      disabled={!manualPaymentProcedure.trim()}
                    >
                      Continuar
                    </Button>
                  </div>
                </Modal.Body>
              </Modal>
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

        {/* ...removed step for tipoEntrada === 'pago'... */}

        {/* Paso seguinte: se selecciona 'gratis' */}
        {tipoEntrada === "gratis" && (
          <>
            <h3 className="text-center mb-4">O evento será gratuíto</h3>
            <div className="d-flex justify-content-between mt-3">
              <Button
                className="boton-avance"
                onClick={() => setTipoEntrada(null)}
                variant="secondary"
              >
                <FaArrowLeft className="me-2" /> Volver
              </Button>
              <Button
                className="reserva-entrada-btn"
                onClick={() => navigate("/crear-evento/condiciones-legales")}
              >
                Continuar
              </Button>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  </Container>
  );
}

export default GestionEntradas;