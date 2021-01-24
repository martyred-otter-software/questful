class Player extends Character {
  constructor(x, y, type) {
    super(x, y, type);
    this.attackDamage = this.data['attackDamage'];
    this.attackRange = this.data['attackRange'];
    this.attackArc = this.data['attackArcDeg'] * Math.PI / 180;
    this.rx = this.data['rangedAttackOrigin'][0];
    this.ry = this.data['rangedAttackOrigin'][1];
    this.attackTimer = 0;
    this.attackDelay = 5;
    this.mx = 0;
    this.my = 0;
    this.attackType = 'ranged';
    this.maxHP = this.data['maxHP'];
    this.HP = 0.8 * this.maxHP;
  }

  move() {
    super.move();
    if (this.attacking)
      this.attack();
    this.attackTimer++;
    let deltaX = this.dx;
    while (!collisionOk(this.x + deltaX, this.y, this.collisionMask) && deltaX !== 0) {
      deltaX -= Math.sign(deltaX);
    }
    this.x += deltaX;
    let cx = this.x - sx;
    if (cx < PADDING_SIZE && deltaX < 0) {
      sx += deltaX;
      if (sx < 0) {
        this.x -= (deltaX - sx);
        sx = 0;
      }
    }
    if (cx + this.spriteWidth + PADDING_SIZE > window.innerWidth && deltaX > 0) {
      sx += deltaX;
      if (sx > TILE_WIDTH * mapWidth - window.innerWidth) {
        this.x -= deltaX - (sx - (TILE_WIDTH * mapWidth - window.innerWidth));
        sx = TILE_WIDTH * mapWidth - window.innerWidth;
      }
    }
    let deltaY = this.dy;
    while (!collisionOk(this.x, this.y + deltaY, this.collisionMask) && deltaY !== 0) {
      deltaY -= Math.sign(deltaY);
    }

    this.y += deltaY;
    let cy = this.y - sy;
    if (cy < PADDING_SIZE && deltaY < 0) {
      sy += deltaY;
      if (sy < 0) {
        this.y -= (deltaY - sy);
        sy = 0;
      }
    }
    if (cy + this.spriteHeight + PADDING_SIZE > viewableHeight && deltaY > 0) {
      sy += deltaY;
      if (sy > TILE_HEIGHT * mapHeight - viewableHeight) {
        this.y -= deltaY - (sy - (TILE_HEIGHT * mapHeight - viewableHeight));
        sy = TILE_HEIGHT * mapHeight - viewableHeight;
      }
    }
    for (let i = 0; i < loadingZones.length; i++) {
      var ix = Math.floor((player.x + player.ccx) / TILE_WIDTH);
      var iy = Math.floor((player.y + player.ccy) / TILE_HEIGHT);
      if (ix === loadingZones[i]['ix'] && iy === loadingZones[i]['iy']) {
        x0 = loadingZones[i]['x0'];
        y0 = loadingZones[i]['y0'];
        reloadLZ = true;
        currentLZ = loadingZones[i]['destination'];
      }
    }
  }

  draw() {
    let sprite = ctx.createImageData(this.spriteWidth, this.spriteHeight);
    for (let i = 0; i < 4 * this.spriteWidth * this.spriteHeight; i++) {
      if (this.stands && this.dx === 0 && this.dy === 0) {
        sprite.data[i] = this.sprites[this.dir][this.nRunFrames].data[i];
      } else {
        sprite.data[i] = this.sprites[this.dir][Math.floor(this.stepCounter / FRAMES_PER_STEP)].data[i];
      }
      if (this.attacking) {
        if (sprite.data[4 * Math.floor(i / 4) + 3] !== 0) {
          sprite.data[4 * Math.floor(i / 4)] = 255;
        }
      }
    }
    drawSprite(this.x, this.y, sx, sy, sprite);
  }

  setAttacking(mx, my) {
    this.attacking = true;
    this.mx = mx;
    this.my = my;
  }

  attack() {
    this.attackX = this.mx - (this.x + this.rx) + sx;
    this.attackY = this.my - (this.y + this.ry) + sy;
    if (this.attackTimer < this.attackDelay)
      return;
    this.attackTimer = 0;
    if (this.attackType === 'melee')
      this.meleeAttack();
    else if (this.attackType === 'ranged')
      this.rangedAttack();
  }

  meleeAttack() {
    for (let i = 0; i < enemies.length; i++) {
      let enemy = enemies[i];
      let sepX = enemy.x + enemy.ccx - (this.x + this.ccx);
      let sepY = enemy.y + enemy.ccy - (this.y + this.ccy);
      let dist = distance(this.x + this.ccx, this.y + this.ccy, enemy.x + enemy.ccx, enemy.y + enemy.ccy)
      let attackInRange = true;
      if (dist >= this.attackRange)
        attackInRange = false;
      let attackAngle = Math.acos((this.attackX - this.x - this.ccx) / dist);
      if (this.attackY - this.y - this.ccy < 0)
        attackAngle = 2 * Math.PI - attackAngle;
      let theta1 = attackAngle - this.attackArc / 2;
      let theta2 = attackAngle + this.attackArc / 2;
      let theta = Math.acos(sepX / dist);
      if (sepY < 0)
        theta = 2 * Math.PI - theta;
      if (theta1 < 0 && theta > Math.PI) {
        theta1 += 2 * Math.PI;
        theta2 += 2 * Math.PI;
      }
      if (theta2 > 2 * Math.PI && theta < Math.PI) {
        theta1 -= 2 * Math.PI;
        theta2 -= 2 * Math.PI;
      }
      if (theta > theta2 || theta < theta1)
        attackInRange = false;
      if (attackInRange) {
        enemy.HP -= this.attackDamage;
        if (enemy.HP <= 0)
          enemy.markedForDeletion = true;
      }
    }
  }

  rangedAttack(){
    animatedObjects.push(new Projectile(this.x + this.rx, this.y + this.ry, this.attackX, this.attackY, 'playerRangedAttack'));
  }
}
