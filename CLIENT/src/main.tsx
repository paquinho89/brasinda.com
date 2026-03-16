import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import App from './App.tsx'
import { AuthProvider } from './pages/AuthContext.tsx'
import { LanguageProvider } from './pages/LanguageContext.tsx'
import { NavBarMessageContext } from './pages/componentes/NavBar';
import { useState } from 'react';

<script
  src="https://maps.googleapis.com/maps/api/js?key=TU_API_KEY&libraries=places"
  async
  defer
></script>



function ProvidersWrapper({ children }: { children: React.ReactNode }) {
  const [message, setMessage] = useState("");
  return (
    <NavBarMessageContext.Provider value={{ message, setMessage }}>
      {children}
    </NavBarMessageContext.Provider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <ProvidersWrapper>
          <App />
        </ProvidersWrapper>
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
)
