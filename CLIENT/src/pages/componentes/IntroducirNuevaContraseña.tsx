import API_BASE_URL from "../../utils/api";
import { Button, Form, InputGroup } from "react-bootstrap";
import { FaLock } from "react-icons/fa";
import { useState, useContext } from "react";
import { NavBarMessageContext } from "./NavBar";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

interface IntroducirNuevaContraseñaProps {
  entryPoint?: "publish" | "panel";
}

function IntroducirNuevaContraseña({ entryPoint }: IntroducirNuevaContraseñaProps) {
  const { uid, token } = useParams<{ uid: string; token: string }>();
  const navigate = useNavigate();

  const [contraseña, setContraseña] = useState("");
  const [showContraseña, setShowContraseña] = useState(false);
  const validarContraseña = (pass: string) => {
    if (!pass) return "La contraseña es obligatoria";
    if (pass.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (!/[A-Z]/.test(pass)) return "Debe incluir al menos una letra mayúscula";
    if (!/[a-z]/.test(pass)) return "Debe incluir al menos una letra minúscula";
    if (!/[0-9]/.test(pass)) return "Debe incluir al menos un número";
    return ""; // ✅ si todo está bien
    };
  const [error, setError] = useState("");
  // const [success, setSuccess] = useState("");
  const { setMessage } = useContext(NavBarMessageContext);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const errorValidacion = validarContraseña(contraseña);

    if (errorValidacion) {
      setError(errorValidacion);
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${API_BASE_URL}/organizador/reset-password/${uid}/${token}/`,
        { password : contraseña }
      );
      localStorage.setItem(
        `organizador",
        JSON.stringify(response.data.organizador)
        );
      setContraseña("");
      setMessage("Contrasinal cambiado correctamente. Xa podes crear o teu evento.");
      if (entryPoint === "panel") {
        navigate("/panel-organizador");
      } else {
        navigate("/crear-evento/tipo");
      }
      setTimeout(() => {
        setMessage("");
      }, 6000);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Ocurrió un error. Intenta nuevamente.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto" }}>
      <h2 className="mb-4 text-center">Nueva contraseña</h2>

      <Form.Group className="mb-3">
        <Form.Label>
          <FaLock style={{ color: '#ff0093', marginRight: 7, marginBottom: 2 }} />
          Contrasinal:
        </Form.Label>
        <InputGroup>
        <Form.Control
            type={showContraseña ? "text" : "password"}   //aquí enmascara o texto
            placeholder="Introduce o teu contrasinal"
            value={contraseña}
            onChange={(e) => {
            const value = e.target.value;
            setContraseña(value);
            // Validación en tempo real
            if (value) {
                const error = validarContraseña(value);
                setError(error);
            } else {
                setError("O contrasinal é obrigatorio");
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
        {error && <div className = "alert alert-danger mt-3">{error}</div>}
        {/* Mensaxe de éxito móstrase agora na NavBar */}
        <Button 
            className="reserva-entrada-btn mt-4 w-100" 
            onClick={handleSubmit}
            disabled={loading}
        >
            {loading ? "Enviando..." : "Cambiar contraseña"}
        </Button>
    </Form.Group>
    </div>
  );
}

export default IntroducirNuevaContraseña;
