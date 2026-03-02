import { useState } from "react";

// Cada fila é un array, onde "null" é espazo / pasillo 25
export const AUDITORIO: (number | null)[][] = [
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],  //21
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null], //20
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null], //19
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null], //18
    [null,null,null,null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null], //17
    [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null], //16
    [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null], //15
    [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null], //14
    [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null], //13
    [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null], //12
    [null,null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null], //11
    [null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null],  //10
    [null,null,1,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null],     //9     
    [null,null,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null],  //8
    [null,null,1,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null],    //7     
    [null,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null,null], //6
    [null,1,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null,null],    //5     
    [null,1,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null], //4
    [null,1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],    //3     
    [1,1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],       //2  
    [1,1,1,1,1,1,1,1,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null],       //1 
];


const AuditorioOurenseDereita = () => {
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

export default AuditorioOurenseDereita;
