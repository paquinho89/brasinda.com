import { Modal, Button, Image } from "react-bootstrap";
import { useState } from "react";
// Formato de data igual que en tarjetaEventoHome.tsx
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
  const dataCapitalizada = data.charAt(0).toUpperCase() + data.slice(1);
  return `${dataCapitalizada} ás ${hora}`;
};

interface Evento {
  id: number;
  nome_evento: string;
  data_evento: string;
  imaxe_evento?: string;
}

interface Props {
  show: boolean;
  onClose: () => void;
  eventos: Evento[];
  email: string;
  loading: boolean;
  error: string;
  onEnviarEntradas: (eventos: Evento[]) => void;
}

const RecuperarEntradaListadoEventos = ({ show, onClose, eventos, email, loading, error, onEnviarEntradas }: Props) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);

  const handleCheck = (id: number) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const handleEnviar = () => {
    const eventosSeleccionados = eventos.filter(ev => seleccionados.includes(ev.id));
    onEnviarEntradas(eventosSeleccionados);
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Tes entradas para estes eventos:</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <div>Buscando eventos activos...</div>}
        {error && <div style={{ color: 'red' }}>{error}</div>}
        {eventos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {eventos.map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <input
                  id={`evento-checkbox-${ev.id}`}
                  type="checkbox"
                  className="form-check-input checkbox-verde"
                  checked={seleccionados.includes(ev.id)}
                  onChange={() => handleCheck(ev.id)}
                  disabled={loading}
                  style={{ accentColor: "#ff0093", width: 24, height: 24, border: '2px solid #000', marginRight: 12 }}
                />
                {ev.imaxe_evento && (
                  <Image src={ev.imaxe_evento} alt={ev.nome_evento} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8 }} />
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{ev.nome_evento}</div>
                  <div style={{ color: '#888', fontSize: 14 }}>{formatDataCompleta(ev.data_evento)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div>Non hai eventos activos para este email.</div>
        )}
      </Modal.Body>
      <Modal.Footer style={{ display: 'flex', justifyContent: 'space-between' }}>
        <Button className="boton-avance" onClick={onClose}>
          Pechar
        </Button>
        <Button className="reserva-entrada-btn" onClick={handleEnviar} disabled={seleccionados.length === 0}>
          Enviar Entradas
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RecuperarEntradaListadoEventos;
