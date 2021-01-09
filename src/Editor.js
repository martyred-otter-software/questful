import {useState, useEffect, useRef} from 'react';

export default function Editor() {
  return <CellGrid width={20} height={10} x={0} y={0} cellSize={10} />
}

function CellGrid({width, height, x, y, cellSize}) {
  let temp = [];
  for (let i = 0; i < height; i++) {
    temp.push([]);
    for (let j = 0; j < width; j++)
      temp[i].push(null);
  }
  const [cellArray, setCellArray] = useState(temp);
  const [currentCell, setCurrentCell] = useState(null);
  const populate = (loc, cellRef) => {
    let temp = cellArray;
    temp[loc[0]][loc[1]] = cellRef;
    setCellArray(temp);
  };
  useEffect(() => {
    document.addEventListener('mousemove', (e) => {
      let oneCellHovered = false;
      cellArray.forEach((cellRow) => {
        cellRow.forEach((cell) => {
          if (cell && cell.current.contains(e.target)) {
            setCurrentCell(cell);
            oneCellHovered = true;
          }
        })
      })
      if (!oneCellHovered)
        setCurrentCell(null);
    });
    document.addEventListener('mouseleave', (e) => {
      setCurrentCell(null);
    });
  }, []);
  return <div className="cellGrid">{cellArray.map((cellRow, i) => {
    return <div key={i} className="cellRow">{cellRow.map((cell, j) => {
      return <Cell key={[i, j]} className="cell" loc={[i, j]} populate={populate} currentCell={currentCell}/>
    })}</div>
  })}</div>;
}

function Cell({loc, populate, currentCell}) {
  const [selected, setSelected] = useState(false);
  const thisComponent = useRef();
  const canvas = useRef();
  useEffect(() => {
    populate(loc, thisComponent);
  }, []);
  useEffect(() => {
    setSelected(thisComponent === currentCell);
  }, [currentCell]);
  useEffect(() => {
    console.log("rerun");
    let ctx = thisComponent.current.getContext('2d');
    ctx.fillStyle = selected? "#00ff00" : "#ff0000";
    ctx.fillRect(0, 0, 64, 64);
  }, [selected])
  return <canvas ref={thisComponent} width={64} height={64} />;
}