import React from "react";
import { useAuthModal } from "../../context/AuthModalContext";
import LoginModalCrearEvento from "./InicioSesionCrearEventoCuadro";

const GlobalLoginModal: React.FC = () => {
  const { showLoginModal, hideLogin, loginRedirectTo } = useAuthModal();
  return (
    <LoginModalCrearEvento
      show={showLoginModal}
      onClose={hideLogin}
      redirectTo={loginRedirectTo ?? "/crear-evento/tipo"}
    />
  );
};

export default GlobalLoginModal;
