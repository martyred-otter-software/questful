class Projectile extends AnimatedObject {
  constructor(x, y, dx, dy, type) {
    super(x, y, type);
    if (norm(dx, dy) === 0) {
      this.markedForDeletion = true;
      return;
    }
    this.travelAngle = Math.acos(dx / norm(dx, dy));
    this.hx = this.data['projectileLength'] / 2 * dx / norm(dx, dy);
    this.hy = this.data['projectileLength'] / 2 * dy / norm(dx, dy);
    this.dx = this.spd * dx / norm(dx, dy);
    this.dy = this.spd * dy / norm(dx, dy);
    this.distanceTravelled = 0;
    this.range = this.data['range'];
    if (dy < 0)
      this.travelAngle = 2 * Math.PI - this.travelAngle;
    let tempArray = ['r', 'dr', 'd', 'dl', 'l', 'ul', 'u', 'ur','r'];
    this.dir = tempArray[Math.round(this.travelAngle * 4 / Math.PI)];
  }

  move() {
    if (this.markedForDeletion)
      return;
    this.x += this.dx;
    this.y += this.dy;
    let hix = Math.floor((this.x + this.ccx + this.hx) / TILE_WIDTH);
    let hiy = Math.floor((this.y + this.ccy + this.hy) / TILE_HEIGHT);
    if (hix < 0 || hiy < 0 || hix >= mapWidth || hiy >= mapHeight || !tileData[tileMap[hiy][hix]]['passable']) {
      this.markedForDeletion = true;
      return;
    }
    for (let i = 0; i < enemies.length; i++) {
      let e = enemies[i];
      let hsx = this.x + this.ccx + this.hx - e.x;
      let hsy = this.y + this.ccy + this.hy - e.y;
      if (hsx >= 0 && hsx < e.spriteWidth && hsy >= 0 && hsy < e.spriteHeight){
        if (e.sprites[e.dir][Math.floor(e.stepCounter / FRAMES_PER_STEP)].data[4 * (hsx + hsy * e.spriteWidth) + 3] !== 0) {
          this.markedForDeletion = true;
          e.HP -= player.attackDamage;
          if (e.HP <= 0)
            e.markedForDeletion = true;
        }
      }
    }
    this.distanceTravelled += norm(this.dx, this.dy);
    if (this.distanceTravelled >= this.range)
      this.markedForDeletion = true;
  }

  draw() {
    if (!this.markedForDeletion) {
      drawSprite(this.x, this.y, sx, sy, this.sprites[this.dir][0]);
    }
  }
}
