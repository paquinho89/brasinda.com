import { Container, Button, Form, FormControl } from "react-bootstrap";
import { useState, useEffect } from "react";
import MainNavbar from "./componentes/NavBar";
import CrearEventoBoton from "./componentes/CrearEventoBoton";
import ToggleHamburguer from "./componentes/Toggle";
import TarjetaEventoHome from "./componentes/tarjetaEventoHome";
import "../estilos/Botones.css";
import { useAuth } from "./AuthContext";

interface Evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  data_evento: string;
  tipo_evento: string;
  localizacion: string;
  entradas_venta: number;
  prezo_evento?: number;
}

function Home() {
  const { organizador } = useAuth(); // ✅ sesión global
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch("http://localhost:8000/crear-eventos/publicos/");
        if (!resp.ok) throw new Error(`Error al cargar eventos: ${resp.status}`);

        const data: Evento[] = await resp.json(); // ✅ tipamos data como Evento[]

        // Filtrar eventos activos (fecha >= hoy)
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);

        const eventosActivos = data.filter((ev: Evento) => {
          const dataEvento = new Date(ev.data_evento);
          dataEvento.setHours(0, 0, 0, 0);
          return dataEvento >= hoy;
        });

        setEventos(eventosActivos);
      } catch (e: any) {
        console.error("Error fetching eventos", e);
        setError(e.message || "Error al cargar eventos");
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  return (
    <>
      <MainNavbar />

      {/* Controles superiores */}
      <div className={`top-right-controls ${organizador ? "with-organizador" : ""}`}>
        <CrearEventoBoton />
        {!organizador && <ToggleHamburguer />}
      </div>

      {/* Hero / Buscador */}
      <Container className="text-center home-hero">
        <h2 className="mb-4 mt-4">Encuentra tu próximo evento</h2>
        <Form className="d-flex justify-content-center">
          <FormControl
            type="search"
            placeholder="Buscar por nombre, tipo o lugar"
            className="me-2 w-50"
            aria-label="Search"
          />
          <Button className="boton-avance">Buscar</Button>
        </Form>
      </Container>

      {/* Eventos activos */}
      <Container className="mt-3">
        <h2 className="mb-3 mt-5">Eventos en Auditorio</h2>

        {loading && <p className="text-center">Cargando eventos...</p>}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        {!loading && !error && eventos.length === 0 && (
          <p className="text-center text-muted">Non hai eventos activos agora mesmo.</p>
        )}

        {!loading && !error && eventos.length > 0 && (
          <div className="row g-4">
            {eventos.map((evento) => (
              <div className="col-md-4 col-sm-6" key={evento.id}>
                {/* ✅ Pasamos evento tipado correctamente */}
                <TarjetaEventoHome evento={evento as Evento} />
              </div>
            ))}
          </div>
        )}
      </Container>
    </>
  );
}

export default Home;