class Ally extends Character {
  constructor(x, y, type) {
    super(x, y, type);
  }
  draw() {
    drawSprite(this.x, this.y, sx, sy, this.sprites['d'][0]);
  }
}
