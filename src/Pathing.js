class Vertex {
  constructor(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
  }

  isEdge(otherV) {
    if (distance(this.x, this.y, otherV.x, otherV.y) >= AGGRO_RANGE)
      return false;


    if (otherV.x - this.x === 0) {
      let start1X = this.x + 1
      let start1Y = this.y;
      let end1X = otherV.x + 1;
      let end1Y = otherV.y;

      let start2X = this.x - 1;
      let start2Y = this.y;
      let end2X = otherV.x - 1;
      let end2Y = otherV.y;
      return isLineOfSight(start1X, start1Y, end1X, end1Y) || isLineOfSight(start2X, start2Y, end2X, end2Y);
    } else if (otherV.y - this.y === 0) {
      let start1X = this.x;
      let start1Y = this.y + 1;
      let end1X = otherV.x;
      let end1Y = otherV.y + 1;

      let start2X = this.x;
      let start2Y = this.y - 1;
      let end2X = otherV.x;
      let end2Y = otherV.y - 1;
      return isLineOfSight(start1X, start1Y, end1X, end1Y) || isLineOfSight(start2X, start2Y, end2X, end2Y);
    } else
      return isLineOfSight(this.x + this.dx, this.y + this.dy, otherV.x + otherV.dx, otherV.y + otherV.dy);
  }

}

class Edge {
  constructor(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
    this.distance = distance(v1.x, v1.y, v2.x, v2.y);
  }

}

class ShortestPathSet {
  constructor(v) {
    this.v = v;

    //Dijkstra's algorithm
  }

  contains(v) {
    return this.v.x === v.x && this.v.y === v.y;
  }
}

function distance(x1, y1, x2, y2) {
  return norm(x2 - x1, y2 - y1);
}

function norm(x, y) {
  return Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2));
}

function computeVertices() {
  let result = [];
  for (let i = 1; i < mapWidth; i++) {
    for (let j = 1; j < mapHeight; j++) {
      if ((+tileData[tileMap[j][i]]['passable']) + (+tileData[tileMap[j - 1][i]]['passable'])
        + (+tileData[tileMap[j][i - 1]]['passable']) + (+tileData[tileMap[j - 1][i - 1]]['passable']) === 3) {
        let dx;
        let dy;
        if (!tileData[tileMap[j][i - 1]]['passable'] || !tileData[tileMap[j - 1][i - 1]]['passable'])
          dx = 1;
        else
          dx = -1;
        if (!tileData[tileMap[j - 1][i]]['passable'] || !tileData[tileMap[j - 1][i - 1]]['passable'])
          dy = 1;
        else
          dy = -1;
        result.push(new Vertex(TILE_WIDTH * i, TILE_HEIGHT * j, dx, dy));
      }
    }
  }
  return result;
}

function computeEdges(v) {
  let result = [];
  for (let i = 0; i < v.length; i++) {
    for (let j = i + 1; j < v.length; j++) {
      if (v[i].isEdge(v[j]))
        result.push(new Edge(v[i], v[j]));
    }
  }
  return result;
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
      } else {
        let y1New = TILE_HEIGHT * (iy1 + iyChange);
        if (iyChange < 0)
          y1New += TILE_HEIGHT - 1;
        let x1New = x1 + (y1New - y1) / slope;
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
