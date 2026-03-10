import { Modal, Button } from "react-bootstrap";
import { FaGlobe } from "react-icons/fa";
import "../../estilos/Botones.css";
import { useLanguage } from "../LanguageContext";

interface IdiomaModalProps {
  show: boolean;
  onClose: () => void;
}

function IdiomaModal({ show, onClose }: IdiomaModalProps) {
  const { language, setLanguage } = useLanguage();

  const idiomas = [
    { code: "gl" as const, label: "Galego", flag: "💀" }, // Só caveira
    { code: "es" as const, label: "Castellano", flag: "🇪🇸" },
    { code: "en" as const, label: "English", flag: "🇬🇧" },
  ];

  const handleSelect = (code: "gl" | "es" | "en") => {
    setLanguage(code);
    onClose();
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>
          <FaGlobe style={{ marginRight: "8px", color: "#ff0093" }} />
          Cambiar idioma
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="d-flex flex-row gap-2 justify-content-center">
          {idiomas.map((idioma) => (
            <Button
              key={idioma.code}
              onClick={() => handleSelect(idioma.code)}
              className={`reserva-entrada-btn${language === idioma.code ? '' : ' bg-white'}`}
              style={{
                borderColor: language === idioma.code ? "#ff0093" : "#dddddd",
                color: language === idioma.code ? "#ff0093" : "#222222",
                fontWeight: language === idioma.code ? "600" : "400",
                minWidth: 120,
                fontSize: "1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                boxShadow: language === idioma.code ? "0 2px 6px rgba(255,0,147,0.15)" : undefined,
                backgroundColor: language === idioma.code ? "#ffe6f2" : "#fff",
                transition: "all 0.2s ease",
              }}
            >
              <span style={{ fontSize: "1.3em", marginRight: 6 }}>{idioma.flag}</span>
              {idioma.label}
            </Button>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
}

export default IdiomaModal;
