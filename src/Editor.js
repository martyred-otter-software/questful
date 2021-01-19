import React, {useState, useEffect, useRef, useContext} from 'react';
import TileSet from './TileSet';
import CellGrid, {Cell, CellDraw} from './CellGrid';
import {ChromePicker} from 'react-color';

const SIZE = 64;
export const TileSetContainer = React.createContext(null);

export default function Editor() {
  const [tileSet, setTileSet] = useState(new TileSet(SIZE));
  return <TileSetContainer.Provider value={tileSet}>
    <CellGrid width={20} height={5} cellSize={SIZE}/>
    <div className="row">
      <BitmapEditor w={SIZE} h={SIZE} scale={6} sendImgBitmap={(bmp) => {
        let newImgData = new ImageData(SIZE, SIZE);
        for (let i = 0; i < bmp.length; i++)
          newImgData.data[i] = bmp[i];
        let temp = new TileSet(SIZE);
        temp.set(tileSet);
        temp.updateCurrentTile(newImgData);
        setTileSet(temp);
      }}/>
      <ChromePicker/><TileSelector width={8} height={4} cellSize={SIZE}/>
    </div>
  </TileSetContainer.Provider>;
}



function BitmapEditor({w, h, scale, sendImgBitmap}) {
  const thisBitmap = useRef();
  const tileSet = useContext(TileSetContainer);
  const [imgData, setImgData] = useState(null);
  const [curRow, setCurRow] = useState(-1);
  const [curCol, setCurCol] = useState(-1);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    let ctx = thisBitmap.current.getContext('2d');
    let tmpImgData = dilateAndDraw(tileSet.getCurrentTile(), w, h, scale, ctx);
    setImgData(tmpImgData);
    document.addEventListener('mousemove', (e) => {
      if (!thisBitmap.current.contains(e.target)) {
        setCurCol(-1);
        setCurRow(-1);
        return;
      }
      let newCol = Math.floor((e.pageX - thisBitmap.current.getBoundingClientRect().left) / scale);
      let newRow = Math.floor((e.pageY - thisBitmap.current.getBoundingClientRect().top) / scale);
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

function dilateAndDraw(imgData, w, h, scale, ctx) {
  for (let i = 0; i < imgData.data.length / 4; i++) {
    ctx.fillStyle = "#" + imgData.data[i * 4].toString(16)
      + imgData.data[i * 4 + 1].toString(16) + imgData.data[i * 4 + 2].toString(16);
    let x = scale * (i % w);
    let y = scale * Math.floor(i / w);
    ctx.fillRect(x, y, scale, scale);
  }
  return ctx.getImageData(0, 0, w * scale, h * scale);
}



function TileSelector({width, height, cellSize}) {
  const tileSet = useContext(TileSetContainer);
  const [tileGrid, setTileGrid] = useState(null);
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

  useEffect(() => {
    let temp = tileGrid;
    tileSet.tiles.forEach((tile, idx) => {
      let x = (idx - 1) % width;
      let y = Math.floor((idx - 1) / width);
      temp[y][x] = tile;
    });
    setTileGrid(temp);
  }, [tileSet]);
  return <></>
}

