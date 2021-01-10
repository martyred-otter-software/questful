import {useState, useEffect, useRef} from 'react';

export default function Editor() {
  const [imgBitmap, setImgBitmap] = useState(null);
  return <>
    <CellGrid width={20} height={5} cellSize={64} bmp={imgBitmap}/> <BitmapEditor w={64} h={64} scale={6}
                                                                                  sendImgBitmap={(bmp) => setImgBitmap(bmp)}/>
  </>;
}

function CellGrid({width, height, cellSize, bmp}) {
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
          if (cell == currentCell) {
            let temp2 = cellDrawMap;
            if (temp2[i][j].unselectedColor !== "#0000ff") {
              temp2[i][j].unselectedColor = "#0000ff";
              setCellDrawMap(temp2);
            }
          }
        })
      })
    }
  }, [currentCell, dragging]);
  return <div className="cellGrid">{cellArray.map((cellRow, i) => {
    return <div key={i} className="cellRow">{cellRow.map((cell, j) => {
      return <Cell key={[i, j]} className="cell" loc={[i, j]} populate={populate} currentCell={currentCell}
                   cellMap={cellDrawMap} size={cellSize} bmp={bmp}/>
    })}</div>
  })}</div>;
}

function Cell({loc, populate, currentCell, cellMap, size, bmp}) {
  const [selected, setSelected] = useState(false);
  const thisComponent = useRef();
  useEffect(() => {
    populate(loc, thisComponent);
  }, []);
  useEffect(() => {
    setSelected(thisComponent === currentCell);
  }, [currentCell]);
  useEffect(() => {
    let ctx = thisComponent.current.getContext('2d');
    cellMap[loc[0]][loc[1]].draw(ctx, selected, bmp);
  }, [selected, bmp])
  return <canvas ref={thisComponent} width={size} height={size}/>;
}

class CellDraw {
  constructor(s) {
    this.selectedColor = "#00ff00";
    this.unselectedColor = "#ff0000";
    this.s = s;
    this.draw = (ctx, selected, bmp) => {
      let currentColor = selected ? this.selectedColor : this.unselectedColor;
      if (bmp && currentColor !== "#ff0000") {
        //if (false) {
        let tempImgData = ctx.createImageData(this.s, this.s);
        for (let i = 0; i < tempImgData.data.length; i++) {
          tempImgData.data[i] = bmp[i];
          if (selected && i % 4 === 3)
            tempImgData.data[i] = 100;
        }
        ctx.putImageData(tempImgData, 0, 0);
      } else {
        ctx.fillStyle = currentColor;
        ctx.fillRect(0, 0, this.s, this.s)
      }
    };
  }
}

function BitmapEditor({w, h, scale, sendImgBitmap}) {
  const thisBitmap = useRef();
  const [imgData, setImgData] = useState(null);
  const [curRow, setCurRow] = useState(-1);
  const [curCol, setCurCol] = useState(-1);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let ctx = thisBitmap.current.getContext('2d');
    ctx.fillStyle = "#ff0000";
    ctx.fillRect(0, 0, w * scale, h * scale);
    setImgData(ctx.getImageData(0, 0, w * scale, h * scale));
    document.addEventListener('mousemove', (e) => {
      if (!thisBitmap.current.contains(e.target)) {
        setCurCol(-1);
        setCurRow(-1);
        return;
      }
      let newCol = Math.floor((e.pageX - thisBitmap.current.getBoundingClientRect().left) / scale);
      let newRow = Math.floor((e.pageY - thisBitmap.current.getBoundingClientRect().top) / scale);
      console.log(newCol, newRow);
      if (newRow === curRow && newCol === curCol)
        return;
      setCurRow(newRow);
      setCurCol(newCol);
    })
    document.addEventListener('mousedown', (e) => {
      setDragging(true);
    })
    document.addEventListener('mouseup', (e) => {
      setDragging(false);
    })
  }, []);

  useEffect(() => {
    let ctx = thisBitmap.current.getContext('2d');
    if (!imgData)
      return;
    ctx.putImageData(imgData, 0, 0);
    if (curCol === -1 || curRow === -1)
      return;
    if (dragging) {
      ctx.fillStyle = "#0000ff";
      ctx.fillRect(curCol * scale, curRow * scale, scale, scale);
      let newImgData = ctx.getImageData(0, 0, w * scale, h * scale);
      setImgData(newImgData);
      let bmpToSend = [];
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          bmpToSend.push(newImgData.data[4 * scale * ((y * scale * w) + x)]);
          bmpToSend.push(newImgData.data[4 * scale * ((y * scale * w) + x) + 1]);
          bmpToSend.push(newImgData.data[4 * scale * ((y * scale * w) + x) + 2]);
          bmpToSend.push(255);
        }
      }
      sendImgBitmap(bmpToSend);
    }
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(curCol * scale, curRow * scale, scale, scale);
  }, [dragging, curCol, curRow]);
  return <>
    <canvas ref={thisBitmap} width={w * scale} height={h * scale}/>
  </>
}