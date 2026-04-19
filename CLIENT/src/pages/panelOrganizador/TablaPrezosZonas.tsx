import React, { useEffect, useState } from "react";
import API_BASE_URL from "../../utils/api";

interface ZonaPrezo {
  nome: string;
  prezo: number;
  prezo_pvp: number | null;
}

interface Props {
  eventoId: number;
  mostrarPVP?: boolean;
}

const ORDEN_ZONAS = ["central", "dereita", "esquerda", "anfiteatro"];

function normalizarNome(nome: string) {
  return nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const TablaPrezosZonas: React.FC<Props> = ({ eventoId, mostrarPVP = true }) => {
  const [zonas, setZonas] = useState<ZonaPrezo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`${API_BASE_URL}/eventos/${eventoId}/zonas-prezo/`)
      .then((res) => {
        if (!res.ok) throw new Error("Non se atoparon prezos de zonas");
        return res.json();
      })
      .then((data: ZonaPrezo[]) => {
        // Ordenar segundo ORDEN_ZONAS
        const zonasOrdenadas = [...data].sort((a, b) => {
          const ia = ORDEN_ZONAS.indexOf(normalizarNome(a.nome));
          const ib = ORDEN_ZONAS.indexOf(normalizarNome(b.nome));
          return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
        });
        setZonas(zonasOrdenadas);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message || "Erro ao cargar prezos de zonas");
        setLoading(false);
      });
  }, [eventoId]);

  if (loading) return <div>Cargando prezos por zona…</div>;
  if (error) return <div className="text-danger">{error}</div>;
  if (!zonas.length) return <div>Sen prezos de zonas.</div>;

  return (
    <div className="row mb-3">
      <div className="col-12">
        <table className="w-100" style={{ background: '#fff', margin: 0, borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f5f5f5' }}>
              <th style={{ border: 'none', padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>Área</th>
              <th style={{ border: 'none', padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>Prezo</th>
              {mostrarPVP && (
                <th style={{ border: 'none', padding: '10px 8px', textAlign: 'left', fontWeight: 600 }}>PVP</th>
              )}
            </tr>
          </thead>
          <tbody>
            {zonas.map((zona) => (
              <tr key={zona.nome}>
                <td style={{ textTransform: "capitalize", border: 'none', padding: '10px 8px' }}>{zona.nome}</td>
                <td style={{ border: 'none', padding: '10px 8px' }}>{Number(zona.prezo).toFixed(2).replace('.', ',')} €</td>
                {mostrarPVP && (
                  <td style={{ border: 'none', padding: '10px 8px' }}>{zona.prezo_pvp != null ? Number(zona.prezo_pvp).toFixed(2).replace('.', ',') + " €" : "-"}</td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablaPrezosZonas;