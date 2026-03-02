import { useState } from "react";

// Cada fila é un array, onde "null" é espazo / pasillo 25
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


const AuditorioOurenseEsquerda = () => {
  // Estado das butacas: false = libre, true = seleccionada
  const [seats, setSeats] = useState<boolean[][]>(
    AUDITORIO.map((fila) => fila.map(() => false))
    );

  const handleSeatClick = (row: number, col: number) => {
    if (AUDITORIO[row][col] === null) return; // non se pode clicar no pasillo

    const newSeats = seats.map((r, rowIndex) =>
      r.map((s, colIndex) =>
        rowIndex === row && colIndex === col ? !s : s
      )
    );
    setSeats(newSeats);
  };

  return (
    <div style={{ padding: 20 }}>
      {seats.map((row, rowIndex) => (
        <div key={rowIndex} style={{ display: "flex", justifyContent: "center", marginBottom: 5 }}>
          {row.map((seat, colIndex) => {
            if (AUDITORIO[rowIndex][colIndex] === null) {
              return <div key={colIndex} style={{ width: 20, height: 20, margin: 2 }} />; // espazo
            }
            return (
              <div
                key={colIndex}
                onClick={() => handleSeatClick(rowIndex, colIndex)}
                className={seat ? "butaca butaca-selected" : "butaca butaca-dispoñible"}
                style={{
                  width: 20,
                  height: 20,
                  margin: 2,
                }}
              >
              
              </div>
            );
          })}
        </div>
      ))}
      <p style={{ marginTop: 8 }}>
        Butacas reservadas: {seats.flat().filter((s) => s).length}
      </p>
    </div>
  );
};

export default AuditorioOurenseEsquerda;
