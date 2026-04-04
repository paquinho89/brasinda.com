import { Modal, Button, Image, Alert, Spinner } from "react-bootstrap";
import { useState, useEffect } from "react";
import API_BASE_URL from "../../utils/api";
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
}

const RecuperarEntradaListadoEventos = ({ show, onClose, eventos, email, loading, error }: Props) => {
  const [seleccionados, setSeleccionados] = useState<number[]>([]);
  const [enviando, setEnviando] = useState(false);
  const [mensajeEnvio, setMensajeEnvio] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Seleccionar por defecto o evento coa data máis próxima ao abrirse o modal
  useEffect(() => {
    if (show && eventos.length > 0) {
      const nearest = eventos.reduce((prev, curr) =>
        new Date(curr.data_evento) < new Date(prev.data_evento) ? curr : prev
      );
      setSeleccionados([nearest.id]);
    }
    if (!show) {
      setSeleccionados([]);
      setMensajeEnvio(null);
    }
  }, [show, eventos]);

  const handleCheck = (id: number) => {
    setSeleccionados(prev =>
      prev.includes(id) ? prev.filter(eid => eid !== id) : [...prev, id]
    );
  };

  const handleEnviar = async () => {
    if (seleccionados.length === 0) return;

    setEnviando(true);
    setMensajeEnvio(null);

    try {
      const response = await fetch(`${API_BASE_URL}/crear-eventos/entradas-recuperadas/enviar/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          evento_ids: seleccionados,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMensajeEnvio({
          tipo: 'success',
          texto: `✓ Entradas enviadas correctamente a ${email} (${data.total_entradas} entradas, ${data.total_eventos} evento${data.total_eventos !== 1 ? 's' : ''})`,
        });
        // Limpar selección después de 2 segundos
        setTimeout(() => {
          setSeleccionados([]);
          onClose();
        }, 2000);
      } else {
        setMensajeEnvio({
          tipo: 'error',
          texto: data.error || 'Erro ao enviar as entradas',
        });
      }
    } catch (err: any) {
      setMensajeEnvio({
        tipo: 'error',
        texto: 'Erro de conexión ao enviar as entradas',
      });
      console.error('Error:', err);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <Modal show={show} onHide={onClose} centered>
      <Modal.Header closeButton>
        <Modal.Title>Tes entradas para estes eventos:</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && <div>Buscando eventos activos...</div>}
        {error && <Alert variant="danger">{error}</Alert>}
        {mensajeEnvio && (
          <Alert variant={mensajeEnvio.tipo === 'success' ? 'success' : 'danger'}>
            {mensajeEnvio.texto}
          </Alert>
        )}
        {eventos.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[...eventos].sort((a, b) => new Date(a.data_evento).getTime() - new Date(b.data_evento).getTime()).map(ev => (
              <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #eee', borderRadius: 8, padding: 12 }}>
                <input
                  id={`evento-checkbox-${ev.id}`}
                  type="checkbox"
                  className="form-check-input checkbox-verde"
                  checked={seleccionados.includes(ev.id)}
                  onChange={() => handleCheck(ev.id)}
                  disabled={loading || enviando}
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
        <Button className="boton-avance" onClick={onClose} disabled={enviando}>
          Pechar
        </Button>
        <Button 
          className="reserva-entrada-btn" 
          onClick={handleEnviar} 
          disabled={seleccionados.length === 0 || enviando}
        >
          {enviando ? (
            <>
              <Spinner animation="border" size="sm" style={{ marginRight: '8px' }} />
              Enviando...
            </>
          ) : (
            'Enviar Entradas'
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RecuperarEntradaListadoEventos;
