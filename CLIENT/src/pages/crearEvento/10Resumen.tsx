import React, { useState } from "react";
import { useApi } from "../../hooks/useApi";
import LoginModalCrearEvento from "../componentes/InicioSesionCrearEventoCuadro";
import { getDefaultImageFile } from "./3Imagen";
import { useOutletContext, useNavigate } from "react-router-dom";
import { Button, Container, Card } from "react-bootstrap";
import type { OutletContext } from "./0ElementoPadre";
import API_BASE_URL from "../../utils/api";
import { FaArrowLeft } from "react-icons/fa";

const Resumen: React.FC = () => {
  const { evento } = useOutletContext<OutletContext>();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const navigate = useNavigate();

  // Limpeza de prezos de zona se o evento é gratuíto
  React.useEffect(() => {
    const isGratis = (!evento.prezo_recibe_organizador || parseFloat(evento.prezo_recibe_organizador) === 0) && (!evento.precios_zona || Object.values(evento.precios_zona).every(p => parseFloat((p as string).replace(',', '.')) === 0));
    if (isGratis && evento.precios_zona && Object.keys(evento.precios_zona).length > 0) {
      evento.precios_zona = {};
    }
  }, [evento.prezo_recibe_organizador, evento.precios_zona]);

  const { apiFetch } = useApi();
  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    setError("");

    // Se hai prezos por zona, establecer o prezo mínimo como prezo principal e prezo_areas a true
    let precioFinal = evento.prezo_recibe_organizador;
    let prezoAreas = false;
    if (evento.precios_zona && Object.values(evento.precios_zona).length > 0) {
      // Filtrar só prezos válidos (>0)
      const prezosValidos = Object.values(evento.precios_zona)
        .map(p => parseFloat((p as string).replace(",", ".")))
        .filter(p => !isNaN(p) && p > 0);
      if (prezosValidos.length > 0) {
        const minPrezo = Math.min(...prezosValidos);
        precioFinal = minPrezo.toFixed(2).replace(".", ",");
        prezoAreas = true;
      }
    }

    const precioBackend =
      precioFinal && precioFinal !== ""
        ? precioFinal.replace(",", ".")
        : null;

    const formData = new FormData();
    formData.append("tipo_evento", evento.tipo);
    formData.append("nome_evento", evento.tituloEvento);
    formData.append("descripcion_evento", evento.descripcionEvento);
    if (evento.imagen) {
      formData.append("imaxe_evento", evento.imagen);
    } else {
      // Engadir a imaxe por defecto como File
      const defaultImgFile = await getDefaultImageFile(evento.tipo);
      if (defaultImgFile) {
        formData.append("imaxe_evento", defaultImgFile);
      }
    }
    formData.append("data_evento", evento.fecha);
    // Gardar datos de contrato se existen
    formData.append("localizacion", evento.lugar);
    formData.append("tipo_localizacion", evento.ubicacion);
    formData.append("entradas_venta", evento.entradas.toString());
    if (precioBackend !== null) formData.append("prezo_evento", precioBackend);
    formData.append("prezo_areas", prezoAreas ? "true" : "false");
    if (evento.tipo_gestion_entrada) formData.append("tipo_gestion_entrada", evento.tipo_gestion_entrada);
    if (evento.procedimiento_cobro_manual) formData.append("procedimiento_cobro_manual", evento.procedimiento_cobro_manual);
    if (evento.localidade) formData.append("localidade", evento.localidade);
    if (evento.nota_lugar) formData.append("nota_lugar", evento.nota_lugar);
    if (evento.coordenadas && evento.coordenadas.length > 0) {
      formData.append("coordenadas", JSON.stringify(evento.coordenadas));
    }
    // Gardar prezos por zona se existen
    if (evento.precios_zona && Object.keys(evento.precios_zona).length > 0) {
      formData.append("precios_zona", JSON.stringify(evento.precios_zona));
    }
    if (evento.duracion !== undefined && evento.duracion !== null && evento.duracion !== 0) {
      formData.append("duracion", String(evento.duracion));
    }
    formData.append(
      "condiciones_confirmacion",
      evento.condicionesConfirmacion ? "true" : "false"
    );
    // NON engadir nomeCompleto, nifCif, enderezoFiscal, telefono ao evento

    try {
      let response = await apiFetch(`${API_BASE_URL}/crear-eventos/`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Erro ao crear o evento");

      const data = await response.json();
      localStorage.removeItem("eventoDraft");
      // Usar url_publico se está dispoñible
      navigate("/publicacion-exitosa", { state: { eventoId: data.id, urlPublica: data.url_publico } });
    } catch (error) {
      setError("Erro ao crear o evento. Por favor, inicia sesión de novo.");
      setIsSubmitting(false);
    }
  };
  <LoginModalCrearEvento show={showLoginModal} onClose={() => setShowLoginModal(false)} />

  const formatDate = (dateString: string) => {
    if (!dateString) return "-";
    try {
      const date = new Date(dateString);
      const data = new Intl.DateTimeFormat("gl-ES", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
      const hora = new Intl.DateTimeFormat("gl-ES", {
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
      const dataCapitalizada =
        data.charAt(0).toUpperCase() + data.slice(1);
      return `${dataCapitalizada} ás ${hora}`;
    } catch {
      return dateString;
    }
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card
        className="shadow-sm"
        style={{ maxWidth: "700px", width: "100%" }}
      >
        <Card.Body className="p-4">
          <h3 className="text-center mb-4">Resumen do evento</h3>
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Tipo de evento:</strong>
              </div>
              <div className="col-md-6">{evento.tipo || "-"}</div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Título:</strong>
              </div>
              <div className="col-md-6">{evento.tituloEvento || "-"}</div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Descripción:</strong>
              </div>
              <div className="col-md-6" style={{ whiteSpace: "pre-wrap" }}>
                {evento.descripcionEvento || "-"}
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Data e hora:</strong>
              </div>
              <div className="col-md-6">{formatDate(evento.fecha)}</div>
            </div>

            {evento.duracion !== undefined && evento.duracion !== null && evento.duracion !== 0 && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Duración:</strong>
                </div>
                <div className="col-md-6">{evento.duracion} min</div>
              </div>
            )}

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Lugar:</strong>
              </div>
              <div className="col-md-6">{evento.lugar || "-"}</div>
            </div>

            {evento.nota_lugar && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Información adicional do lugar:</strong>
                </div>
                <div className="col-md-6">{evento.nota_lugar}</div>
              </div>
            )}

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Tipo de localización:</strong>
              </div>
              <div className="col-md-6">{evento.ubicacion || "-"}</div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Número de entradas:</strong>
              </div>
              <div className="col-md-6">{evento.entradas || "-"}</div>
            </div>

            {evento.tipo_gestion_entrada && evento.tipo_gestion_entrada !== "gratis" && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Xestión do importe:</strong>
                </div>
                <div className="col-md-6">
                  {evento.tipo_gestion_entrada === "pagina"
                    ? "Xestionado a través da páxina"
                    : evento.tipo_gestion_entrada === "manual"
                    ? "Xestionado polo organizador"
                    : "-"}
                </div>
              </div>
            )}

            {evento.imagen && (
              <div className="row mb-3">
                <div className="col-md-6">
                  <strong>Cartel do evento:</strong>
                </div>
                <div className="col-md-6">
                  <img
                    src={URL.createObjectURL(evento.imagen)}
                    alt="Cartel do evento"
                    style={{
                      maxWidth: "200px",
                      maxHeight: "150px",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              </div>
            )}

          {error && (
            <div className="alert alert-danger mb-3">{error}</div>
          )}

          {/* TÁBOA DE PREZO FINAL */}
          {(evento.tipo_gestion_entrada === "gratis") ? (
            <div className="row mb-3">
              <div className="col-md-6">
                <strong style={{ color: '#28a745' }}>Evento Gratuíto</strong>
              </div>
              <div className="col-md-6"></div>
            </div>
          ) : ((evento.prezo_recibe_organizador && parseFloat(evento.prezo_recibe_organizador) > 0) || (evento.precios_zona && Object.values(evento.precios_zona).some(p => parseFloat((p as string).replace(',', '.')) > 0))) ? (
            <div className="row mb-3">
              <div className="col-12">
                <table className="table table-bordered w-100" style={{ background: '#f8f9fa', margin: 0 }}>
                  <tbody>
                    {evento.prezo_recibe_organizador && parseFloat(evento.prezo_recibe_organizador) > 0 && (
                      <tr>
                        <th style={{ width: '50%' }}>Recibes por entrada</th>
                        <td>{evento.prezo_recibe_organizador} €</td>
                      </tr>
                    )}
                    {evento.prezo_recibe_organizador && parseFloat(evento.prezo_recibe_organizador) > 0 && evento.tipo_gestion_entrada === "pagina" && (
                      <>
                        <tr>
                          <th>Prezo Venta</th>
                          <td>{evento.prezo_venta || evento.prezo_recibe_organizador} €</td>
                        </tr>
                      </>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {/* TÁBOA DE PREZOS POR ZONA */}
          {(evento.precios_zona && Object.keys(evento.precios_zona).length > 0 && Object.values(evento.precios_zona).some(p => parseFloat((p as string).replace(',', '.')) > 0)) && (
            <div className="row mb-3">
              <div className="col-12">
                <table className="table table-bordered w-100" style={{ background: '#f8f9fa', margin: 0 }}>
                  <thead>
                    <tr>
                      <th style={{ width: evento.tipo_gestion_entrada === 'pagina' ? '40%' : '50%' }}>Zona</th>
                      <th style={{ width: evento.tipo_gestion_entrada === 'pagina' ? '30%' : '50%' }}>Prezo</th>
                      {evento.tipo_gestion_entrada === 'pagina' ? (
                        <th style={{ width: '30%' }}>PVP</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(evento.precios_zona).map(([zona, prezo]) => {
                      if (parseFloat((prezo as string).replace(',', '.')) > 0) {
                        return (
                          <tr key={zona}>
                            <td>{zona}</td>
                            <td>{prezo} €</td>
                            {evento.tipo_gestion_entrada === 'pagina' && evento.prezo_venta ? (
                              <td>{(() => {
                                const baseZ = parseFloat((prezo as string).replace(',', '.'));
                                const prezo_venta = (baseZ * 0.05)+ (baseZ * 0.05)*0.21; // 5% gastos xestión + 21% IVE sobre os gastos
                                
                                return prezo_venta.toFixed(2).replace('.', ',');
                              })()} €</td>
                            ) : null}
                          </tr>
                        );
                      }
                      return null;
                    })}
                  </tbody>
                </table>
                {evento.tipo_gestion_entrada === 'pagina' && (
                  <div style={{ fontSize: '0.95em', color: '#888', textAlign: 'right', marginTop: 4 }}>
                    *Gastos de xestión: 5%
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="d-flex justify-content-between mt-4">
            <Button
              className="boton-avance"
              onClick={() => navigate(-1)}
              disabled={isSubmitting}
            >
              <FaArrowLeft className="me-2" />
              Volver
            </Button>

            <Button
              className="reserva-entrada-btn"
              onClick={handleConfirmCreate}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creando..." : "Publicar evento"}
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Resumen;
