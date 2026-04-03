import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { useState } from "react";
import EmailVerificationModal from "./1VerificacionEmailCreacionCuenta"
import "../../estilos/Botones.css";
import { FaEnvelope, FaLock, FaUser, FaCamera, FaPhone } from "react-icons/fa";
import { GoogleLogin } from '@react-oauth/google';
import type { CredentialResponse } from '@react-oauth/google';
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";


function CreateAccountModal({ show, onClose }: {show: boolean; onClose: () => void;}) {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [showVerificacionEmail, setShowVerificacionEmail] = useState(false);
  const handleOpenVerificacionEmail = () => {
    setShowVerificacionEmail(true);
    onClose(); // Cierra o modal de creación ao abrir o de verificación
  };
  const handleCloseVerificacionEmail = () => setShowVerificacionEmail(false);

  const [email, setEmail] = useState("");
  const [errorEmail, setErrorEmail] = useState("") //Pode tomar valores de "repetido ou inválido"
  const [errorEmailBackend, setErrorEmailBackend] = useState("");
  const validarEmail = (email:string) => {
    const expresionRegular = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return expresionRegular.test(email)
  }
  const [nombreOrganizador, setNombreOrganizador] = useState("");
  const [erroNomeOrganizador, setErroNomeOrganizador] = useState("");

  const [contraseña, setContraseña] = useState("");
  const [contraseñaError, setContraseñaError] = useState("");
  const [showContraseña, setShowContraseña] = useState(false);
  const validarContraseña = (pass: string) => {
    if (!pass) return "La contraseña es obligatoria";
    if (pass.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(pass)) return "Debe incluir al menos una letra mayúscula";
    if (!/[a-z]/.test(pass)) return "Debe incluir al menos una letra minúscula";
    if (!/[0-9]/.test(pass)) return "Debe incluir al menos un número";
    return ""; // ✅ si todo está bien
};

  const [fotoOrganizador, setFotoOrganizador] = useState<File | null>(null);
  const [telefono, setTelefono] = useState("");

  const [errorTelefono, setErrorTelefono] = useState("");
  const validarTelefono = (telefono:string) => {
    const expresionRegular = /^\+?[\d\s\-()]+$/;
    return expresionRegular.test(telefono);
  }

  const [mayorEdad, setMayorEdad] = useState(false);
  const [errorMayorEdad, setErrorMayorEdad] = useState(false);
  
  const [loading, setLoading] = useState(false);
 
  const enviarDatosBackend = async (): Promise<boolean> => {
  if (!email){
    setErrorEmailBackend("");
    setErrorEmail("");
    return false
  }
  if (!validarEmail(email)) {
    setErrorEmail("invalido");
    return false;
  }
  const errorContraseña = validarContraseña(contraseña);
  if (errorContraseña){
    setContraseñaError(errorContraseña);
    return false;
  } else {
    setContraseñaError("")
  }
  if (!validarTelefono(telefono)){
    setErrorTelefono("invalido");
    return false;
  }
  if (!nombreOrganizador.trim()){
    setErroNomeOrganizador("invalidoNomeOrganizador");
    return false;
  }
  if (!mayorEdad){
    setErrorMayorEdad(true); 
    return false; // ⛔ aquí a función para, NON se executa nada máis
  }
  
  const formData = new FormData();
  formData.append("email", email);
  formData.append("username", email.split("@")[0]);
  formData.append("nome_organizador", nombreOrganizador);
  formData.append("password", contraseña);
  formData.append("telefono",  telefono.replace(/[^\d+]/g, "")); // Normalizar teléfono antes de enviar
  formData.append("mayor_edad", mayorEdad.toString());
  if (fotoOrganizador) {
    formData.append("foto_organizador", fotoOrganizador);
  }

  const response = await fetch("http://localhost:8000/organizador/crear-organizador/", {
    method: "POST",
    body: formData,
  });
  if (!response.ok){
    let data: any = null;
    try {
      data = await response.json();
    } catch {}
    if (data?.email){
      const mensaje = data.email[0].toLowerCase();
      if (
        mensaje.includes("exist") ||
        mensaje.includes("already") ||
        mensaje.includes("regist")
      ) {
        setErrorEmailBackend("repetido");
      } else {
        setErrorEmail("invalido");
      }
    } else{
      setErrorEmail("erro_servidor");
    }
    return false;
  }
  return true;
  };

  const handleGoogleRegister = async (credentialResponse: CredentialResponse) => {
    const token = credentialResponse.credential;
    const response = await fetch("http://localhost:8000/organizador/auth/google/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: token,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      login(data.organizador, data.access_token || data.access, data.refresh_token);
      onClose();
      navigate("/crear-evento/tipo");
    } else {
      alert("Erro ao rexistrarse con Google");
    }
  };
  
  return (
    <>
      <Modal show={show} onHide={onClose} centered>
        <Modal.Header closeButton>
          <Modal.Title>Crear cuenta organizador</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group className="mb-3">
            <FaEnvelope style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Correo Electrónico</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="email" 
              value={email}
              onChange={(e) => {
                const value = e.target.value;
                setEmail(value);
                setErrorEmail("");
                setErrorEmailBackend("");
                if (value && !validarEmail(value)) {
                  setErrorEmail("invalido");
                }
              }}
            />
          </Form.Group>
          {errorEmailBackend === "repetido" ? (
            <div className="alert alert-danger">
              Este email xa está rexistrado
            </div>
          ) : errorEmail === "invalido" ? (
            <div className="alert alert-danger">
              Por favor, introduce un email válido
            </div>
          ) : errorEmail === "erro_servidor" ? (
            <div className="alert alert-danger">
              Erro no servidor. Inténtao de novo máis tarde.
            </div>
          ) : null}


          <Form.Group className="mb-3">
            <FaUser style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Nome ou Empresa organizadora</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="Organizador ou Empresa" 
              value={nombreOrganizador}
              onChange={(e) => {
                const value = e.target.value;
                setNombreOrganizador(value);
                if (value==="") {
                  setErroNomeOrganizador("invalidoNomeOrganizador");}
                else {
                  setErroNomeOrganizador("");
                }
                }} />
          </Form.Group>

          {erroNomeOrganizador === "invalidoNomeOrganizador" && (
            <div className="alert alert-danger">
              Por favor, introduce tú nombre de organizador
            </div>
          )}

          <Form.Group className="mb-3">
            <FaLock style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Contraseña</Form.Label>
            <InputGroup>
              <Form.Control
                type={showContraseña ? "text" : "password"}   //aquí enmascara o texto
                placeholder="Min 8 caracteres"
                value={contraseña}
                onChange={(e) => {
                  const value = e.target.value;
                  setContraseña(value);
                  // Validación en tempo real
              
                  if (value) {
                    const error = validarContraseña(value);
                    setContraseñaError(error);
                  } else {
                    setContraseñaError("La contraseña es obligatoria");
                  }
                }}
              />
              <Button
                variant="outline-secondary"
                onClick={() => setShowContraseña(!showContraseña)}
              >
                {showContraseña ? "🙈" : "👁️"}
              </Button>
            </InputGroup>
          </Form.Group>
          {contraseñaError && <div className = "alert alert-danger">{contraseñaError}</div>}

          <Form.Group className="mb-3">
            <FaCamera style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Logo ou Foto</Form.Label>
            <Form.Control
              type="file"
              accept="image/*"        
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                if (e.target.files && e.target.files.length > 0) {setFotoOrganizador(e.target.files[0]);}
              }}
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <FaPhone style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Número de teléfono</Form.Label>
            <Form.Control 
              type="text" 
              placeholder="666..."
              value={telefono}
              onChange={(e)=> {
                const value = e.target.value; // solo números
                setTelefono(value);
                
                if (value && !validarTelefono(value)){
                  setErrorTelefono("invalido");
                } else {
                  setErrorTelefono("");
                }
              }}
           />
          </Form.Group>

          {errorTelefono === "invalido" && (
            <div className = "alert alert-danger">
              Introduce un número de teléfono válido
            </div>
          )}
          
          <Form.Group className="mb-3">
            <Form.Check 
              type="checkbox"
              label="¿Eres mayor de edad?"
              checked={mayorEdad}
              onChange={(e) => {setMayorEdad(e.target.checked);
                if (e.target.checked) {
                  setErrorMayorEdad(false);
                }
              }}
            />
          </Form.Group>
          {errorMayorEdad ? (
            <div className="alert alert-danger">
              Para crear una cuenta como organizador debes de ser mayor de edad
            </div>
          ) : null}
          <div style={{ display: "flex", justifyContent: "center", marginTop: 20 }}>
              <GoogleLogin
                  onSuccess={handleGoogleRegister}
                  onError={() => alert("Erro login Google")}
                  useOneTap={false}
                  width="100%"
                  text="signin_with"
                  shape="pill"
                  logo_alignment="left"
              />
          </div>
        </Modal.Body>
        
        <Modal.Footer>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between" }}>
            <Button 
              className="boton-avance"
              onClick={() => {
                setErrorEmail("");
                setErrorEmailBackend("");
                setContraseñaError("");
                setErrorTelefono("");
                setErroNomeOrganizador("");
                setErrorMayorEdad(false);
                onClose();
              }}
            >
              Cerrar
            </Button>
            <Button 
              className="reserva-entrada-btn" 
              disabled={loading}
              onClick={async()=>{
                setLoading(true);
                const ok = await enviarDatosBackend(); 
                setLoading(false);
                if (!ok) return;
                handleOpenVerificacionEmail();
              }}
            >
              {loading ? "Creando..." : "Crear Cuenta"}
            </Button>
          </div>
        </Modal.Footer>
      </Modal>
      <EmailVerificationModal show= {showVerificacionEmail} onClose={handleCloseVerificacionEmail}/>
    </>
  );
}

export default CreateAccountModal;
