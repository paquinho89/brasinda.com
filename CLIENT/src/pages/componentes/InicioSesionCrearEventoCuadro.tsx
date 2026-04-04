import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useState } from "react";
import CreateAccountModal from "./CreacionCuentaCuadro";
import axios from "axios";
import RecuperarContraseñaModal from "./RecuperarContraseña";
import { FaEnvelope, FaLock, FaSignInAlt } from "react-icons/fa";
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
    const [showCreateAccount, setShowCreateAccount] = useState(false);
    const handleOpenCreateAccount = () => setShowCreateAccount(true);
    const handleCloseCreateAccount = () => setShowCreateAccount(false);


    const [showRecuperarContraseña, setShowRecuperarContraseña] = useState(false);
    const handleOpenRecuperarContraseña = () => setShowRecuperarContraseña(true);
    const handleCloseRecuperarContraseña = () => setShowRecuperarContraseña(false);

    const [email, setEmail] = useState("");
    const [errorEmail, setErrorEmail] = useState("") //Pode tomar valores de "repetido ou inválido"
    const validarEmail = (email:string) => {
        const expresionRegular = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return expresionRegular.test(email)
    }
    const [errorEmailLogin, setErrorEmailLogin] = useState("");


    const [contraseña, setContraseña] = useState("");
    const [showContraseña, setShowContraseña] = useState(false);
    const [errorPasswordLogin, setErrorPasswordLogin] = useState("");

    const [errorLogin, setErrorLogin] = useState("")

    const handleLogin = async () => {
        setErrorEmailLogin("");
        setErrorPasswordLogin("");
        setErrorLogin("");
        try {
            const response = await axios.post("http://localhost:8000/organizador/login/", {
                email: email.toLowerCase(),
                password:contraseña,
            });
            const accessToken = response.data.access_token || response.data.access;
            const refreshToken = response.data.refresh_token || response.data.refresh;
            const organizadorData = response.data.organizador;

            if (!accessToken || !organizadorData) {
                throw new Error("Resposta de login inválida");
            }

            login(organizadorData, accessToken);
            if (refreshToken) {
                localStorage.setItem("refresh_token", refreshToken);
            }
            onClose();
            navigate(redirectTo);
        } catch (err: any) {
            const msg = err.response?.data?.error || "";
            if (msg.toLowerCase().includes("email")) {
                setErrorEmailLogin(msg);
            } else if (msg.toLowerCase().includes("contraseña")) {
                setErrorPasswordLogin(msg);
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
        const response = await fetch("http://localhost:8000/organizador/auth/google/", {
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
        <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
            <Modal.Title className="d-flex align-items-center">
                {/* Iconos rosas antes do texto */}
                <FaSignInAlt style={{ color: '#ff0093', fontSize: '1.5rem', marginRight: '8px' }} />
                {redirectTo === "/panel-organizador" ? "Iniciar Sesión" : "Inicio de sesión requerido"}
            </Modal.Title>
        </Modal.Header>
        <Modal.Body>
            <Form.Group className="mb-3">
            <FaEnvelope style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Correo electrónico</Form.Label>
            <Form.Control 
                type="text" 
                placeholder="email"
                value = {email}
                onChange={(e) => {
                    const value = e.target.value;
                    setEmail (value);
                    setErrorEmail ("");
                    if (value && !validarEmail(value)){
                        setErrorEmail("invalido");
                    }
                }}
            />
            </Form.Group>
            {errorEmail === "invalido" && (
                <div className="alert alert-danger">
                    Por favor, introduce un email válido
                </div>
            )}

            {errorEmailLogin && (
                <div className="alert alert-danger">
                    {errorEmailLogin}
                </div>
            )}

            <Form.Group>
                <FaLock style={{ marginRight: "6px", color: "#ff0093" }} />
                <Form.Label>Contraseña</Form.Label>
                <InputGroup>
                    <Form.Control
                        type={showContraseña ? "text" : "password"}   //aquí enmascara o texto
                        placeholder="Mín 8 caracteres"
                        value={contraseña}
                        onChange={(e) => {
                        const value = e.target.value;
                        setContraseña(value);
                        }}
                    />
                    <Button
                        variant="outline-secondary"
                        onClick={() => setShowContraseña(!showContraseña)}
                    >
                        {showContraseña ? "🙈" : "👁️"}
                    </Button>
                </InputGroup>
                <div className="d-grid gap-2 mt-2">
                    <Button
                        className="badge-prezo mt-2"
                        onClick={()=>{handleOpenRecuperarContraseña(); onClose();}}
                    >
                        Recuperar contraseña
                    </Button>
                    <Button className="badge-prezo mt-2" onClick={() => {handleOpenCreateAccount(); onClose();}}>
                        Non teño conta
                    </Button>
                </div>
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
                {errorPasswordLogin && (
                    <div className="alert alert-danger">
                        {errorPasswordLogin}
                    </div>
                )}
                {errorLogin && (
                <div className="alert alert-danger">
                    {errorLogin}
                </div>
                )}
                </Modal.Body>
                <Modal.Footer className=" d-flex justify-content-between">
                    <Button variant="secondary" onClick={onClose} className="boton-avance">
                    Cerrar
                    </Button>
                    <Button variant="primary" onClick={() => {handleLogin()}} className="reserva-entrada-btn">
                    Iniciar sesión
                    </Button>
                </Modal.Footer>
                </Modal>
                <CreateAccountModal
                    show={showCreateAccount}
                    onClose={handleCloseCreateAccount}
                />
                <RecuperarContraseñaModal
                    show={showRecuperarContraseña}
                    onClose={handleCloseRecuperarContraseña}
                    initialEmail={email}
                    entryPoint={redirectTo === "/panel-organizador" ? "panel" : "publish"}
                />
            </>
  );
}

export default LoginModalCrearEvento;
