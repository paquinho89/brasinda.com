// useApi.ts
import { useAuthModal } from "../context/AuthModalContext";

export function useApi() {
  const { showLogin } = useAuthModal();

  // Wrapper for fetch
  const apiFetch = async (input: RequestInfo, init?: RequestInit) => {
    try {
      const token = localStorage.getItem("access_token");
      const headers = new Headers(init?.headers || {});
      if (token) headers.set("Authorization", `Bearer ${token}`);
      const response = await fetch(input, { ...init, headers });
      if ([401, 403].includes(response.status)) {
        showLogin();
        throw new Error("Necesitas iniciar sesión");
      }
      if (response.status === 400) {
        let data;
        try { data = await response.json(); } catch {}
        if (data && (data.detail?.toLowerCase().includes("autentic") || data.detail?.toLowerCase().includes("login") || data.detail?.toLowerCase().includes("token"))) {
          showLogin();
          throw new Error("Necesitas iniciar sesión");
        }
      }
      return response;
    } catch (err) {
      showLogin();
      throw err;
    }
  };

  return { apiFetch };
}
