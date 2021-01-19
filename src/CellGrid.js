import {TileSetContainer} from "./Editor";
import {useState, useEffect, useRef, useContext} from 'react';

export default function CellGrid({width, height, cellSize}) {
  let temp = [];
  let temp2 = [];
  for (let i = 0; i < height; i++) {
    temp.push([]);
    temp2.push([]);
    for (let j = 0; j < width; j++) {
      temp[i].push(null);
      temp2[i].push(new CellDraw(cellSize));
    }
  }
  const tileSet = useContext(TileSetContainer);
  const [cellArray, setCellArray] = useState(temp);
  const [cellDrawMap, setCellDrawMap] = useState(temp2);
  const [dragging, setDragging] = useState(false);
  const [currentCell, setCurrentCell] = useState(null);
  const populate = (loc, cellRef) => {
    let temp = cellArray;
    temp[loc[0]][loc[1]] = cellRef;
    setCellArray(temp);
  };
  useEffect(() => {
    document.addEventListener('mousemove', (e) => {
      if (currentCell && currentCell.current.contains(e.target))
        return;
      let noCellsSelected = true;
      cellArray.forEach((cellRow) => {
        cellRow.forEach((cell) => {
          if (cell && cell.current.contains(e.target)) {
            setCurrentCell(cell);
            noCellsSelected = false;
          }
        })
      })
      if (noCellsSelected)
        setCurrentCell(null);
    });
    document.addEventListener('mouseleave', (e) => {
      setCurrentCell(null);
    });
    document.addEventListener('mousedown', (e) => {
      setDragging(true);
    })
    document.addEventListener('mouseup', (e) => {
      setDragging(false);
    })
  }, []);

  useEffect(() => {
    if (dragging) {
      cellArray.forEach((cellRow, i) => {
        cellRow.forEach((cell, j) => {
          if (cell === currentCell) {
            let temp2 = cellDrawMap;
            temp2[i][j].unselectedIdx = tileSet.currentTileIdx;
            setCellDrawMap(temp2);
          }
        })
      })
    }
  }, [currentCell, dragging]);
  return <div className="cellGrid">{cellArray.map((cellRow, i) => {
    return <div key={i} className="cellRow">{cellRow.map((cell, j) => {
      return <Cell key={[i, j]} className="cell" loc={[i, j]} populate={populate} currentCell={currentCell}
                   cellMap={cellDrawMap} size={cellSize}/>
    })}</div>
  })}</div>;
}

export function Cell({loc, populate, currentCell, cellMap, size}) {
  const [selected, setSelected] = useState(false);
  const tileSet = useContext(TileSetContainer);
  const thisComponent = useRef();
  useEffect(() => {
    populate(loc, thisComponent);
  }, []);
  useEffect(() => {
    setSelected(thisComponent === currentCell);
  }, [currentCell]);
  useEffect(() => {
    let ctx = thisComponent.current.getContext('2d');
    cellMap[loc[0]][loc[1]].draw(ctx, selected, tileSet);
  }, [selected, tileSet])
  return <canvas ref={thisComponent} width={size} height={size}/>;
}

export class CellDraw {
  constructor(dim) {
    this.dim = dim;
    this.unselectedIdx = 0;
  }

  draw(ctx, selected, tileSet) {
    let imgRef = selected ? tileSet.getCurrentTile() : tileSet.tiles[this.unselectedIdx];
    let imgData = new ImageData(this.dim, this.dim);
    for (let i = 0; i < imgData.data.length; i++) {
      if (i % 4 === 3) {
        imgData.data[i] = selected ? 200 : 255;
      } else {
        imgData.data[i] = imgRef.data[i];
    }
  }
    ctx.putImageData(imgData, 0, 0);
  }
}