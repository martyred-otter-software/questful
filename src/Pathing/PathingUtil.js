function distance(x1, y1, x2, y2) {
  return norm(x2 - x1, y2 - y1);
}

function norm(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function isLineOfSight(x1, y1, x2, y2) {    // check if line is a line-of-sight
  let ix1 = Math.floor(x1 / TILE_WIDTH);
  let iy1 = Math.floor(y1 / TILE_HEIGHT);
  let ix2 = Math.floor(x2 / TILE_WIDTH);
  let iy2 = Math.floor(y2 / TILE_HEIGHT);
  if (!tileData[tileMap[iy1][ix1]]['passable'])
    return false;
  if (ix1 === ix2 && iy1 === iy2)
    return true;
  else {
    if (ix1 === ix2)      // special cases to avoid dividing by zero
      return isLineOfSight(x1, TILE_HEIGHT * (iy1 + Math.sign(y2 - y1)), x2, y2);
    else if (iy1 === iy2) // "
      return isLineOfSight(TILE_WIDTH * (ix1 + Math.sign(x2 - x1)), y1, x2, y2);
    else {
      let ixChange;
      let iyChange;
      let slope = (y2 - y1) / (x2 - x1);
      if (x1 % TILE_WIDTH === 0)
        ixChange = Math.sign(x2 - x1);
      else
        ixChange = 0.5 + 0.5 * Math.sign(x2 - x1);
      if (y1 % TILE_HEIGHT === 0)
        iyChange = Math.sign(y2 - y1);
      else
        iyChange = 0.5 + 0.5 * Math.sign(y2 - y1);
      if (ix1 + ixChange === ix2 && iy1 + iyChange === iy2)
        return true;
      if (y1 + slope * (TILE_WIDTH * (ixChange + ix1) - x1) >= iy1 * TILE_HEIGHT && y1 + slope * (TILE_WIDTH * (ixChange + ix1) - x1) < (iy1 + 1) * TILE_HEIGHT) {
        let x1New = TILE_WIDTH * (ix1 + ixChange);
        if (ixChange < 0)
          x1New += TILE_WIDTH - 1;
        let y1New = y1 + slope * (x1New - x1);
        return isLineOfSight(x1New, y1New, x2, y2);
      } else if (x1 + 1 / slope * (TILE_HEIGHT * (iyChange + iy1) - y1) >= ix1 * TILE_WIDTH && x1 + 1 / slope * (TILE_HEIGHT * (iyChange + iy1) - y1) < (ix1 + 1) * TILE_WIDTH) {
        let y1New = TILE_HEIGHT * (iy1 + iyChange);
        if (iyChange < 0)
          y1New += TILE_HEIGHT - 1;
        let x1New = x1 + (y1New - y1) / slope;
        return isLineOfSight(x1New, y1New, x2, y2);
      } else if (ixChange !== 0) {
        let x1New = x1 + Math.sign(ixChange);
        let y1New = y1 + slope * (x1New - x1);
        return isLineOfSight(x1New, y1New, x2, y2);
      } else {
        let y1New = y1 + Math.sign(iyChange);
        let x1New = x1 + 1 / slope * (y1New - y1);
        return isLineOfSight(x1New, y1New, x2, y2);
      }
    }
  }
}

function collisionOk(x, y, mask) {
  let result = true;
  for (let u = 0; u < mask.length; u++) {
    for (let v = 0; v < mask[u].length; v++) {
      let ix = Math.floor((x + u) / TILE_WIDTH);
      let iy = Math.floor((y + v) / TILE_HEIGHT);
      if (mask[v][u] !== 0 && tileData[tileMap[iy][ix]]['passable'] === false)
        result = false;
    }
  }
  return result;
}
