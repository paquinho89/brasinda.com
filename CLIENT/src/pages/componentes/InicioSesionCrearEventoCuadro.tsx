import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useState } from "react";
import API_BASE_URL from "../../utils/api";
import axios from "axios";
import { FaEnvelope, FaSignInAlt, FaExclamationTriangle } from "react-icons/fa";
import "../../estilos/TarjetaEventoHome.css";
import "../../estilos/Botones.css";
import { useAuth } from "../AuthContext";

// import { useGoogleLogin } from '@react-oauth/google';

interface LoginModalProps {
    show: boolean;
    onClose: () => void;
    redirectTo?: string;
}

function LoginModalCrearEvento({ show, onClose, redirectTo = "/crear-evento/tipo" }: LoginModalProps) {
    const { login } = useAuth();
    const navigate = useNavigate();

    const [email, setEmail] = useState("");
    const [errorEmail, setErrorEmail] = useState(""); // Pode tomar valor "invalido"
    const [errorEmailLogin, setErrorEmailLogin] = useState("");
    const [errorLogin, setErrorLogin] = useState("");

    // Limpa todos os estados do modal
    const handleCloseModal = () => {
        setEmail("");
        setErrorEmail("");
        setErrorEmailLogin("");
        setErrorLogin("");
        onClose();
    };

    const handleLogin = async () => {
        setErrorEmailLogin("");
        setErrorLogin("");

        const normalizedEmail = email.trim().toLowerCase();
        if (!normalizedEmail) {
            setErrorEmail("Introduce un correo electrónico.");
            return;
        }
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(normalizedEmail)) {
            setErrorEmail("Introduce un correo electrónico válido.");
            return;
        }

        try {
            const response = await axios.post(`${API_BASE_URL}/organizador/login/`, {
                email: normalizedEmail,
            });
            const token = response.data.token;
            if (!token) {
                throw new Error("Resposta de login inválida");
            }

            const verifyUrl = `/verificacion?email=${encodeURIComponent(normalizedEmail)}&token=${encodeURIComponent(token)}&next=${encodeURIComponent(redirectTo)}`;
            onClose();
            window.location.href = verifyUrl;
        } catch (err: any) {
            const msg = err.response?.data?.error || "Erro no envío do código de verificación.";
            if (msg.toLowerCase().includes("email")) {
                setErrorEmailLogin(msg);
            } else {
                setErrorLogin(msg);
            }
        }
    };


    // Google login handler for ID token
    const handleGoogleLogin = async (credentialResponse: CredentialResponse) => {
        console.log('Google credentialResponse:', credentialResponse);
        const token = credentialResponse.credential;
        console.log('Google ID token:', token);
        if (!token) {
            alert("Non se recibiu token de Google");
            return;
        }
        const response = await fetch(`${API_BASE_URL}/organizador/auth/google/`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ token }),
        });

        if (response.ok) {
            const data = await response.json();
            login(data.organizador, data.access_token || data.access, data.refresh_token);
            onClose();
            navigate(redirectTo);
        } else {
            const err = await response.json().catch(() => ({}));
            alert("Erro ao rexistrarse con Google: " + (err.error || ""));
        }
    };
  
  return (
    <>
        <Modal show={show} onHide={handleCloseModal} centered>
        <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center">
                {/* Iconos rosas antes do texto */}
                <FaSignInAlt style={{ color: '#ff0093', fontSize: '1.5rem', marginRight: '8px' }} />
                {redirectTo === "/panel-organizador" ? "Área organizadores" : "Área organizadores"}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form.Group className="mb-3">
                <FaEnvelope style={{ marginRight: "6px", color: "#ff0093" }} />
                <Form.Label>Correo electrónico</Form.Label>
                <Form.Control
                    type="email"
                    placeholder="email"
                    value={email}
                    onChange={(e) => {
                        const value = e.target.value;
                        setEmail(value);
                        setErrorEmail("");
                    }}
                />
            </Form.Group>
            {errorEmail && (
                <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                    <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                    {errorEmail}
                </div>
            )}
            {errorEmailLogin && (
                <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                    <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                    {errorEmailLogin}
                </div>
            )}
            <Form.Group className="mb-3">
                {/* GOOGLE BUTTON */}
                <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
                    <GoogleLogin
                        onSuccess={handleGoogleLogin}
                        onError={() => alert("Erro login Google")}
                        useOneTap={false}
                        width="100%"
                        text="signin_with"
                        shape="pill"
                        logo_alignment="left"
                    />
                </div>
            </Form.Group>
            {errorLogin && (
                <div className="alert alert-danger" style={{ background: "#ffe6f3", color: "#000", marginTop: 0, display: 'flex', alignItems: 'center' }}>
                    <FaExclamationTriangle style={{ color: '#ff0093', marginRight: 8 }} />
                    {errorLogin}
                </div>
            )}
        </Modal.Body>
                <Modal.Footer className=" d-flex justify-content-between">
                    <Button variant="secondary" onClick={handleCloseModal} className="boton-avance">
                        Cerrar
                    </Button>
                    <Button variant="primary" onClick={() => {handleLogin()}} className="reserva-entrada-btn">
                    Entrar
                    </Button>
                </Modal.Footer>
                </Modal>
            </>
  );
}

export default LoginModalCrearEvento;
