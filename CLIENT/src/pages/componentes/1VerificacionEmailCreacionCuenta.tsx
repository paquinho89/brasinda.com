import { Modal, Button } from "react-bootstrap";
import { FaEnvelope } from "react-icons/fa";
import { FaGoogle, FaYahoo, FaMicrosoft } from "react-icons/fa";

function EmailVerificationModal({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  return (
    <Modal show={show} onHide={onClose} centered>

      <Modal.Header closeButton>
        <Modal.Title>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <FaEnvelope style={{ color: "#ff0093", fontSize: 24 }} />
            Verifica o teu email
          </span>
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="text-center">
        <p>
          Enviamos un correo de verificación ao teu email.
          <br />
          Revisa a túa bandexa de entrada e confirma a túa conta.
        </p>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "24px",
            marginTop: "15px",
          }}
        >
          {/* Gmail */}
          <a
            href="https://mail.google.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Gmail"
            style={{ color: "#111", fontSize: 28, transition: "color 0.2s" }}
          >
            <FaGoogle />
          </a>
          {/* Yahoo */}
          <a
            href="https://mail.yahoo.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Yahoo Mail"
            style={{ color: "#111", fontSize: 28, transition: "color 0.2s" }}
          >
            <FaYahoo />
          </a>
          {/* Outlook */}
          <a
            href="https://outlook.live.com"
            target="_blank"
            rel="noopener noreferrer"
            title="Outlook"
            style={{ color: "#111", fontSize: 28, transition: "color 0.2s" }}
          >
            <FaMicrosoft />
          </a>
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button className="reserva-entrada-btn" onClick={onClose}>
          Entendido
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

export default EmailVerificationModal;
