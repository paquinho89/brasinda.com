import { useState, useEffect, useRef } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import API_BASE_URL from "../../utils/api";

export default function VerificacionEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const [token, setToken] = useState(searchParams.get("token") || "");
  const next = searchParams.get("next") || "/panel-organizador";
  const { login } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState<[string, string, string]>(["", "", ""]);
  const [estado, setEstado] = useState<"idle" | "submitting" | "ok" | "erro">("idle");
  const [mensaxe, setMensaxe] = useState("");

  const [resendEstado, setResendEstado] = useState<"idle" | "sending" | "sent" | "erro">("idle");
  const autoSubmitTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const firstDigitRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const codeString = code.join("");
    if (/^[0-9]{3}$/.test(codeString)) {
      if (autoSubmitTimeout.current) {
        clearTimeout(autoSubmitTimeout.current);
      }
      autoSubmitTimeout.current = setTimeout(() => {
        handleVerify();
      }, 200);
    }
    return () => {
      if (autoSubmitTimeout.current) {
        clearTimeout(autoSubmitTimeout.current);
      }
    };
  }, [code]);

  const handleVerify = async () => {
    const codeString = code.join("");
    setMensaxe("");
    if (!email || !token) {
      setEstado("erro");
      setMensaxe("Faltan o email ou o token de verificación.");
      setCode(["", "", ""]);
      firstDigitRef.current?.focus();
      return;
    }
    if (!/^[0-9]{3}$/.test(codeString)) {
      setEstado("erro");
      setMensaxe("Introduce un código de 3 cifras recibido no teu email.");
      setCode(["", "", ""]);
      firstDigitRef.current?.focus();
      return;
    }

    try {
      const resp = await fetch(`${API_BASE_URL}/organizador/login/verify/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: codeString, token }),
      });
      const data = await resp.json();

      if (resp.ok && data.access_token) {
        login(data.organizador, data.access_token, data.refresh_token);
        if (data.refresh_token) {
          localStorage.setItem("refresh_token", data.refresh_token);
        }
        setEstado("ok");
        setMensaxe("Acceso correcto. Redirixindo...");
        setTimeout(() => navigate(next), 1200);
      } else {
        setEstado("erro");
        setMensaxe(data.error || "Código incorrecto.");
        setCode(["", "", ""]);
        firstDigitRef.current?.focus();
      }
    } catch {
      setEstado("erro");
      setMensaxe("Erro de conexión ao servidor.");
      setCode(["", "", ""]);
      firstDigitRef.current?.focus();
    }
  };

  const handleResendCode = async () => {
    if (!email) {
      setEstado("erro");
      setMensaxe("Non hai email dispoñible para reenviar o código.");
      return;
    }

    setResendEstado("sending");
    try {
      const resp = await fetch(`${API_BASE_URL}/organizador/login/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });
      const data = await resp.json();
      if (resp.ok) {
        setResendEstado("sent");
        setMensaxe("Código reenviado. Revisa o teu email.");
        if (data.token) {
          setToken(data.token);
        }
      } else {
        setResendEstado("erro");
        setMensaxe(data.error || "Non se puido reenviar o código.");
      }
    } catch {
      setResendEstado("erro");
      setMensaxe("Erro de conexión ao servidor ao reenviar o código.");
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="card shadow-sm p-4">
        <h2 className="mb-3">Verificación por email</h2>
        <p className="text-muted mb-4">
          Introduce o código de 3 cifras que enviamos ao email <strong>{email}</strong>.
        </p>

        {estado === "erro" && <div className="alert alert-danger">{mensaxe}</div>}
        {estado === "ok" && <div className="alert alert-success">{mensaxe}</div>}

        <div className="mb-4">
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginTop: 8 }}>
            {code.map((digit, index) => (
              <span key={index} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input
                  ref={index === 0 ? firstDigitRef : null}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  className="form-control border-secondary text-center"
                  value={digit}
                  maxLength={1}
                  style={{
                    width: 86,
                    height: 86,
                    fontSize: 30,
                    fontWeight: 700,
                    letterSpacing: 4,
                    borderRadius: 20,
                    borderWidth: 2,
                    borderColor: "#ced4da",
                    padding: "0",
                  }}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    const nextCode = [...code] as [string, string, string];
                    nextCode[index] = value.slice(-1);
                    setCode(nextCode);
                    if (value && index < 2) {
                      const nextInput = document.getElementById(`code-digit-${index + 1}`);
                      nextInput?.focus();
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !code[index] && index > 0) {
                      const prevInput = document.getElementById(`code-digit-${index - 1}`);
                      prevInput?.focus();
                    }
                  }}
                  id={`code-digit-${index}`}
                />
                {index < code.length - 1 && (
                  <span style={{ fontSize: 24, color: "#6c757d", fontWeight: 600 }}>-</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <button
          className="btn btn-primary w-100 mb-3 reserva-entrada-btn"
          type="button"
          onClick={handleVerify}
          disabled={estado === "submitting"}
          style={{ padding: "14px 0", fontSize: 16, borderRadius: 14 }}
        >
          {estado === "submitting" ? "Verificando..." : "Entrar"}
        </button>

        <div className="text-center mb-3">
          <p className="mt-2 text-center text-muted" style={{ fontSize: 14 }}>
            Se non recibes o código, revisa o correo non desexado e verifica que o teu email esté ben escrito.
          </p>
          <button
            type="button"
            className="btn btn-link p-0 mt-2"
            onClick={handleResendCode}
            disabled={resendEstado === "sending"}
            style={{ fontSize: 14 }}
          >
            {resendEstado === "sending" ? "Reenviando..." : "Volver a enviar o código"}
          </button>
        </div>
      </div>
    </div>
  );
}
