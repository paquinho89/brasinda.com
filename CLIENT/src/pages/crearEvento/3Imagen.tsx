import concertoImg from "../../estilos/fotosEvento/concerto.jpg";
import charlaImg from "../../estilos/fotosEvento/charla.jpg";
import feiraImg from "../../estilos/fotosEvento/feira.jpg";
import festivalImg from "../../estilos/fotosEvento/festival.jpg";
import foliadaImg from "../../estilos/fotosEvento/foliada.jpg";
import monologoImg from "../../estilos/fotosEvento/monologo.jpg";
import teatroImg from "../../estilos/fotosEvento/teatro.jpeg";
import musicalImg from "../../estilos/fotosEvento/musical.jpg";
import outrosImg from "../../estilos/fotosEvento/outros.jpg";
import coloquioImg from "../../estilos/fotosEvento/coloquio.jpg";
import cenaComidaImg from "../../estilos/fotosEvento/cena_comida.webp";

export function getDefaultImage(tipo: string) {
  if (!tipo) return outrosImg;
  const normalized = tipo.trim().toLowerCase();
  if (normalized === "concerto") return concertoImg;
  if (normalized === "charla") return charlaImg;
  if (normalized === "feira") return feiraImg;
  if (normalized === "festival") return festivalImg;
  if (normalized === "foliada") return foliadaImg;
  if (normalized === "monólogo" || normalized === "monologo") return monologoImg;
  if (normalized === "obra de teatro" || normalized === "teatro") return teatroImg;
  if (normalized === "musical") return musicalImg;
  if (normalized === "coloquio") return coloquioImg;
  if (normalized === "xantar/cea popular" || normalized.includes("cea") || normalized.includes("xantar")) return cenaComidaImg;
  if (normalized === "outros") return outrosImg;
  return outrosImg;
}

// Devuelve un File a partir de la imagen por defecto (importada como url)
export async function getDefaultImageFile(tipo: string): Promise<File | null> {
  const url = getDefaultImage(tipo);
  if (!url) return null;
  const response = await fetch(url);
  const blob = await response.blob();
  // El nombre del archivo será el nombre del tipo o "default.jpg"
  const normalized = (tipo || "default").replace(/\s+/g, "_").toLowerCase();
  return new File([blob], `${normalized}.jpg`, { type: blob.type });
}
import { Container, Card, Form, Button, Image } from "react-bootstrap";
import { useNavigate, useOutletContext } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import { useRef } from "react";

export default function Imagen() {
  const navigate = useNavigate();
  const { evento, setEvento }: any = useOutletContext();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setEvento({ ...evento, imagen: file });
  };

  const handleRemoveImage = () => {
    setEvento({ ...evento, imagen: null });
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Container className="py-5 d-flex justify-content-center">
      <Card className="shadow-sm" style={{ maxWidth: "600px", width: "100%" }}>
        <Card.Body className="p-4">

          {/* Flecha de retroceso */}
          <div className="mb-3 d-flex justify-content-between align-items-center">
            <Button
              className="boton-avance"
              onClick={() => navigate(-1)}
            >
              <FaArrowLeft className="me-2" />
              Volver
            </Button>
            <Button
              className="reserva-entrada-btn"
              onClick={() => navigate("/crear-evento/fecha")}
            >
              Continuar
            </Button>
          </div>

          <h3 className="text-center mb-2">Cartel ou imaxe do evento</h3>
          <p className="text-muted text-center mb-4">
            Sube unha imaxe atractiva para promocionar o teu evento.
          </p>

          <Form>
            <Form.Group className="mb-3">
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: "none" }}
              />

              <div
                className="form-control d-flex align-items-center p-0"
                style={{ overflow: "hidden", cursor: "pointer" }}
                onClick={() => fileInputRef.current?.click()}
              >
                <button
                  type="button"
                  className="btn btn-light rounded-0 border-0 border-end px-3"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                >
                  Buscar
                </button>
                <span className="text-muted px-3 text-truncate" style={{ maxWidth: "100%" }}>
                  {evento.imagen ? evento.imagen.name : "Imaxen non seleccionada"}
                </span>
              </div>
            </Form.Group>
            {!evento.imagen && (
              <div className="text-muted" style={{ fontSize: "0.92em", opacity: 0.7, marginTop: "-0.5em", marginBottom: "1em" }}>
                Tipos de arquivo aceptados: JPG, JPEG, PNG, GIF, WEBP, BMP, SVG, ICO, TIFF
              </div>
            )}

            {/* ✅ Previsualización persistente */}
            {evento.imagen && (
              <div className="text-center mb-3">
                <Image
                  src={URL.createObjectURL(evento.imagen)}
                  alt="Previsualización"
                  fluid
                  rounded
                  style={{
                    maxHeight: 300,
                    objectFit: "cover",
                  }}
                />
                <div className="d-flex justify-content-between align-items-center mt-2" style={{ width: "100%" }}>
                  <p className="text-success m-0 text-start" style={{ maxWidth: "75%" }}>
                    📎 Imaxe seleccionada: {evento.imagen.name}
                  </p>
                  <button
                    type="button"
                    className="badge-prezo"
                    onClick={handleRemoveImage}
                  >
                    Eliminar imaxe
                  </button>
                </div>
              </div>
            )}
            <div className="d-flex justify-content-end mt-4">
              <Button
                className="reserva-entrada-btn"
                onClick={() => navigate("/crear-evento/fecha")}
              >
                Continuar
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>
    </Container>
  );
}
