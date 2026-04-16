import { Container, Button, Form, FormControl } from "react-bootstrap";
import { useState, useEffect } from "react";
import MainNavbar from "./componentes/NavBar";
import CrearEventoBoton from "./componentes/CrearEventoBoton";
import ToggleHamburguer from "./componentes/Toggle";
import UserAvatarToggle from "./componentes/UserAvatarToggle";
import API_BASE_URL from "../utils/api";
import TarjetaEventoHome from "./componentes/tarjetaEventoHome";
import Footer from "./componentes/footer";
import "../estilos/Botones.css";
import { useAuth } from "./AuthContext";
import confetti from "canvas-confetti";


interface Evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  data_evento: string;
  tipo_evento: string;
  localizacion: string;
  localidade: string;
  entradas_venta: number;
  prezo_evento?: number;
  evento_verificado: boolean;
}
function Home() {
  const { organizador } = useAuth(); // ✅ sesión global
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
    });
  }, []);

  const normalizarTexto = (texto: string) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim();
  };

  useEffect(() => {
    const fetchEventos = async () => {
      try {
        setLoading(true);
        setError(null);

        const resp = await fetch(`${API_BASE_URL}/crear-eventos/publicos/`);
        if (!resp.ok) throw new Error(`Error al cargar eventos: ${resp.status}`);



        const data: Evento[] = (await resp.json()).map((ev: any) => ({
          ...ev,
          localidade: ev.localidade || "",
          evento_verificado: ev.evento_verificado ?? false,
        }));

        // Filtrar eventos activos (data_evento + 20min > agora)
        const agora = new Date();
        const eventosActivos = data.filter((ev: Evento) => {
          const dataEvento = new Date(ev.data_evento);
          // Sumar 20 minutos á data do evento
          const dataEventoMais20 = new Date(dataEvento.getTime() + 20 * 60 * 1000);
          return dataEventoMais20 > agora;
        });

        const eventosOrdenados = [...eventosActivos].sort((a, b) => {
          return new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime();
        });

        setEventos(eventosOrdenados);
      } catch (e: any) {
        console.error("Error fetching eventos", e);
        setError(e.message || "Error al cargar eventos");
      } finally {
        setLoading(false);
      }
    };

    fetchEventos();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  const filteredEventos = eventos.filter((evento) => {
    const query = normalizarTexto(searchInput);
    if (!query) return true;

    const dataEvento = new Date(evento.data_evento);
    const dataIso = Number.isNaN(dataEvento.getTime())
      ? ""
      : dataEvento.toISOString().slice(0, 10); // YYYY-MM-DD
    const dataLocale = Number.isNaN(dataEvento.getTime())
      ? ""
      : dataEvento.toLocaleDateString("gl-ES"); // DD/MM/YYYY

    const searchable = normalizarTexto(
      `${evento.nome_evento} ${evento.tipo_evento} ${evento.localizacion} ${evento.data_evento} ${dataIso} ${dataLocale}`
    );

    return searchable.includes(query);
  });

  return (
    <>
      <MainNavbar />

      {/* Controles superiores */}
      <div className="top-right-controls">
        <CrearEventoBoton />
        {!organizador && <ToggleHamburguer />}
        {organizador && <UserAvatarToggle />}
      </div>

      {/* Hero / Buscador */}
      <Container className="text-center home-hero">
        <h2 className="mb-4 mt-4">Atopa o teu próximo evento</h2>
        <Form className="d-flex justify-content-center" onSubmit={handleSearch}>
          <FormControl
            type="search"
            placeholder="Buscar por nome, tipo, lugar ou data"
            className="me-2 w-50"
            aria-label="Search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" className="reserva-entrada-btn">Buscar</Button>
        </Form>
      </Container>

      {/* Eventos activos */}
      <Container className="mt-3">
        <h2 className="mb-3 mt-5">Recomendacións:</h2>

        {loading && <p className="text-center">Cargando eventos...</p>}
        {error && <div className="alert alert-danger text-center">{error}</div>}

        {!loading && !error && eventos.length === 0 && (
          <p className="text-center text-muted">Non hai eventos activos agora mesmo.</p>
        )}

        {!loading && !error && eventos.length > 0 && filteredEventos.length === 0 && (
          <p className="text-center text-muted">Non hai resultados para esa busca.</p>
        )}

        {!loading && !error && filteredEventos.length > 0 && (
          <div className="row g-4">
            {filteredEventos.map((evento) => (
              <div className="col-md-4 col-sm-6" key={evento.id}>
                {/* ✅ Pasamos evento tipado correctamente */}
                <TarjetaEventoHome evento={evento as Evento} />
              </div>
            ))}
          </div>
        )}
      </Container>
      
      <Footer />
    </>
  );
}

export default Home;