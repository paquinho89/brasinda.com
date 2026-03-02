import { createContext, useContext, useEffect, useState } from "react";

interface OrganizadorType {
  nome_organizador: string;
  foto_url?: string | null;
  email?: string;
  id?: number;
}

interface AuthContextType {
  organizador: OrganizadorType | null;
  token: string | null;              // gardamos token
  login: (data: OrganizadorType, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [organizador, setOrganizador] = useState<OrganizadorType | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const orgRaw = localStorage.getItem("organizador");
    const tokenRaw = localStorage.getItem("access_token");
    if (orgRaw) setOrganizador(JSON.parse(orgRaw));
    if (tokenRaw) setToken(tokenRaw);
  }, []);

  const login = (data: OrganizadorType, token: string) => {
    localStorage.setItem("organizador", JSON.stringify(data));
    localStorage.setItem("access_token", token);
    setOrganizador(data);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("organizador");
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setOrganizador(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ organizador, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return context;
};