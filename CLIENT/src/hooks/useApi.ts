// useApi.ts
import { useAuthModal } from "../context/AuthModalContext";

interface ApiFetchOptions {
  promptOnAuthFailure?: boolean;
  redirectTo?: string;
}

export function useApi() {
  const { showLogin } = useAuthModal();

  // Wrapper for fetch
  const apiFetch = async (input: RequestInfo, init?: RequestInit, options?: ApiFetchOptions) => {
    try {
      const token = localStorage.getItem("access_token")?.trim();
      const headers = new Headers(init?.headers || {});
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      } else {
        headers.delete("Authorization");
      }
      const response = await fetch(input, { ...init, headers });

      if ([401, 403].includes(response.status)) {
        if (options?.promptOnAuthFailure) {
          showLogin(options.redirectTo);
        }
        return response;
      }

      if (options?.promptOnAuthFailure && response.status === 400) {
        let data;
        try { data = await response.json(); } catch {}
        if (data && (data.detail?.toLowerCase().includes("autentic") || data.detail?.toLowerCase().includes("login") || data.detail?.toLowerCase().includes("token"))) {
          showLogin(options.redirectTo);
        }
      }

      return response;
    } catch (err) {
      if (options?.promptOnAuthFailure) {
        showLogin(options.redirectTo);
      }
      throw err;
    }
  };

  return { apiFetch };
}
