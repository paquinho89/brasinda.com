import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";
import MainNavbar from "../componentes/NavBar";
import { FaUser, FaEnvelope, FaGlobe, FaLock, FaExclamationTriangle, FaArrowLeft, FaSave, FaPhone, FaEye, FaEyeSlash, FaIdCard, FaMapMarkerAlt, FaTag, FaBriefcase } from "react-icons/fa";
import API_BASE_URL from "../../utils/api";
import "../../estilos/Botones.css";
import { Modal } from "react-bootstrap";

interface OrganizadorData {
  id: number;
  email: string;
  nome_organizador: string;
  apelidos_organizador?: string;
  tipo_organizador?: string;
  nome_empresa?: string;
  web_empresa?: string;
  telefono: string;
  idioma?: string;
  nif_cif?: string;
  enderezo_fiscal?: string;
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
    apelidos_organizador: "",
    tipo_organizador: "",
    nome_empresa: "",
    web_empresa: "",
    telefono: "",
    idioma: "galego",
    nif_cif: "",
    enderezo_fiscal: "",
  });

  const [originalData, setOriginalData] = useState<OrganizadorData>({
    id: 0,
    email: "",
    nome_organizador: "",
    apelidos_organizador: "",
    tipo_organizador: "",
    nome_empresa: "",
    web_empresa: "",
    telefono: "",
    idioma: "galego",
    nif_cif: "",
    enderezo_fiscal: "",
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
        apelidos_organizador: form.apelidos_organizador,
        tipo_organizador: form.tipo_organizador,
        nome_empresa: form.nome_empresa,
        web_empresa: form.web_empresa,
        email: form.email,
        telefono: form.telefono,
        idioma: form.idioma,
        nif_cif: form.nif_cif,
        enderezo_fiscal: form.enderezo_fiscal,
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
      // Aseguramos que todos os campos existen no estado tras PATCH
      setForm(prev => ({
        ...prev,
        ...data
      }));
      setOriginalData(prev => ({
        ...prev,
        ...data
      }));
      setIsEditing(false);
      setShowPasswordSection(false);
      setNewPassword("");
      setConfirmPassword("");
      // Eliminada a alerta de éxito
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
            <span className="volver-texto">Volver</span>
          </button>
          {/* The .volver-texto CSS is now in Botones.css */}
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

          {/* Apelidos */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaIdCard style={{ color: "#000" }} />
              Apelidos
            </label>
            {isEditing ? (
              <input
                type="text"
                name="apelidos_organizador"
                value={form.apelidos_organizador || ""}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.apelidos_organizador || ""}</p>
            )}
          </div>

          {/* Tipo organizador */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaTag style={{ color: "#000" }} />
              Tipo de organizador
            </label>
            {isEditing ? (
              <select
                name="tipo_organizador"
                value={form.tipo_organizador || ""}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              >
                <option value="">Selecciona unha opción</option>
                <option value="Particular">Particular</option>
                <option value="Autónomo">Autónomo</option>
                <option value="Empresa">Empresa</option>
                <option value="Asociación">Asociación</option>
              </select>
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.tipo_organizador || ""}</p>
            )}
          </div>

          {/* Nome empresa/comercial/asociación e web */}
          {(["Autónomo", "Empresa", "Asociación"].includes(form.tipo_organizador || "")) && (
            <>
              <div className="mb-4">
                <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaBriefcase style={{ color: "#000" }} />
                  {form.tipo_organizador === "Autónomo"
                    ? "Nome comercial"
                    : form.tipo_organizador === "Empresa"
                      ? "Nome da empresa"
                      : "Nome da asociación"}
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="nome_empresa"
                    value={form.nome_empresa || ""}
                    onChange={handleChange}
                    className="form-control"
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.nome_empresa || ""}</p>
                )}
              </div>

              <div className="mb-4">
                <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <FaGlobe style={{ color: "#000" }} />
                  Sitio web
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    name="web_empresa"
                    value={form.web_empresa || ""}
                    onChange={handleChange}
                    className="form-control"
                    placeholder="https://..."
                    style={{ borderRadius: "8px" }}
                  />
                ) : (
                  <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.web_empresa || ""}</p>
                )}
              </div>
            </>
          )}

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
          {/* NIF/CIF */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaIdCard style={{ color: "#000" }} />
              NIF/CIF
            </label>
            {isEditing ? (
              <input
                type="text"
                name="nif_cif"
                value={form.nif_cif || ""}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.nif_cif || ""}</p>
            )}
          </div>

          {/* Enderezo fiscal */}
          <div className="mb-4">
            <label style={{ fontWeight: 600, marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
              <FaMapMarkerAlt style={{ color: "#000" }} />
              Enderezo fiscal
            </label>
            {isEditing ? (
              <input
                type="text"
                name="enderezo_fiscal"
                value={form.enderezo_fiscal || ""}
                onChange={handleChange}
                className="form-control"
                style={{ borderRadius: "8px" }}
              />
            ) : (
              <p style={{ fontSize: "1rem", color: "#666", marginBottom: 0 }}>{form.enderezo_fiscal || ""}</p>
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
