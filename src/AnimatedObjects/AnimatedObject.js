class AnimatedObject {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0

    this.data = allAnimatedObjectData[type];
    this.type = type;

    this.sprites = allSprites[type];
    this.spd = this.data['speed'];
    this.ccx = this.data['collisionCenter'][0];
    this.ccy = this.data['collisionCenter'][1];
    this.markedForDeletion = false;
  }
}
