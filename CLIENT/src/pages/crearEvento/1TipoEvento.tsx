import { Container, Card, Row, Col } from "react-bootstrap";
import { useNavigate, useOutletContext, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../AuthContext";
import { useContext } from "react";
import { NavBarMessageContext } from "../componentes/NavBar";

const TIPOS_EVENTO = [
  "Concerto",
  "Obra de Teatro",
  "Musical",
  "Monólogo",
  "Coloquio",
  "Xantar/Cea Popular",
  "Foliada",
  "Festival",
  "Feira",
  "Charla",
  "Outros",
];

export default function TipoEvento() {
  const navigate = useNavigate();
  const { evento, setEvento }: any = useOutletContext();
  const location = useLocation();
  const { login } = useAuth();
  const [verificando, setVerificando] = useState(false);
  const [verificado, setVerificado] = useState(false);
  const [erro, setErro] = useState("");
  const { setMessage } = useContext(NavBarMessageContext);

  useEffect(() => {
    // Detectar uid e token na URL
    const params = new URLSearchParams(location.search);
    const uid = params.get("uid");
    const token = params.get("token");
    if (uid && token && !verificado && !verificando) {
      setVerificando(true);
      axios
        .get(`http://localhost:8000/organizador/verificar/${uid}/${token}/`)
        .then((res) => {
          if (res.data && res.data.access_token && res.data.organizador) {
            // Store refresh token if present
            login(
              res.data.organizador,
              res.data.access_token,
              res.data.refresh_token ? res.data.refresh_token : undefined
            );
            setVerificado(true);
            setMessage("Conta verificada correctamente. Xa podes publicar o teu primeiro evento!");
            setTimeout(() => {
              setVerificando(false);
              setMessage("");
            }, 6000);
          } else {
            setErro("Erro ao verificar conta");
            setVerificando(false);
          }
        })
        .catch(() => {
          setErro("Erro ao verificar conta");
          setVerificando(false);
        });
    }
  }, [location.search, login, verificado, verificando]);

  const seleccionarTipo = (tipoEvento: string) => {
    setEvento({ ...evento, tipo: tipoEvento });
    navigate("/crear-evento/titulo"); // seguinte paso
  };
  console.log("Evento no tipo:", evento);

  return (
    <Container className="py-5">
      <h3 className="text-center mb-4">Qué tipo de evento queres organizar?</h3>
      {/* Mensaxe de verificación agora móstrase na NavBar */}
      {erro && (
        <div style={{ color: "red", fontWeight: 600, fontSize: "1.15rem", marginBottom: 18 }}>
          {erro}
        </div>
      )}
      <Row className="g-4">
        {TIPOS_EVENTO.map((tipo) => (
          <Col md={4} sm={6} xs={12} key={tipo}>
            <Card
              className={`h-100 text-center shadow-sm tipo-card ${
                evento.tipo === tipo ? "tipo-card-selected" : "" 
              }`}
              style={{
                cursor: "pointer",
                minHeight: "120px",
                display: "flex",
                justifyContent: "center",
              }}
              onClick={() => seleccionarTipo(tipo)}
            >
              <Card.Body className="d-flex align-items-center justify-content-center">
                <h5 className="mb-0">{tipo}</h5>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
}
