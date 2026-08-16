import React, { createContext, useContext, useState, useCallback } from "react";

interface AuthModalContextType {
  showLoginModal: boolean;
  loginRedirectTo?: string;
  showLogin: (redirectTo?: string) => void;
  hideLogin: () => void;
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined);

export const AuthModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginRedirectTo, setLoginRedirectTo] = useState<string | undefined>(undefined);

  const showLogin = useCallback((redirectTo?: string) => {
    setLoginRedirectTo(redirectTo);
    setShowLoginModal(true);
  }, []);
  const hideLogin = useCallback(() => {
    setShowLoginModal(false);
    setLoginRedirectTo(undefined);
  }, []);

  return (
    <AuthModalContext.Provider value={{ showLoginModal, loginRedirectTo, showLogin, hideLogin }}>
      {children}
    </AuthModalContext.Provider>
  );
};

export const useAuthModal = () => {
  const ctx = useContext(AuthModalContext);
  if (!ctx) throw new Error("useAuthModal must be used within AuthModalProvider");
  return ctx;
};
