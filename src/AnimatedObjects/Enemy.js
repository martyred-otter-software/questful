class Enemy extends Character {
  constructor(x, y, type) {
    super(x, y, type);
    this.maxHP = this.data['maxHP'];
    this.HP = this.maxHP;
    this.HPBarCenter = this.data['sprite']['HPBarCenter'];
    this.HPBarWidth = this.data['sprite']['HPBarWidth'];
  }

  move() {
    super.move();
    if (this.markedForDeletion)
      return;
    let e = new Vertex(this.x + this.ccx, this.y + this.ccy);
    let p = new Vertex(player.x + player.ccx, player.y + player.ccy);
    let tempGraph = new Graph(new Array(...baseGraph.edges), new Array(...baseGraph.vertices));
    tempGraph.addVertex(e);
    tempGraph.addVertex(p);
    currentPaths2 = [];
    tempGraph.vertices.forEach((v) => {
      if (e.toString() !== v.toString() && e.isEdge(v)) {
        tempGraph.addEdge(new Edge(e, v));
      }
      if (p.toString() !== v.toString() && p.isEdge(v)) {
        tempGraph.addEdge(new Edge(p, v));
        currentPaths2.push(new Edge(p, v));
      }
    });
    let pathData = dijkstra(tempGraph, p);
    console.log(pathData.distTo[e.toString()])
    if (pathData.distTo[e.toString()] === Infinity) {
      console.log(pathData.distTo);
      console.log(tempGraph.edgeMap);
    }
    if (pathData.distTo[e.toString()] < AGGRO_RANGE) {
      if (pathData.pathTo[e.toString()] === undefined)
        return;
      let sepFull = e.sepVector(pathData.pathTo[e.toString()], false);
      let sep = e.sepVector(pathData.pathTo[e.toString()], true);
      currentPath = new Edge(e, pathData.pathTo[e.toString()]);
      let dxNorm = Math.round(this.spd * sep.x);
      this.dx = Math.abs(dxNorm) > Math.abs(sepFull.x) ? sepFull.x
        : Math.abs(dxNorm) >= 1 ? dxNorm : Math.sign(sep.x)
      let dyNorm = Math.round(this.spd * sep.y);
      this.dy = Math.abs(dyNorm) > Math.abs(sepFull.y) ? sepFull.y
        : Math.abs(dyNorm) >= 1 ? dyNorm : Math.sign(sep.y)
    } else {
      this.dx = 0;
      this.dy = 0;
      return;
    }
    let deltaX = this.dx;
    let deltaY = this.dy;
    while (!collisionOk(this.x + deltaX, this.y, this.collisionMask) && deltaX !== 0) {
      deltaX -= Math.sign(deltaX);
      deltaY += Math.sign(deltaY);
    }

    while (!collisionOk(this.x, this.y + deltaY, this.collisionMask) && deltaY !== 0) {
      deltaY -= Math.sign(deltaY);
      if (collisionOk(this.x + deltaX + Math.sign(deltaX), this.y, this.collisionMask))
        deltaX += Math.sign(deltaX);
    }
    this.x += deltaX;
    this.y += deltaY;
    super.move();
  }

  draw() {
    if (this.markedForDeletion)
      return;
    let currentSprite;
    if (this.stands && this.dx === 0 && this.dy === 0)
      currentSprite = this.sprites[this.dir][this.nRunFrames];
    else
      currentSprite = this.sprites[this.dir][Math.floor(this.stepCounter / FRAMES_PER_STEP)];
    for (let i = 0; i < this.HPBarWidth; i++) {
      let c = this.HPBarCenter - this.HPBarWidth / 2 + i;
      for (let j = 0; j < 5; j++) {
        if (this.HP / this.maxHP > i / this.HPBarWidth) {
          currentSprite.data[4 * (this.spriteWidth * j + c)] = 0;
          currentSprite.data[4 * (this.spriteWidth * j + c) + 1] = 255;
        } else {
          currentSprite.data[4 * (this.spriteWidth * j + c)] = 255;
          currentSprite.data[4 * (this.spriteWidth * j + c) + 1] = 0;
        }
        currentSprite.data[4 * (this.spriteWidth * j + c) + 2] = 0;
        currentSprite.data[4 * (this.spriteWidth * j + c) + 3] = 255;
      }
    }
    drawSprite(this.x, this.y, sx, sy, currentSprite);
  }
}
