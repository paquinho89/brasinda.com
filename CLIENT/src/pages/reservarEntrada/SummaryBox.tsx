import { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import { FaTicketAlt, FaTrash } from "react-icons/fa";
import "../../estilos/infoPagamento.css";

interface SelectedSeat {
  row: number;
  seat: number;
  zona?: string;
  nome?: string;
}

interface SummaryBoxProps {
  entradasSeleccionadas: SelectedSeat[];
  prezoEvento?: number | null;
  onEliminarButaca?: (seat: SelectedSeat, idx: number) => void;
  onNomeChange?: (idx: number, nome: string) => void;
}






const SummaryBox = forwardRef<any, SummaryBoxProps>(({ entradasSeleccionadas, prezoEvento, onEliminarButaca, onNomeChange }, ref) => {
  useImperativeHandle(ref, () => ({
    handleSaveAll,
    getEditAll: () => editAll,
    getSeatNames: () => seatNames,
  }));

  // Local state for editing per seat
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [editAll, setEditAll] = useState<boolean>(false);
  // Local state for per-seat names (keyed by seatId string)
  const [seatNames, setSeatNames] = useState<{ [seatId: string]: string }>({});

  // Helper to get unique seat id
  const getSeatId = (seat: SelectedSeat) => `${seat.row}-${seat.seat}-${seat.zona || ''}`;

  // Only update seatNames for new seats or when prop value changes, but do not overwrite local edits
  useEffect(() => {
    setSeatNames(prev => {
      const updated = { ...prev };
      entradasSeleccionadas.forEach((seat, idx) => {
        const seatId = getSeatId(seat);
        // Only update if not editing this seat
        const isEditing = editAll || editIdx === idx;
        if (!(seatId in updated)) {
          updated[seatId] = seat.nome !== undefined ? seat.nome : '';
        } else if (!isEditing && seat.nome !== undefined && seat.nome !== updated[seatId]) {
          updated[seatId] = seat.nome;
        }
      });
      // Remove names for seats that are no longer selected
      Object.keys(updated).forEach(seatId => {
        if (!entradasSeleccionadas.some(seat => getSeatId(seat) === seatId)) {
          delete updated[seatId];
        }
      });
      return updated;
    });
  }, [entradasSeleccionadas, editAll, editIdx]);

  const handleSave = (idx: number) => {
    const seat = entradasSeleccionadas[idx];
    const seatId = getSeatId(seat);
    if (typeof onNomeChange === 'function') {
      onNomeChange(idx, seatNames[seatId] || '');
    }
    setEditIdx(null);
  };

  const handleSaveAll = () => {
    if (typeof onNomeChange === 'function') {
      entradasSeleccionadas.forEach((seat, idx) => {
        const seatId = getSeatId(seat);
        onNomeChange(idx, seatNames[seatId] || '');
      });
    }
    setEditAll(false);
    setEditIdx(null);
  };

  useEffect(() => {
    if (!editAll) return;
    const handleClick = (e: MouseEvent) => {
      if (!(e.target instanceof HTMLElement)) return;
      // If click is not on an input or the Gardar Nomes button, save all
      if (!e.target.closest('input.form-control') && !e.target.closest('.reserva-entrada-btn')) {
        handleSaveAll();
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [editAll, entradasSeleccionadas, onNomeChange, seatNames]);

  return (
    entradasSeleccionadas.length > 0 ? (
      <div className="form-group">
        <label>
          <FaTicketAlt style={{ marginRight: "6px", color: "#ff0093" }} />
          <strong>Entradas Seleccionadas</strong>
        </label>
        <div className="entradas-listado">
          <table>
            <thead>
              <tr>
                <th>Fila</th>
                <th>Butaca</th>
                <th>Zona</th>
                <th>Prezo</th>
                <th>
                  <button
                    type="button"
                    title={editAll ? "Gardar Nomes" : "Engadir Nomes"}
                    className="reserva-entrada-btn"
                    onClick={() => {
                      if (editAll) {
                        handleSaveAll();
                      } else {
                        setEditAll(true);
                      }
                    }}
                  >
                    {editAll ? 'Gardar Nomes' : 'Engadir Nome'}
                  </button>
                </th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {entradasSeleccionadas.map((seat, idx) => {
                const seatId = getSeatId(seat);
                return (
                  <tr key={seatId}>
                    <td>{seat.row}</td>
                    <td>{seat.seat}</td>
                    <td style={{ textTransform: 'capitalize' }}>{seat.zona || '-'}</td>
                    <td>{
                      (() => {
                        let valor = prezoEvento;
                        if (typeof valor === 'string') valor = Number(valor);
                        if (typeof valor === 'number' && !isNaN(valor) && valor > 0) {
                          const isInt = Number.isInteger(valor);
                          return isInt
                            ? valor.toLocaleString('gl-ES') + ' €'
                            : valor.toLocaleString('gl-ES', { minimumFractionDigits: 2 }) + ' €';
                        }
                        return '-';
                      })()
                    }</td>
                    <td>
                      {(editAll || editIdx === idx) ? (
                        <input
                          type="text"
                          className="form-control"
                          value={seatNames[seatId] || ''}
                          placeholder="Nome"
                          onChange={e => {
                            const value = e.target.value;
                            setSeatNames(prev => ({ ...prev, [seatId]: value }));
                          }}
                          style={{ minWidth: 90, maxWidth: 180, width: '140px', height: '38px', padding: '4px 10px', fontSize: '1.05em' }}
                          autoFocus={editIdx === idx && !editAll}
                          onBlur={() => {
                            if (!editAll) handleSave(idx);
                          }}
                          readOnly={false}
                        />
                      ) : (
                        <>{seatNames[seatId] && seatNames[seatId].trim() !== "" ? seatNames[seatId] : '-'}</>
                      )}
                    </td>
                    <td style={{ whiteSpace: 'nowrap', textAlign: 'right' }}>
                      {/* Editar Nome button removed as requested */}
                      {onEliminarButaca && (
                        <button
                          type="button"
                          title="Eliminar butaca"
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#000', fontSize: '1em', verticalAlign: 'middle' }}
                          onClick={() => onEliminarButaca(seat, idx)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </td>
                    <td></td>
                  </tr>
                );
              })}
              <tr className="total-row" style={{ background: '#ffebf5' }}>
                <td style={{ fontWeight: 'bold' }}>{entradasSeleccionadas.length} entrada{entradasSeleccionadas.length !== 1 ? "s" : ""}</td>
                <td></td>
                <td></td>
                <td style={{ fontWeight: 'bold' }}>
                  {(() => {
                    let valor = prezoEvento;
                    if (typeof valor === 'string') valor = Number(valor);
                    if (typeof valor === 'number' && !isNaN(valor) && valor > 0) {
                      const total = valor * entradasSeleccionadas.length;
                      if (Number.isInteger(total)) {
                        return total.toLocaleString('gl-ES') + ' €';
                      } else {
                        return total.toLocaleString('gl-ES', { minimumFractionDigits: 2 }) + ' €';
                      }
                    }
                    return '-';
                  })()}
                </td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    ) : null
  );
});

export default SummaryBox;
