import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.tsx'
import { AuthProvider } from './pages/AuthContext.tsx'
import { LanguageProvider } from './pages/LanguageContext.tsx'
import { NavBarMessageContext } from './pages/componentes/NavBar';
import { useState } from 'react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import axios from 'axios';




function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <NavBarMessageContext.Provider value={{ message, setMessage }}>
      {children}
    </NavBarMessageContext.Provider>
  );
}


const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, '');
const localApiPrefixes = ['http://localhost:8000', 'http://127.0.0.1:8000'];

const rewriteApiUrl = (url: string) => {
  if (!apiBaseUrl) {
    return url;
  }

  const matchedPrefix = localApiPrefixes.find((prefix) => url.startsWith(prefix));
  if (!matchedPrefix) {
    return url;
  }

  return `${apiBaseUrl}${url.slice(matchedPrefix.length)}`;
};

if (apiBaseUrl) {
  const originalFetch = window.fetch.bind(window);

  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    if (typeof input === 'string') {
      return originalFetch(rewriteApiUrl(input), init);
    }

    if (input instanceof URL) {
      return originalFetch(new URL(rewriteApiUrl(input.toString())), init);
    }

    if (input instanceof Request) {
      const nextUrl = rewriteApiUrl(input.url);
      if (nextUrl !== input.url) {
        return originalFetch(new Request(nextUrl, input), init);
      }
    }

    return originalFetch(input, init);
  }) as typeof window.fetch;

  axios.interceptors.request.use((config) => {
    if (typeof config.url === 'string') {
      config.url = rewriteApiUrl(config.url);
    }
    return config;
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <LanguageProvider>
          <ProvidersWrapper>
            <App />
          </ProvidersWrapper>
        </LanguageProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);
