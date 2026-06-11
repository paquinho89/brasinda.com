import { useState } from "react";
import { Button, Card, ListGroup } from "react-bootstrap";
import CreateAccountModal from "./CreacionCuentaCuadro";
import LoginModal from "./InicioSesionCrearEventoCuadro";
import RecuperarEntradaModal from "./RecuperarEntradaCuadro"
import "../../estilos/Botones.css";
import { FaSignInAlt, FaUserPlus, FaTicketAlt } from "react-icons/fa";



function ToggleHamburguer() {
  const [open, setOpen] = useState(false);
  const [showCreateAccount, setShowCreateAccount] = useState(false);
  const [showLogIn, setShowLogIn] = useState(false);
  const [showRecuperacionEntradas, setShowRecuperacionEntradas] = useState(false);
 
  const handleOpenCreateAccount = () => { setShowCreateAccount(true); setOpen(false); };
  const handleCloseCreateAccount = () => setShowCreateAccount(false);
  const handleOpenLogIn = () => { setShowLogIn(true); setOpen(false); };
  const handleCloseLogIn = () => setShowLogIn(false);
  const handleOpenRecuperacionEntradas = () => { setShowRecuperacionEntradas(true); setOpen(false); };
  const handleCloseRecuperacionEntradas = () => setShowRecuperacionEntradas(false);

  return (
    <div style={{ position: "relative" }}>
      <Button onClick={() => setOpen(!open)} className= "toggle-hamburguer">
        {/* 3 rayitas */}
        <span className="hamburguer-line" />
        <span className="hamburguer-line" />
        <span className="hamburguer-line" />
      </Button>

      {/* Menú desplegable circular */}
      {open && (
        <>
            <Card className="toggle-card">
            <ListGroup variant="flush">
                <ListGroup.Item action onClick={handleOpenLogIn}>
                  <FaSignInAlt style={{ marginRight: "8px", color: "#ff0093" }} />
                  Iniciar sesión organizador
                </ListGroup.Item>
                <ListGroup.Item action onClick={handleOpenCreateAccount}>
                  <FaUserPlus style={{ marginRight: "8px", color: "#ff0093" }} />
                  Crear conta organizador
                </ListGroup.Item>
                <ListGroup.Item action onClick={handleOpenRecuperacionEntradas} className="seccion-secundaria">
                  <FaTicketAlt style={{ marginRight: "8px", color: "#ff0093" }} />
                  Imprimir entradas
                </ListGroup.Item>
            </ListGroup>
            </Card>
        </>
      )}
      <LoginModal show={showLogIn} onClose={handleCloseLogIn} redirectTo="/panel-organizador"/>
      <CreateAccountModal show={showCreateAccount} onClose={handleCloseCreateAccount}/>
      <RecuperarEntradaModal show={showRecuperacionEntradas} onClose={handleCloseRecuperacionEntradas}/>
    </div>
  );
}

export default ToggleHamburguer;
