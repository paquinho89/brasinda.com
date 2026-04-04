import { useState, useEffect } from "react";
import { Container } from "react-bootstrap";
import TarjetaEvento from "./componentes/tarjetaEvento";
import MainNavbar from "../componentes/NavBar";
import "../../estilos/Botones.css";
import "../../estilos/PanelEventos.css"
import { FaCalendarCheck, FaHistory } from "react-icons/fa";
import CrearEventoBoton from "../componentes/CrearEventoBoton";
import LoginModalCrearEvento from "../componentes/InicioSesionCrearEventoCuadro";

interface Evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  data_evento: string;
  localizacion: string;
  localidade?: string;
  entradas_venta: number;
}

export default function PanelOrganizador() {
  const [allEventos, setAllEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);

  // Fetch eventos al montar
  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        setError(null);

        const attemptFetch = async () => {
          const token = localStorage.getItem("access_token");
          const resp = await fetch("http://localhost:8000/crear-eventos/", {
            headers: token ? { Authorization: `Bearer ${token}` } : {},
          });
          return resp;
        };

        let resp = await attemptFetch();

        if (resp.status === 401) {
          try {
            const refresh = localStorage.getItem('refresh_token');
            if (!refresh) throw new Error('No refresh token');
            
            const r = await fetch('http://localhost:8000/api/token/refresh/', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refresh }),
            });
            if (!r.ok) throw new Error('Refresh failed');
            const jr = await r.json();
            
            if (jr.access) {
              localStorage.setItem('access_token', jr.access);
            } else if (jr.access_token) {
              localStorage.setItem('access_token', jr.access_token);
            }
            resp = await attemptFetch();
            if (!resp.ok) throw new Error('Erro ao cargar eventos despois refresh');
          } catch (refreshErr) {
            console.error('Token refresh failed', refreshErr);
            setShowLoginModal(true);
            setLoading(false);
            return;
          }
        }

        if (!resp.ok) {
          await resp.text().catch(() => null);
          throw new Error(`Erro ao cargar eventos: ${resp.status}`);
        }
        
        const data = await resp.json();
        setAllEventos(data);
      } catch (e: any) {
        console.error('Error fetching eventos', e);
        setError(e.message || 'Erro ao cargar eventos');
      } finally {
        setLoading(false);
      }
    };
    fetchEventos();
  }, []);

  // Separar eventos activos e pasados
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const eventosActivos = allEventos.filter((ev) => {
    const dataEvento = new Date(ev.data_evento);
    dataEvento.setHours(0, 0, 0, 0);
    return dataEvento >= hoy;
  });

  const eventosPasados = allEventos.filter((ev) => {
    const dataEvento = new Date(ev.data_evento);
    dataEvento.setHours(0, 0, 0, 0);
    return dataEvento < hoy;
  });

  return (
  <>
    <MainNavbar />
      <div className="top-right-controls">
        <CrearEventoBoton />
      </div>

    <Container className="mt-4 mb-5">

      <div className="mb-4">
        <h2 className="mt-4 text-center">Os teus eventos</h2>
      </div>

      {/* ACTIVOS */}
      <div className="panel-box panel-activos mb-5">
        <div className="mb-3">
          
          <h4><FaCalendarCheck /> Eventos activos</h4>
        </div>

        {loading && <p className="text-center">Cargando eventos...</p>}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        {!loading && !error && (
          eventosActivos.length === 0 ? (
            <p className="text-muted text-center">
              Non hai eventos activos.
            </p>
          ) : (
            <div className="row g-4">
              {eventosActivos.map((ev) => (
                <div className="col-md-4 col-sm-6" key={ev.id}>
                  <TarjetaEvento evento={ev} isPast={false} />
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* PASADOS */}
      <div className="panel-box panel-pasados">
        <div className="mb-3">
          <h4><FaHistory />Eventos pasados</h4>
        </div>

        {!loading && !error && (
          eventosPasados.length === 0 ? (
            <p className="text-muted text-center">
              Non hai eventos pasados.
            </p>
          ) : (
            <div className="row g-4">
              {eventosPasados.map((ev) => (
                <div className="col-md-4 col-sm-6" key={ev.id}>
                  <TarjetaEvento evento={ev} isPast={true} />
                </div>
              ))}
            </div>
          )
        )}
      </div>

    </Container>
    <LoginModalCrearEvento 
      show={showLoginModal} 
      onClose={() => setShowLoginModal(false)} 
      redirectTo="/panel-organizador" 
    />
  </>
);
}


