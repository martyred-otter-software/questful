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
    if (!tileData[tileMap[hiy][hix]]['passable']) {
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
    let dir = DIRECTIONS[4 + this.dx / this.spd + 3 * this.dy / this.spd];
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

  attack() {
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

class Ally extends Character {
  constructor(x, y, type, id) {
    super(x, y, type);
    this.id = id;
  }
  draw() {
    drawSprite(this.x, this.y, sx, sy, this.sprites['d'][0]);
  }
}

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
    if (distance(this.x, this.y, player.x, player.y) < AGGRO_RANGE) {
      this.dx = Math.min(this.spd, Math.abs(player.x - this.x)) * Math.sign(player.x - this.x);
      this.dy = Math.min(this.spd, Math.abs(player.y - this.y)) * Math.sign(player.y - this.y);
    } else {
      this.dx = 0;
      this.dy = 0;
      return;
    }
    let deltaX = this.dx;
    while (!collisionOk(this.x + deltaX, this.y, this.collisionMask) && deltaX !== 0) {
      deltaX -= Math.sign(deltaX);
    }
    this.x += deltaX;

    let deltaY = this.dy;
    while (!collisionOk(this.x, this.y + deltaY, this.collisionMask) && deltaY !== 0) {
      deltaY -= Math.sign(deltaY);
    }
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

class NPC extends Character {
  constructor(x, y, type) {
    super(x, y, type);
  }

  move() {
    this.dir = 'd';
  }
}
