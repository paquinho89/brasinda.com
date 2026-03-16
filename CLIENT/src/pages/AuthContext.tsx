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
  login: (data: OrganizadorType, token: string, refreshToken?: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const parseOrganizadorFromStorage = (): OrganizadorType | null => {
  try {
    const orgRaw = localStorage.getItem("organizador");
    if (!orgRaw) return null;

    const parsed = JSON.parse(orgRaw);
    if (!parsed || typeof parsed !== "object") return null;

    return {
      nome_organizador: parsed.nome_organizador || parsed.nome || parsed.username || "Organizador",
      foto_url: parsed.foto_url || parsed.foto_organizador || null,
      email: parsed.email,
      id: parsed.id,
    };
  } catch {
    localStorage.removeItem("organizador");
    return null;
  }
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [organizador, setOrganizador] = useState<OrganizadorType | null>(() => parseOrganizadorFromStorage());
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("access_token"));

  useEffect(() => {
    setOrganizador(parseOrganizadorFromStorage());
    setToken(localStorage.getItem("access_token"));
  }, []);

  // Now accepts optional refreshToken
  const login = (data: OrganizadorType, token: string, refreshToken?: string) => {
    const normalizedData: OrganizadorType = {
      nome_organizador: (data as any).nome_organizador || (data as any).nome || (data as any).username || "Organizador",
      foto_url: (data as any).foto_url || (data as any).foto_organizador || null,
      email: data.email,
      id: data.id,
    };

    localStorage.setItem("organizador", JSON.stringify(normalizedData));
    localStorage.setItem("access_token", token);
    if (refreshToken) {
      localStorage.setItem("refresh_token", refreshToken);
    }
    setOrganizador(normalizedData);
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