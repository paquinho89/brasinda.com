import { useEffect, useState } from "react";

interface ReservaSinPlanoProps {
  eventoId: number;
  entradasVenta: number;
  entradasVendidas: number;
  entradasReservadas: number;
  onEntradasUpdate?: () => void;
  botaoEstilo?: string;
  botaoTexto?: string;
  checkboxVerde?: boolean;
  procedimientoCobro?: string | null;
}

const API_BASE_URL = "http://localhost:8000";

export default function ReservaSinPlano({
  eventoId,
  entradasReservadas,
  onEntradasUpdate,
  botaoEstilo = "reserva-entrada-btn",
  botaoTexto = "Gardar Invitacións",
  checkboxVerde = false,
  procedimientoCobro = null,
}: ReservaSinPlanoProps) {
  const [cantidadeReservar, setCantidadeReservar] = useState<number>(0);
  const [nomeXeral, setNomeXeral] = useState("");
  const [nomearTodas, setNomearTodas] = useState(false);
  const [nomesInvitacions, setNomesInvitacions] = useState<string[]>([]);
  const [gardando, setGardando] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [mensaxeOk, setMensaxeOk] = useState<string | null>(null);
  const [totalExistentes, setTotalExistentes] = useState<number>(0);

  useEffect(() => {
    setTotalExistentes(entradasReservadas || 0);
  }, [entradasReservadas]);

  useEffect(() => {
    const cargarInvitacions = async () => {
      setCargando(true);
      try {
        const token = localStorage.getItem("access_token");
        const resp = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/invitacions-sen-plano/`, {
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });

        if (!resp.ok) {
          throw new Error("Non se puideron cargar as invitacións");
        }

        const data = await resp.json();
        setTotalExistentes(typeof data.cantidade === "number" ? data.cantidade : 0);
      } catch (e: any) {
        setErro(e.message || "Erro ao cargar invitacións");
      } finally {
        setCargando(false);
      }
    };

    cargarInvitacions();
  }, [eventoId]);

  useEffect(() => {
    if (!nomearTodas) return;
    setNomesInvitacions((prev) => {
      const trimmed = prev.slice(0, cantidadeReservar);
      while (trimmed.length < cantidadeReservar) {
        trimmed.push("");
      }
      return trimmed;
    });
  }, [cantidadeReservar, nomearTodas]);

  useEffect(() => {
    if (cantidadeReservar <= 1 && nomearTodas) {
      setNomearTodas(false);
    }
  }, [cantidadeReservar]);

  useEffect(() => {
    if (mensaxeOk) {
      const timer = setTimeout(() => {
        setMensaxeOk(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [mensaxeOk]);

  useEffect(() => {
    if (erro) {
      const timer = setTimeout(() => {
        setErro(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [erro]);

  const handleCantidadeChange = (value: string) => {
    const parsed = Number.parseInt(value, 10);
    if (Number.isNaN(parsed)) {
      setCantidadeReservar(0);
      return;
    }
    const normalizada = Math.max(0, parsed);
    setCantidadeReservar(normalizada);
  };

  const handleNomeInvitacionChange = (idx: number, value: string) => {
    setNomesInvitacions((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  };

  const limparFormulario = () => {
    setCantidadeReservar(0);
    setNomeXeral("");
    setNomesInvitacions([]);
    setNomearTodas(false);
  };

  const gardarReserva = async () => {
    setErro(null);
    setMensaxeOk(null);

    if (cantidadeReservar < 0) {
      setErro("A cantidade de entradas reservadas non pode ser negativa.");
      limparFormulario();
      return;
    }

    if (nomearTodas && cantidadeReservar > 0 && nomesInvitacions.length !== cantidadeReservar) {
      setErro("Revisa os nomes das invitacións antes de gardar.");
      limparFormulario();
      return;
    }

    setGardando(true);
    try {
      const token = localStorage.getItem("access_token");
      const nomesParaGardar = nomearTodas
        ? nomesInvitacions.slice(0, cantidadeReservar)
        : [];

      const resp = await fetch(`${API_BASE_URL}/crear-eventos/${eventoId}/invitacions-sen-plano/`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          cantidade: cantidadeReservar,
          nomes: nomesParaGardar,
          nome_xeral: nomeXeral,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => null);
        throw new Error(data?.detail || data?.error || "Non se puideron gardar as entradas reservadas.");
      }

      let mensaxe = "Invitacións actualizadas correctamente.";
      if (procedimientoCobro) {
        mensaxe += ` ${procedimientoCobro}`;
      }
      setMensaxeOk(mensaxe);
      limparFormulario();
      onEntradasUpdate?.();
    } catch (e: any) {
      setErro(e.message || "Produciuse un erro ao gardar as invitacións.");
      limparFormulario();
    } finally {
      setGardando(false);
    }
  };

  const isFormValid = () => {
    if (cantidadeReservar <= 0) {
      return false;
    }

    if (nomearTodas) {
      // Todos los nombres individuales deben tener contenido
      const nomesValidos = nomesInvitacions.slice(0, cantidadeReservar);
      return nomesValidos.every((nome) => nome.trim().length > 0);
    } else {
      // El nombre general debe tener contenido
      return nomeXeral.trim().length > 0;
    }
  };

  return (
    <div className="border rounded p-3 mt-2 mb-2" style={{ backgroundColor: "#fff" }}>
      <h5 className="mb-3">Invitacións</h5>

      {cargando && <p className="text-muted">Cargando invitacións...</p>}

      <div className="mb-3" style={{ maxWidth: "400px" }}>
        <label htmlFor="cantidade-reserva" className="form-label">
          Cantas invitacións queres reservar?
        </label>
        <input
          id="cantidade-reserva"
          type="number"
          min={0}
          value={cantidadeReservar > 0 ? cantidadeReservar : ""}
          onChange={(e) => handleCantidadeChange(e.target.value)}
          className="form-control"
          placeholder="Introduce o número de entradas a reservar"
        />
      </div>

      {!nomearTodas && (
        <div className="mb-3" style={{ maxWidth: "400px" }}>
          <label htmlFor="nome-xeral" className="form-label">
            Nome para as invitacións
          </label>
          <input
            id="nome-xeral"
            type="text"
            value={nomeXeral}
            onChange={(e) => setNomeXeral(e.target.value)}
            className="form-control"
            placeholder="Nome da reserva"
          />
        </div>
      )}

      {cantidadeReservar > 1 && (
        <div className="form-check mb-3">
          <input
            id="nomear-todas"
            type="checkbox"
            className={checkboxVerde ? "form-check-input checkbox-verde" : "form-check-input"}
            checked={nomearTodas}
            onChange={(e) => setNomearTodas(e.target.checked)}
          />
          <label htmlFor="nomear-todas" className="form-check-label">
            Quero nomear todas as invitacións individualmente
          </label>
        </div>
      )}

      {nomearTodas && cantidadeReservar > 0 && (
        <div className="mb-3">
          <p className="mb-2">Nomes das invitacións</p>
          <div className="d-grid" style={{ gap: "8px" }}>
            {Array.from({ length: cantidadeReservar }).map((_, idx) => (
              <input
                key={`invitacion-${idx}`}
                type="text"
                className="form-control"
                placeholder={`Nome invitación ${idx + 1}`}
                value={nomesInvitacions[idx] || ""}
                onChange={(e) => handleNomeInvitacionChange(idx, e.target.value)}
              />
            ))}
          </div>
        </div>
      )}

      <div className="d-flex justify-content-start">
        <button
          type="button"
          className={botaoEstilo}
          onClick={gardarReserva}
          disabled={gardando || !isFormValid()}
        >
          {gardando ? "Gardando..." : botaoTexto}
        </button>
      </div>

      {erro && (
        <div style={{ color: "#ff0093", fontWeight: "bold", marginTop: "12px" }}>
          {erro}
        </div>
      )}

      {mensaxeOk && (
        <div className="mt-3 p-3" style={{
          borderLeft: "4px solid #28a745",
          borderRadius: "4px",
          color: "#155724"
        }}>
          <div style={{ fontWeight: "bold", marginBottom: procedimientoCobro ? "8px" : "0" }}>
            ✓ Invitacións actualizadas correctamente
          </div>
          {procedimientoCobro && (
            <div style={{ marginTop: "8px", paddingTop: "8px", color: "#ff0093", fontWeight: "bold" }}>
              <strong>Procedemento de cobro:</strong>
              <div style={{ marginTop: "4px" }}>{procedimientoCobro}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
