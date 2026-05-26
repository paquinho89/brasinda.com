import React from "react";
import { useAuthModal } from "../../context/AuthModalContext";
import LoginModalCrearEvento from "./InicioSesionCrearEventoCuadro";

const GlobalLoginModal: React.FC = () => {
  const { showLoginModal, hideLogin } = useAuthModal();
  return (
    <LoginModalCrearEvento show={showLoginModal} onClose={hideLogin} />
  );
};

export default GlobalLoginModal;
