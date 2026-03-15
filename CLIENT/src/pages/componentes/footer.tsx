import { Container, Row, Col } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaFacebook, FaTwitter, FaInstagram, FaEnvelope } from "react-icons/fa";

function Footer() {
  const navigate = useNavigate();
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{
      backgroundColor: "#eef1f4",
      borderTop: "1px solid #e5e5e5",
      marginTop: "4rem",
      paddingTop: "3rem",
      paddingBottom: "2rem"
    }}>
      <Container>
        <Row className="g-4">
          {/* Columna 1: Marca */}
          <Col md={4} sm={12}>
            <h5 style={{ 
              fontWeight: 800, 
              fontSize: "1.5rem", 
              color: "#ff0093",
              marginBottom: "1rem"
            }}>
              brasinda.com
            </h5>
            <p style={{ color: "#666", fontSize: "0.95rem" }}>
              Eventos únicos para xente única.
            </p>
            <div style={{ display: "flex", gap: "1rem", marginTop: "1.5rem" }}>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" 
                style={{ color: "#ff0093", fontSize: "1.3rem", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#d1007a"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#ff0093"}>
                <FaFacebook />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer"
                style={{ color: "#ff0093", fontSize: "1.3rem", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#d1007a"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#ff0093"}>
                <FaTwitter />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer"
                style={{ color: "#ff0093", fontSize: "1.3rem", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#d1007a"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#ff0093"}>
                <FaInstagram />
              </a>
              <a href="mailto:contacto@eventospink.com"
                style={{ color: "#ff0093", fontSize: "1.3rem", transition: "color 0.2s" }}
                onMouseEnter={(e) => e.currentTarget.style.color = "#d1007a"}
                onMouseLeave={(e) => e.currentTarget.style.color = "#ff0093"}>
                <FaEnvelope />
              </a>
            </div>
          </Col>

          {/* Columna 2: Legal */}
          <Col md={4} sm={6}>
            <h6 style={{ 
              fontWeight: 700, 
              fontSize: "1rem", 
              color: "#222",
              marginBottom: "1rem"
            }}>
              Legal
            </h6>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "0.75rem" }}>
                <a
                  onClick={() => navigate("/politica-privacidade")}
                  style={{ 
                    color: "#666", 
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff0093"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  Política de Privacidade
                </a>
              </li>
              <li style={{ marginBottom: "0.75rem" }}>
                <a
                  onClick={() => navigate("/condicións-uso")}
                  style={{ 
                    color: "#666", 
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff0093"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  Condicións de Uso
                </a>
              </li>
              <li style={{ marginBottom: "0.75rem" }}>
                <a
                  onClick={() => navigate("/cookies")}
                  style={{ 
                    color: "#666", 
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff0093"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  Política de Cookies
                </a>
              </li>
            </ul>
          </Col>

          {/* Columna 3: Compañía */}
          <Col md={4} sm={6}>
            <h6 style={{ 
              fontWeight: 700, 
              fontSize: "1rem", 
              color: "#222",
              marginBottom: "1rem"
            }}>
              Compañía
            </h6>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              <li style={{ marginBottom: "0.75rem" }}>
                <a
                  onClick={() => navigate("/sobre-nos")}
                  style={{ 
                    color: "#666", 
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff0093"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  Sobre Nós
                </a>
              </li>
              <li style={{ marginBottom: "0.75rem" }}>
                <a
                  onClick={() => navigate("/contacto")}
                  style={{ 
                    color: "#666", 
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff0093"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  Contacto
                </a>
              </li>
              <li style={{ marginBottom: "0.75rem" }}>
                <a
                  onClick={() => navigate("/axuda")}
                  style={{ 
                    color: "#666", 
                    textDecoration: "none",
                    cursor: "pointer",
                    fontSize: "0.95rem",
                    transition: "color 0.2s"
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "#ff0093"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "#666"}
                >
                  Centro de Axuda
                </a>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Separador */}
        <hr style={{ 
          margin: "2rem 0 1.5rem", 
          borderColor: "#ddd",
          opacity: 0.5 
        }} />

        {/* Copyright */}
        <Row>
          <Col className="text-center">
            <p style={{ 
              color: "#999", 
              fontSize: "0.9rem",
              margin: 0
            }}>
              © {currentYear} brasinda.com. Todos os dereitos reservados.
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}

export default Footer;