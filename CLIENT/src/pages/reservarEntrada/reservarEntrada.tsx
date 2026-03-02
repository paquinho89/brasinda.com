import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "react-bootstrap";
import AuditorioSelectorVerin from "../planoAuditorios/auditorioBotones/auditorioVerin";
import AuditorioSelectorOurense from "../planoAuditorios/auditorioBotones/auditorioOurense";
import MainNavbar from "../componentes/NavBar";
import { FaCalendarAlt, FaMapMarkerAlt, FaTicketAlt } from "react-icons/fa";


interface Evento {
  id: number;
  imaxe_evento?: string | null;
  nome_evento: string;
  descripcion_evento?: string;
  data_evento: string;
  localizacion: string;
  entradas_venta: number;
  prezo_evento?: number;
}

export default function ReservarEntrada() {
  const { id } = useParams<{ id: string }>();
  const [evento, setEvento] = useState<Evento | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    nome_evento: "",
    descripcion_evento: "",
    data_evento: "",
    localizacion: "",
    entradas_venta: 0,
    prezo_evento: "",
  });
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    const fetchEvento = async () => {
      setLoading(true);
      try {
        const resp = await fetch(`http://localhost:8000/crear-eventos/publico/${id}/`);
        if (!resp.ok) throw new Error("Evento non atopado");
        const data = await resp.json();
        setEvento(data);
      } catch (e: any) {
        console.error(e);
        setError(e.message || "Erro ao cargar evento");
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
  }, [id]);

  if (loading) return <div className="container py-4">Cargando evento…</div>;
  if (error) return <div className="container py-4 text-danger">{error}</div>;
  if (!evento) return <div className="container py-4">Evento non encontrado</div>;

  
  const formatDataCompleta = (dateString: string) => {
  const date = new Date(dateString);

  const data = new Intl.DateTimeFormat("gl-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  const hora = new Intl.DateTimeFormat("gl-ES", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  // Primeira letra en maiúscula
  const dataCapitalizada =
    data.charAt(0).toUpperCase() + data.slice(1);

    return `${dataCapitalizada} ás ${hora}`;
  };
  
  const dataFormato = formatDataCompleta(evento.data_evento);

  const startEdit = () => {
    setForm({
      nome_evento: evento.nome_evento || "",
      descripcion_evento: evento.descripcion_evento || "",
      data_evento: evento.data_evento || "",
      localizacion: evento.localizacion || "",
      entradas_venta: evento.entradas_venta || 0,
      prezo_evento: evento.prezo_evento != null ? String(evento.prezo_evento) : "",
    });
    setIsEditing(true);
  };
  const normalizar = (t: string) =>
    t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

  const lugarKey = normalizar(evento.localizacion);

  const auditorios = [
    {
      ciudad: "verin",
      componente: AuditorioSelectorVerin,
    },
    {
      ciudad: "ourense",
      componente: AuditorioSelectorOurense,
    },
  ];

  const AuditorioComponente =
  lugarKey.includes("auditorio")
    ? auditorios.find((a) => lugarKey.includes(a.ciudad))?.componente
    : null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((s) => ({ ...s, [name]: name === 'entradas_venta' ? Number(value) : value }));
  };

  const saveEdit = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const payload: any = {
        nome_evento: form.nome_evento,
        descripcion_evento: form.descripcion_evento,
        data_evento: form.data_evento,
        localizacion: form.localizacion,
        entradas_venta: form.entradas_venta,
      };
      if (form.prezo_evento !== '') payload.prezo_evento = form.prezo_evento;

      const resp = await fetch(`http://localhost:8000/crear-eventos/${id}/`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('Erro ao gardar cambios');
      const data = await resp.json();
      setEvento(data);
      setIsEditing(false);
      alert('Evento actualizado');
    } catch (e) {
      console.error(e);
      alert('Erro ao actualizar o evento');
    }
  };

  return (
    <>
    <MainNavbar />
      <div className="container py-4">
        <div className="card shadow-sm">
          <div className="p-3">
            <div className="d-flex align-items-start pb-2 mb-3">
              <Button
                className="volver-verde-btn me-3"
                onClick={() => navigate(-1)}
              >
                ← Volver
              </Button>
              <h2 className="m-0 flex-grow-1 text-center">
                {evento.nome_evento}
              </h2>
              {/* Espaciador para equilibrar o botón */}
              <div style={{ width: "100px" }}></div>
            </div>
            <p className="text-muted text-center small mt-1 mb-0">
              *Escolle a túa butaca no seguinte mapa.
            </p>
          {AuditorioComponente && (
          <AuditorioComponente
            eventoId={evento.id}
            variant="verde"
            onZonaClick={(zona) => {
              console.log("Zona seleccionada:", zona);
            }}
          />
        )}
        </div>
          <div className="card-body">
            <>
              <h2>{evento.nome_evento}</h2>
              
                <p><FaCalendarAlt className="me-1" />
                {dataFormato}
                </p>
              
              <p><FaMapMarkerAlt className="me-1" /> {evento.localizacion}</p>
              {evento.prezo_evento != null && (
                <p>
                  <FaTicketAlt className="me-1" />
                  {evento.prezo_evento} €
                </p>
              )}

              <div className="mt-3 d-flex">
                <button className="reserva-entrada-verde-btn me-2" onClick={startEdit}>Reservar Entrada</button>
              </div>
            </>
          </div>
        </div>
      </div>
    </>
  );
}
