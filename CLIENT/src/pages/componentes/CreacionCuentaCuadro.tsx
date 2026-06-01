import { Modal, Button, Form, InputGroup } from "react-bootstrap";
import { useState } from "react";
import EmailVerificationModal from "./1VerificacionEmailCreacionCuenta"
import "../../estilos/Botones.css";
import { FaEnvelope, FaLock, FaUser, FaCamera, FaTag, FaBriefcase, FaIdCard, FaGlobe } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";
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
  const [apelidosOrganizador, setApelidosOrganizador] = useState("");
  const [erroApelidosOrganizador, setErroApelidosOrganizador] = useState("");
  const [tipoOrganizador, setTipoOrganizador] = useState("");
  const [erroTipoOrganizador, setErroTipoOrganizador] = useState("");
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [erroNomeEmpresa, setErroNomeEmpresa] = useState("");
  const [webEmpresa, setWebEmpresa] = useState("");

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
  if (!nombreOrganizador.trim()){
    setErroNomeOrganizador("invalidoNomeOrganizador");
    return false;
  }
  if (!apelidosOrganizador.trim()) {
    setErroApelidosOrganizador("invalidoApelidosOrganizador");
    return false;
  }
  if (!tipoOrganizador){
    setErroTipoOrganizador("invalidoTipoOrganizador");
    return false;
  }
  const requireNomeEmpresa = ["Autónomo", "Empresa", "Asociación"].includes(tipoOrganizador);
  if (requireNomeEmpresa && !nomeEmpresa.trim()) {
    setErroNomeEmpresa("invalidoNomeEmpresa");
    return false;
  }

  const formData = new FormData();
  formData.append("email", email);
  formData.append("username", email.split("@")[0]);
  formData.append("nome_organizador", nombreOrganizador);
  formData.append("apelidos_organizador", apelidosOrganizador);
  formData.append("tipo_organizador", tipoOrganizador);
  formData.append("nome_empresa", nomeEmpresa);
  formData.append("web_empresa", webEmpresa);
  formData.append("password", contraseña);
  if (fotoOrganizador) {
    formData.append("foto_organizador", fotoOrganizador);
  }

  const response = await fetch(`${API_BASE_URL}/organizador/crear-organizador/`, {
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
    const response = await fetch(`${API_BASE_URL}/organizador/auth/google/`, {
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

          <div className="row mb-3">
            <div className="col-12 col-md-6">
              <Form.Group>
                <FaUser style={{ marginRight: "6px", color: "#ff0093" }} />
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Nome"
                  value={nombreOrganizador}
                  onChange={(e) => {
                    const value = e.target.value;
                    setNombreOrganizador(value);
                    if (value === "") {
                      setErroNomeOrganizador("invalidoNomeOrganizador");
                    } else {
                      setErroNomeOrganizador("");
                    }
                  }}
                />
              </Form.Group>
            </div>
            <div className="col-12 col-md-6 mt-3 mt-md-0">
              <Form.Group>
                <FaIdCard style={{ marginRight: "6px", color: "#ff0093" }} />
                <Form.Label>Apelidos</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Apelidos"
                  value={apelidosOrganizador}
                  onChange={(e) => {
                    const value = e.target.value;
                    setApelidosOrganizador(value);
                    if (value === "") {
                      setErroApelidosOrganizador("invalidoApelidosOrganizador");
                    } else {
                      setErroApelidosOrganizador("");
                    }
                  }}
                />
              </Form.Group>
            </div>
          </div>

          <Form.Group className="mb-3">
              <FaTag style={{ marginRight: "6px", color: "#ff0093" }} />
            <Form.Label>Tipo de organizador</Form.Label>
            <Form.Select
              value={tipoOrganizador}
              onChange={(e) => {
                setTipoOrganizador(e.target.value);
                setErroTipoOrganizador("");
                setErroNomeEmpresa("");
                if (!["Autónomo", "Empresa", "Asociación"].includes(e.target.value)) {
                  setWebEmpresa("");
                }
              }}
            >
              <option value="">Selecciona unha opción</option>
              <option value="Particular">Particular</option>
              <option value="Autónomo">Autónomo</option>
              <option value="Empresa">Empresa</option>
              <option value="Asociación">Asociación</option>
            </Form.Select>
          </Form.Group>

          {(["Autónomo", "Empresa", "Asociación"].includes(tipoOrganizador)) && (
            <>
              <Form.Group className="mb-3">
                <FaBriefcase style={{ marginRight: "6px", color: "#ff0093" }} />
                <Form.Label>
                  {tipoOrganizador === "Autónomo"
                    ? "Nome comercial"
                    : tipoOrganizador === "Empresa"
                      ? "Nome da empresa"
                      : "Nome da asociación"}
                </Form.Label>
                <Form.Control
                  type="text"
                  placeholder={
                    tipoOrganizador === "Autónomo"
                      ? "Introduce o nome comercial"
                      : tipoOrganizador === "Empresa"
                        ? "Introduce o nome da empresa"
                        : "Introduce o nome da asociación"
                  }
                  value={nomeEmpresa}
                  onChange={(e) => {
                    setNomeEmpresa(e.target.value);
                    if (e.target.value.trim()) {
                      setErroNomeEmpresa("");
                    }
                  }}
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <FaGlobe style={{ marginRight: "6px", color: "#ff0093" }} />
                <Form.Label>Sitio web (opcional)</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="https://..."
                  value={webEmpresa}
                  onChange={(e) => setWebEmpresa(e.target.value)}
                />
              </Form.Group>
            </>
          )}

          {erroNomeOrganizador === "invalidoNomeOrganizador" && (
            <div className="alert alert-danger">
              Por favor, introduce tú nombre de organizador
            </div>
          )}

          {erroApelidosOrganizador === "invalidoApelidosOrganizador" && (
            <div className="alert alert-danger">
              Por favor, introduce os apelidos do organizador
            </div>
          )}

          {erroTipoOrganizador === "invalidoTipoOrganizador" && (
            <div className="alert alert-danger">
              Por favor, escolle o tipo de organizador
            </div>
          )}

          {erroNomeEmpresa === "invalidoNomeEmpresa" && (
            <div className="alert alert-danger">
              Por favor, introduce o nome correspondente
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
                setErroNomeOrganizador("");
                setErroApelidosOrganizador("");
                setErroTipoOrganizador("");
                setErroNomeEmpresa("");
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
