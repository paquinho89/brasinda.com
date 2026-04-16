import React, { useState } from "react";
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
  const navigate = useNavigate();

  // Limpeza de prezos de zona se o evento é gratuíto
  React.useEffect(() => {
    const isGratis = (!evento.precio || parseFloat(evento.precio) === 0) && (!evento.precios_zona || Object.values(evento.precios_zona).every(p => parseFloat((p as string).replace(',', '.')) === 0));
    if (isGratis && evento.precios_zona && Object.keys(evento.precios_zona).length > 0) {
      evento.precios_zona = {};
    }
  }, [evento.precio, evento.precios_zona]);

  const handleConfirmCreate = async () => {
    setIsSubmitting(true);
    setError("");

    const precioBackend =
      evento.precio && evento.precio !== ""
        ? evento.precio.replace(",", ".")
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
    formData.append("localizacion", evento.lugar);
    formData.append("tipo_localizacion", evento.ubicacion);
    formData.append("entradas_venta", evento.entradas.toString());
    if (precioBackend !== null) formData.append("prezo_evento", precioBackend);
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

    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(`${API_BASE_URL}/crear-eventos/`, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Erro ao crear o evento");

      const data = await response.json();
      localStorage.removeItem("eventoDraft");
      // Suponse que o backend devolve o id do evento como data.id
      navigate("/publicacion-exitosa", { state: { eventoId: data.id } });
    } catch (error) {
      console.error(error);
      setError("Erro ao crear o evento. Por favor, inténtao de novo.");
      setIsSubmitting(false);
    }
  };

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
          ) : ((evento.precio && parseFloat(evento.precio) > 0) || (evento.precios_zona && Object.values(evento.precios_zona).some(p => parseFloat((p as string).replace(',', '.')) > 0))) ? (
            <div className="row mb-3">
              <div className="col-12">
                <table className="table table-bordered w-100" style={{ background: '#f8f9fa', margin: 0 }}>
                  <tbody>
                    {evento.precio && parseFloat(evento.precio) > 0 && (
                      <tr>
                        <th style={{ width: '50%' }}>Prezo</th>
                        <td>{evento.precio} €</td>
                      </tr>
                    )}
                    {evento.precio && parseFloat(evento.precio) > 0 && evento.tipo_gestion_entrada === "pagina" && (
                      <>
                        <tr>
                          <th>PVP</th>
                          <td>{(parseFloat(evento.precio.replace(',', '.')) * 1.05).toFixed(2).replace('.', ',')} €</td>
                        </tr>
                        <tr>
                          <td colSpan={2} style={{ fontSize: '0.95em', color: '#888', textAlign: 'right', borderTop: 'none' }}>
                            *Gastos xestión: 5%
                          </td>
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
                            {evento.tipo_gestion_entrada === 'pagina' ? (
                              <td>{(parseFloat((prezo as string).replace(',', '.')) * 1.05).toFixed(2).replace('.', ',')} €</td>
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
