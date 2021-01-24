class NPC extends Character {
  constructor(x, y, type) {
    super(x, y, type);
  }

  move() {
    this.dir = 'd';
  }
}
