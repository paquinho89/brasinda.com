import React, { useState, useEffect } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import axios from "axios";
import EnvioEmailRecuperacionContraseña from "./EnvioEmailRecuperacionContraseña"
import { FaEnvelope, FaLock } from "react-icons/fa";

interface RecuperarContraseñaModalProps {
  show: boolean;
  onClose: () => void;
  initialEmail?: string;
  entryPoint?: "publish" | "panel";
}

function RecuperarContraseñaModal({ show, onClose, initialEmail = "", entryPoint }: RecuperarContraseñaModalProps) {
  const [email, setEmail] = useState(initialEmail);
    // Se cambia o email inicial, actualiza o input cando se abre o modal
    React.useEffect(() => {
      if (show) setEmail(initialEmail);
    }, [show, initialEmail]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [showEnvioEmailRecuperacionContraseña, setEnvioEmailRecuperacionContraseña] = useState(false);

  const handleRecuperarContraseña = async () => {
    setError("");
    setSuccess("");
    if (!email) {
      setError("Por favor, introduce un email.");
      return;
    }
    setLoading(true);
    try {
      await axios.post("http://localhost:8000/organizador/recuperar-contrasena/", {
        email: email.toLowerCase(),
        entryPoint: entryPoint || "publish"
      });
      onClose();
      setEnvioEmailRecuperacionContraseña(true);

      setSuccess("Revisa o teu email, enviámosche un link para recuperar a túa contraseña.");
      setEmail("");
    } catch (err: any) {
      const msg = err.response?.data?.error || "Ocorreu un erro. Intenta novamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <FaLock style={{ color: '#ff0093', fontSize: 22, marginRight: 8, marginBottom: 3 }} />
            Recuperar tu contraseña
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
                onChange={(e) => setEmail(e.target.value)}
            />
            </Form.Group>
            {error && <div className="alert alert-danger">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
        </Modal.Body>
        <Modal.Footer className="d-flex justify-content-between">
          <div>
            <Button variant="secondary" onClick={onClose} className="boton-avance">
              Cerrar
            </Button>
          </div>
          <div>
            <Button 
              className="reserva-entrada-btn"
              variant="primary" 
              onClick={handleRecuperarContraseña}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Recuperar Contraseña"}
            </Button>
          </div>
        </Modal.Footer>
        </Modal>
        <EnvioEmailRecuperacionContraseña
          show={showEnvioEmailRecuperacionContraseña}
          onClose={()=> setEnvioEmailRecuperacionContraseña(false)}
        />
    </>
  );
}

export default RecuperarContraseñaModal;
