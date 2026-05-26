import React, { createContext, useContext, useState, useCallback } from "react";

interface AuthModalContextType {
  showLoginModal: boolean;
  showLogin: () => void;
  hideLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);

  const showLogin = useCallback(() => setShowLoginModal(true), []);
  const hideLogin = useCallback(() => setShowLoginModal(false), []);

  return (
    <AuthModalContext.Provider value={{ showLoginModal, showLogin, hideLogin }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
};
