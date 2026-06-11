import React, { useState } from "react";

interface SelectedSeat {
  row: number;
  seat: number;
}

interface Props {
  selectedSeats?: SelectedSeat[];
  reservedSeats?: SelectedSeat[];
  myReservedSeats?: SelectedSeat[];
  soldSeats?: SelectedSeat[];
  onSelectionChange?: (seats: SelectedSeat[]) => void;
  onMyReservedSeatClick?: (seat: SelectedSeat) => void;
  areaActiva?: boolean;
  blockReservedSeats?: boolean;
}

export const AUDITORIO: (number | null)[][] = [
    [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null], //14
    [null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null], //13
    [null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], //12
    [null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], //11
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,null,null], //10
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,null,null], //9
    [null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,null], //8
    [null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,null], //7
    [null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,null], //6
    [null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,null], //5
    [null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1], //4
    [null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1,1], //3
    [null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1,1], //2
    [null,null,null,null,null,null,null,null,null,null,null,null,null,1,1,1,1,1,1,1],       //1 
];

const AuditorioOurenseEsquerda: React.FC<Props> = ({
  selectedSeats,
  reservedSeats,
  myReservedSeats,
  soldSeats,
  onSelectionChange,
  onMyReservedSeatClick,
  areaActiva = true,
  blockReservedSeats = false,
}) => {
  const [internalSelectedSeats, setInternalSelectedSeats] = useState<SelectedSeat[]>([]);
  const activeSelectedSeats = selectedSeats ?? internalSelectedSeats;
  const activeReservedSeats = reservedSeats ?? [];
  const activeMyReservedSeats = myReservedSeats ?? [];
  const activeSoldSeats = soldSeats ?? [];
  const handleSelectionChange = onSelectionChange ?? setInternalSelectedSeats;

  const handleSeatClick = (rowIndex: number, colIndex: number) => {
    if (AUDITORIO[rowIndex][colIndex] === null) return;
    if (!areaActiva) return;

    // Usar o mesmo filtro que na renderización para calcular o número correto de fila
    const filasConButacas = AUDITORIO.filter(row => !row.every(seat => seat === null));
    let numeroFila = filasConButacas.length;

    const realRow = (() => {
      for (let i = 0; i < rowIndex; i++) {
        if (!AUDITORIO[i].every(seat => seat === null)) {
          numeroFila--;
        }
      }
      return numeroFila;
    })();

    const realSeat = colIndex + 1;

    const isReserved = activeReservedSeats.some(
      (s) => s.row === realRow && s.seat === realSeat
    );
    if (blockReservedSeats && isReserved) return;

    const isSold = activeSoldSeats.some(
      (s) => s.row === realRow && s.seat === realSeat
    );
    if (isSold) return;

    const isMyReserved = activeMyReservedSeats.some(
      (s) => s.row === realRow && s.seat === realSeat
    );

    if (isMyReserved) {
      onMyReservedSeatClick?.({ row: realRow, seat: realSeat });
      return;
    }

    const exists = activeSelectedSeats.some(
      (s) => s.row === realRow && s.seat === realSeat
    );

    let updated: SelectedSeat[];

    if (exists) {
      updated = activeSelectedSeats.filter(
        (s) => !(s.row === realRow && s.seat === realSeat)
      );
    } else {
      updated = [...activeSelectedSeats, { row: realRow, seat: realSeat }];
    }

    handleSelectionChange(updated);
  };



  return (
    <div style={{ padding: 20 }}>
      {(() => {
        // Calcular números de fila só para as filas que teñen butacas
        const filasConButacas = AUDITORIO.filter(row => !row.every(seat => seat === null));
        
        // Calcular map de rowIndex a numeroFila para consistencia
        const rowIndexToFila = new Map<number, number>();
        let filaCounter = filasConButacas.length;
        AUDITORIO.forEach((row, idx) => {
          if (!row.every(seat => seat === null)) {
            rowIndexToFila.set(idx, filaCounter);
            filaCounter--;
          }
        });

        return (
          <>
            {AUDITORIO.map((row, rowIndex) => {
              const isEmptyRow = row.every(seat => seat === null);
              const displayNumber = isEmptyRow ? "" : rowIndexToFila.get(rowIndex);

              return (
                <div
                  key={rowIndex}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 5,
                  }}
                >
                  {/* Número de fila */}
                  <div
                    style={{
                      width: 30,
                      textAlign: "right",
                      marginRight: 10,
                      fontWeight: 700,
                      color: "#444",
                    }}
                  >
                    {displayNumber}
                  </div>

                  {/* Butacas */}
                  <div style={{ display: "flex" }}>
                    {row.map((seat, colIndex) => {

                      if (seat === null) {
                        return (
                          <div
                            key={colIndex}
                            style={{ width: 22, height: 22, margin: 3 }}
                          />
                        );
                      }

                      const realRow = isEmptyRow ? -1 : displayNumber;
                      const realSeat = colIndex + 1;

                      const isReserved = activeReservedSeats.some(
                        (s) => s.row === realRow && s.seat === realSeat
                      );

                      const isMyReserved = activeMyReservedSeats.some(
                        (s) => s.row === realRow && s.seat === realSeat
                      );
                      const isSold = activeSoldSeats.some(
                        (s) => s.row === realRow && s.seat === realSeat
                      );
                      const isSelected = activeSelectedSeats.some(
                        (s) => s.row === realRow && s.seat === realSeat
                      );

                      let className = "butaca ";
                      let cursor = "pointer";
                      let title = "";
                      
                      if (!areaActiva) {
                        className += "butaca-inactiva";
                        cursor = "not-allowed";
                        title = "🚫";
                      } else if (blockReservedSeats && isReserved) {
                        className += "butaca-inactiva";
                        cursor = "not-allowed";
                        title = "Reservada";
                      } else if (isSold) {
                        className += "butaca-vendida";
                        cursor = "not-allowed";
                        title = "Vendida";
                      } else if (isMyReserved) {
                        className += "butaca-my-reserved";
                        title = "Clica para eliminar";
                      } else if (isSelected) {
                        className += "butaca-selected";
                      } else {
                        className += "butaca-dispoñible";
                      }

                      return (
                        <div
                          key={colIndex}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSeatClick(rowIndex, colIndex);
                          }}
                          className={className}
                          style={{ cursor }}
                          title={title}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </>
        );
      })()}

      {/* ESCENARIO - Frecha grande á dereita */}
      <div
        style={{
          marginTop: 25,
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
          }}
        >
          {/* Corpo máis delgado */}
          <div
            style={{
              width: 180,
              height: 40,
              backgroundColor: "#222",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              letterSpacing: 2,
              borderTopLeftRadius: 6,
              borderBottomLeftRadius: 6,
            }}
          >
            ESCENARIO
          </div>

          {/* Punta GRANDE á dereita */}
          <div
            style={{
              width: 0,
              height: 0,
              borderTop: "35px solid transparent",
              borderBottom: "35px solid transparent",
              borderLeft: "60px solid #222",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuditorioOurenseEsquerda;