import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import MainNavbar from "../componentes/NavBar";
import { FaUser, FaEnvelope, FaUniversity, FaGlobe, FaLock, FaExclamationTriangle, FaArrowLeft, FaSave, FaPhone, FaEye, FaEyeSlash } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";
import "../../estilos/Botones.css";
import { Modal } from "react-bootstrap";

interface OrganizadorData {
  id: number;
  email: string;
  nome_organizador: string;
  telefono: string;
  numero_iban?: string;
  idioma?: string;
}

export default function SettingsOrganizador() {
  const navigate = useNavigate();
  const { token, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswordSection, setShowPasswordSection] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [form, setForm] = useState<OrganizadorData>({
    id: 0,
    email: "",
    nome_organizador: "",
    telefono: "",
    numero_iban: "",
    idioma: "galego",
  });

  const [originalData, setOriginalData] = useState<OrganizadorData>({
    id: 0,
    email: "",
    nome_organizador: "",
    telefono: "",
    numero_iban: "",
    idioma: "galego",
  });

  useEffect(() => {
    fetchOrganizadorData();
  }, []);

  const fetchOrganizadorData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/organizador/perfil/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error ao cargar datos do organizador");
      }

      const data = await response.json();
      setForm(data);
      setOriginalData(data);
    } catch (err: any) {
      setError(err.message || "Error ao cargar datos");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        nome_organizador: form.nome_organizador,
        email: form.email,
        telefono: form.telefono,
        numero_iban: form.numero_iban,
        idioma: form.idioma,
      };

      // Si se cambió la contraseña
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          alert("As contrasinais non coinciden");
          return;
        }
        payload.new_password = newPassword;
      }

      const response = await fetch(`${API_BASE_URL}/organizador/perfil/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error ao gardar cambios");
      }

      const data = await response.json();
      setForm(data);
      setOriginalData(data);
      setIsEditing(false);
      setShowPasswordSection(false);
      setNewPassword("");
      setConfirmPassword("");
      alert("Datos actualizados correctamente");
    } catch (err: any) {
      alert(err.message || "Error ao gardar cambios");
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "ELIMINAR") {
      alert("Debes escribir 'ELIMINAR' para confirmar");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/organizador/perfil/`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Error ao eliminar conta");
      }

      logout();
      navigate("/");
      alert("Conta eliminada correctamente");
    } catch (err: any) {
      alert(err.message || "Error ao eliminar conta");
    }
  };

  const cancelEdit = () => {
    setForm(originalData);
    setIsEditing(false);
    setShowPasswordSection(false);
    setNewPassword("");
    setConfirmPassword("");
  };

  if (loading) {
    return (
      <>
        <MainNavbar />
        <div className="container py-5">
          <p>Cargando...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MainNavbar />
        <div className="container py-5">
          <p className="text-danger">{error}</p>
        </div>
      </>
    );
  }

  return (
    <>
      <MainNavbar />
      <div className="container py-5" style={{ maxWidth: "800px" }}>
        {/* Header */}
        <div className="d-flex align-items-center mb-4">
          <button
            className="boton-avance me-3"
            onClick={() => navigate("/panel-organizador")}
            style={{ padding: "8px 16px" }}
          >
            <FaArrowLeft />
                Volver
          </button>
          <h2 style={{ margin: 0, fontWeight: 700, flex: 1, textAlign: "center" }}>Configuración da Conta</h2>
        </div>

        {/* Card principal */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        >
          {/* Nome */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaUser style={{ color: "#000" }} />
              Nome
            </label>
            {isEditing ? (
              <input
                type="text"
                name="nome_organizador"
                value={form.nome_organizador}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.nome_organizador}</p>
            )}
          </div>

          {/* Email */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaEnvelope style={{ color: "#000" }} />
              Email
            </label>
            {isEditing ? (
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.email}</p>
            )}
          </div>

          {/* Teléfono */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaPhone style={{ color: "#000" }} />
              Teléfono
            </label>
            {isEditing ? (
              <input
                type="tel"
                name="telefono"
                value={form.telefono}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.telefono}</p>
            )}
          </div>

          {/* Cuenta bancaria (IBAN) */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaUniversity style={{ color: "#000" }} />
              Conta Bancaria (IBAN)
            </label>
            {isEditing ? (
              <input
                type="text"
                name="numero_iban"
                value={form.numero_iban || ""}
                onChange={handleChange}
                className="form-control"
                placeholder="ES00 0000 0000 0000 0000 0000"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>
                {form.numero_iban || "Non establecida"}
              </p>
            )}
          </div>

          {/* Idioma */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaGlobe style={{ color: "#000" }} />
              Idioma
            </label>
            {isEditing ? (
              <select
                name="idioma"
                value={form.idioma}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              >
                <option value="galego">Galego</option>
                <option value="español">Español</option>
                <option value="ingles">Inglés</option>
              </select>
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0, textTransform: "capitalize" }}>
                {form.idioma || "Galego"}
              </p>
            )}
          </div>

          {/* Contraseña */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaLock style={{ color: "#000" }} />
              Contraseña
            </label>
            {isEditing ? (
              <>
                {!showPasswordSection ? (
                  <button
                    type="button"
                    className="badge-prezo badge-prezo--clickable"
                    onClick={() => setShowPasswordSection(true)}
                    style={{ cursor: "pointer" }}
                  >
                    Cambiar contraseña
                  </button>
                ) : (
                  <div style={{ marginTop: "10px" }}>
                    <div style={{ position: "relative", marginBottom: "8px" }}>
                      <input
                        type={showNewPassword ? "text" : "password"}
                        placeholder="Nova contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="form-control"
                        style={{ borderRadius: "8px", paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#666",
                          fontSize: "1.2rem"
                        }}
                      >
                        {showNewPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    <div style={{ position: "relative" }}>
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="Confirmar nova contraseña"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="form-control"
                        style={{ borderRadius: "8px", paddingRight: "40px" }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          border: "none",
                          background: "transparent",
                          cursor: "pointer",
                          color: "#666",
                          fontSize: "1.2rem"
                        }}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>••••••••</p>
            )}
          </div>

          {/* Botones de acción */}
          <div className="d-flex gap-2 mt-4">
            {!isEditing ? (
              <button className="reserva-entrada-btn" onClick={() => setIsEditing(true)}>
                Editar Perfil
              </button>
            ) : (
              <>
                <button className="reserva-entrada-btn" onClick={handleSave}>
                  <FaSave /> Gardar Cambios
                </button>
                <button className="boton-avance" onClick={cancelEdit}>
                  Cancelar
                </button>
              </>
            )}
          </div>
        </div>

        {/* Zona de peligro */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: "12px",
            padding: "30px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            marginTop: "30px",
            border: "2px solid #ff0093",
          }}
        >
          <div className="d-flex align-items-center mb-3">
            <FaExclamationTriangle style={{ color: "#ff0093", fontSize: "24px", marginRight: "10px" }} />
            <h4 style={{ margin: 0, color: "#ff0093", fontWeight: 700 }}>Zona de Perigo</h4>
          </div>
          <p style={{ color: "#666", marginBottom: "15px" }}>
            Ao eliminar a túa conta, perderás permanentemente todos os teus datos, eventos e reservas. Esta acción non se pode desfacer.
          </p>
          <button
            className="boton-avance"
            onClick={() => setShowDeleteModal(true)}
          >
            Eliminar Conta
          </button>
        </div>
      </div>

      {/* Modal de confirmación para eliminar cuenta */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton style={{ borderBottom: "1px solid #ccc" }}>
          <Modal.Title style={{ color: "#ff0093", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
            <FaExclamationTriangle />
            Confirmar Eliminación
          </Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ padding: "20px" }}>
          <p style={{ marginBottom: "15px" }}>
            Esta acción é <strong>irreversible</strong>. Perderás todos os teus datos.
          </p>
          <p style={{ marginBottom: "10px" }}>
            Para confirmar, escribe <strong>ELIMINAR</strong> no seguinte campo:
          </p>
          <input
            type="text"
            className="form-control"
            value={deleteConfirmText}
            onChange={(e) => setDeleteConfirmText(e.target.value)}
            placeholder="Escribe ELIMINAR"
            style={{ borderRadius: "8px" }}
          />
        </Modal.Body>
        <Modal.Footer style={{ borderTop: "1px solid #ccc", display: "flex", justifyContent: "space-between" }}>
          <button className="boton-avance" onClick={() => setShowDeleteModal(false)}>
            Cancelar
          </button>
          <button
            className="boton-avance"
            onClick={handleDeleteAccount}
            disabled={deleteConfirmText !== "ELIMINAR"}
          >
            Eliminar Conta
          </button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
