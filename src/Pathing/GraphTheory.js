class Vertex {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  toString() {
    return this.x.toString() + ',' + this.y.toString();
  }

  sepVector(otherV, unit = false) {
    let x = otherV.x - this.x;
    let y = otherV.y - this.y;
    if (x === 0 && y === 0)
      return {x: 0, y: 0};
    else
      return unit ? {x: x / norm(x, y), y: y / norm(x, y)} : {x: x, y: y}
  }

  isEdge(otherV) {
    if (distance(this.x, this.y, otherV.x, otherV.y) >= AGGRO_RANGE)
      return false;
    else if (otherV.x === this.x || otherV.y === this.y)
      return isLineOfSight(this.x, this.y, otherV.x, otherV.y);
    else
      return isLineOfSight(this.x, this.y, otherV.x, otherV.y)
        && isLineOfSight(otherV.x, otherV.y, this.x, this.y)
        && isLineOfSight(this.x+3, this.y, otherV.x+3, otherV.y)
        && isLineOfSight(otherV.x, otherV.y+3, this.x, this.y+3);
  }
}

class Edge {
  constructor(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
  }

  toString() {
    if (this.v1.x < this.v2.x)
      return this.v1.toString() + ';' + this.v2.toString();
    else if (this.v2.x < this.v1.x)
      return this.v2.toString() + ';' + this.v1.toString();
    else if (this.v1.y < this.v2.y)
      return this.v1.toString() + ';' + this.v2.toString();
    else
      return this.v2.toString() + ';' + this.v1.toString();
  }

  distance() {
    return distance(this.v1.x, this.v1.y, this.v2.x, this.v2.y);
  }
}

class Graph {
  constructor(edges, vertices) {
    this.edgeMap = {};
    this.edges = edges;
    this.vertices = vertices;
    for (let i = 0; i < edges.length; i++) {
      let edge = edges[i];
      this.edgeMap[edge.toString()] = edge;
    }
  }

  addEdge(edge) {
    this.edges.push(edge);
    this.edgeMap[edge.toString()] = edge;
  }

  addVertex(vertex) {
    this.vertices.push(vertex);
  }
}

// http://www.gitta.info/Accessibiliti/en/html/Dijkstra_learningObject1.html
function dijkstra(graph, source) {
  let dist = {};
  let previous = {};
  graph.vertices.forEach((v) => {
    dist[v.toString()] = Infinity;
    previous[v.toString()] = undefined;
  });
  dist[source.toString()] = 0;
  let Q = new Array(...graph.vertices);
  while (Q.length > 0) {
    let uIdx = NaN;
    let u = Q.reduce((min, q, i) => {
      if (!min) {
        uIdx = i;
        return q;
      } else if (dist[min.toString()] < dist[q.toString()]) {
        return min;
      } else {
        uIdx = i;
        return q;
      }
    });
    Q.splice(uIdx, 1);
    Q.forEach((v) => {
      let curEdge = new Edge(u, v);
      if (graph.edgeMap[curEdge.toString()]) {
        let alt = dist[u.toString()] + curEdge.distance();
        if (alt < dist[v.toString()]) {
          dist[v.toString()] = alt;
          previous[v.toString()] = u;
        }
      }
    });
  }
  return {pathTo: previous, distTo: dist};
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
          dx = 10;
        else
          dx = -11;
        if (!tileData[tileMap[j - 1][i]]['passable'] || !tileData[tileMap[j - 1][i - 1]]['passable'])
          dy = 10;
        else
          dy = -11;
        result.push(new Vertex(TILE_WIDTH * i + dx, TILE_HEIGHT * j + dy));
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
