class Character extends AnimatedObject {
  constructor(x, y, type) {
    super(x, y, type);
    this.stands = this.data['sprite']['stands'];
    this.nRunFrames = this.data['sprite']['nRunFrames'];
    this.collisionMask = this.data['collisionMask'];
    this.spriteWidth = this.data['sprite']['width'];
    this.spriteHeight = this.data['sprite']['height'];
    this.stepCounter = 0;
    this.attacking = false;
    this.attackX = 0;
    this.attackY = 0;
    this.dir = 'd';
  }

  move() {  // needs to be overridden by child class
    let dir;
    if (this.dx === 0) {
      dir = this.dy > 0 ? 'd'
        : this.dy < 0 ? 'u'
          : '0';
    } else if (this.dy === 0) {
      dir = this.dx > 0 ? 'r'
        : this.dx < 0 ? 'l'
          : '0';
    } else {
      let lut = this.dy > 0 ? ['r', 'dr', 'd', 'dl', 'l']
        : ['r', 'ur', 'u', 'ul', 'l'];
      let theta = Math.acos(this.dx / norm(this.dx, this.dy));
      dir = lut[Math.round(theta / (Math.PI / 4))];
    }
    if (dir !== '0') {
      this.dir = dir;
      this.stepCounter++;
      this.stepCounter %= this.nRunFrames * FRAMES_PER_STEP;
    }
  }

  draw() {
    if (this.stands && this.dx === 0 && this.dy === 0)
      drawSprite(this.x, this.y, sx, sy, this.sprites[this.dir][this.nRunFrames]);
    else
      drawSprite(this.x, this.y, sx, sy, this.sprites[this.dir][Math.floor(this.stepCounter / FRAMES_PER_STEP)]);
  }
}
