// Graph theory classes and functions for enemy pathfinding algorithm.
// See Enemy.move() for usage of these classes

// Vertex class - state is a point in the 2D map
class Vertex {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  // Return position as an ordered pair so that this can be used as a hash key
  toString() {
    return this.x.toString() + ',' + this.y.toString();
  }

  // Return the separation vector between this and another vertex 
  // as a dictionary. Optionally normalize the vector so that it is unit length
  sepVector(otherV, unit = false) {
    let x = otherV.x - this.x;
    let y = otherV.y - this.y;
    if (x === 0 && y === 0)
      return {x: 0, y: 0};
    else
      return unit ? {x: x / norm(x, y), y: y / norm(x, y)} : {x: x, y: y}
  }

  // Check if this vertex and another share an edge in the pathing graph.
  // Two vertices are defined to share an edge if there is a straight line
  // between them that crosses only walkable tiles and the distance is less
  // than AGGRO_RANGE.
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

// Edge class - state is the pair of vertices that it connects
class Edge {
  constructor(v1, v2) {
    this.v1 = v1;
    this.v2 = v2;
  }
  
  // returning the two vertices with an ordering convention
  // makes this useable as a hash key
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

  // returns distance between the two member vertices
  distance() {
    return distance(this.v1.x, this.v1.y, this.v2.x, this.v2.y);
  }
}

// Graph class - a collection of Edges and Vertices that
// are each stored in both an array any a hash map with
// the output of their toString() methods as the key.
// Setters keep the two data structures synchronized.
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

// Implementation of pseudocode from:
// http://www.gitta.info/Accessibiliti/en/html/Dijkstra_learningObject1.html

// Dijkstra shortest path algorithm. Determines the shortest path between the
// source vertex and each vertex contained in the graph. Since vertices are a
// representation of corners and edges are walkable lines between these corners,
// the shortest path solution for the graph representation of the 2d map defines
// the path one should take to navigate the collision landscape. 
// Returns a struct containing:
//  pathTo : A hash map of vertices with the following property:
//            pathTo[v.toString()] evaluates to the next vertex in the shortest
//            path to 'source'. Applying this operation recursively eventually leads
//            to source
//  distTo : A hash map of floating point values such that:
//            distTo[v.toString()] evaluates to the shortest path distance from
//            v to source
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

// Traverse the tilemap and generate an array of all 'vertices' in the tilemap.
// A vertex is defined to be the junction of 4 tiles where exactly 3 of them are passable.
// Thus, a vertex is basically a 'corner' that must be pathed around. Set the vertex associated
// with a corner to be 10 walkable pixels away from it in each of the x and y direction
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

// generate an array of all edges that connect the vertices in an array
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
