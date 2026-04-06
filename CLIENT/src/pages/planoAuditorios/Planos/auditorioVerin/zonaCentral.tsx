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

// 👇 AUDITORIO REAL CON FILAS COMENTADAS (17 → 1)
export const AUDITORIO: (number | null)[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 17
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 16
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 15
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 14
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 13
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 12
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 11
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 10
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 9
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 8
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 7
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 6
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 5
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 4
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 3
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 2
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1], // Fila 1
];

const AuditorioVerinZonaCentral: React.FC<Props> = ({
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

    const realRow = AUDITORIO.length - rowIndex;
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
      {AUDITORIO.map((row, rowIndex) => {
        const rowNumber = AUDITORIO.length - rowIndex;

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
              {rowNumber}
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

                const realRow = AUDITORIO.length - rowIndex;
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

      {/* ESCENARIO */}
      <div
        style={{
          marginTop: 25,
          height: 40,
          width: 300,
          maxWidth: "100%",
          backgroundColor: "#222",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          fontWeight: "bold",
          letterSpacing: 2,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        ESCENARIO
      </div>
    </div>
  );
};

export default AuditorioVerinZonaCentral;