import API_BASE_URL from "../../utils/api";
import { Modal, Button, Form } from "react-bootstrap";
import { useState, useEffect } from "react";
import RecuperarEntradaListadoEventos from "./RecuperarEntradaListadoEventos";
import { FaEnvelope, FaTicketAlt } from "react-icons/fa";


function RecuperarEntradaModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [showRecuperarEntrada, setShowRecuperarEntrada] = useState(false);
  const [email, setEmail] = useState("");
  const [eventos, setEventos] = useState<any[]>([]);
  const [loadingEventos, setLoadingEventos] = useState(false);
  const [errorEventos, setErrorEventos] = useState("");

  const handleOpenRecuperarEntrada = () => setShowRecuperarEntrada(true);
  const handleCloseRecuperarEntrada = () => setShowRecuperarEntrada(false);

  useEffect(() => {
    const fetchEventos = async () => {
      setLoadingEventos(true);
      setErrorEventos("");
      try {
        // Cambia esta URL polo teu endpoint real
        const response = await fetch(`${API_BASE_URL}/crear-eventos/eventos-activos/?email=${encodeURIComponent(email)}`);
        const text = await response.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (jsonErr) {
          throw new Error(`A resposta do servidor non é JSON válido. Resposta: " + text);
        }
        if (!response.ok) throw new Error(data?.error || "Erro ao buscar eventos activos");
        setEventos(data);
      } catch (err: any) {
        setErrorEventos(err.message || "Erro descoñecido");
        setEventos([]);
      } finally {
        setLoadingEventos(false);
      }
    };
    // Validar email simple
    if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      fetchEventos();
    } else {
      setEventos([]);
      setErrorEventos("");
    }
  }, [email]);

  return (
    <>
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaTicketAlt style={{ marginRight: "8px", color: "#ff0093", position: "relative", top: "-2px" }} />
            Recuperar Entrada
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <FaEnvelope style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control
              type="text"
              placeholder="Introduce tu email"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button variant="secondary" onClick={onClose} className="boton-avance">
            Cerrar
          </Button>
          <Button variant="primary" onClick={handleOpenRecuperarEntrada} className="reserva-entrada-btn">
            Mostrar eventos
          </Button>
        </Modal.Footer>
      </Modal>
      {/* Modal para mostrar eventos usando o compoñente listado */}
      {showRecuperarEntrada && (
        <RecuperarEntradaListadoEventos
          show={showRecuperarEntrada}
          onClose={handleCloseRecuperarEntrada}
          eventos={eventos}
          email={email}
          loading={loadingEventos}
          error={errorEventos}
        />
      )}
    </>
  );
}

export default RecuperarEntradaModal;
