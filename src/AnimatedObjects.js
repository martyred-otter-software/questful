import { norm, distance, collisionOk } from './Pathing';
import { drawSprite } from './Graphics';
import { global } from './main';

class AnimatedObject {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.dx = 0;
    this.dy = 0;
    this.sprites = global.allSprites[type];
    this.spd = global.allAnimatedObjectData[type]['speed'];
    this.ccx = global.allAnimatedObjectData[type]['collisionCenter'][0];
    this.ccy = global.allAnimatedObjectData[type]['collisionCenter'][1];
    this.markedForDeletion = false;
  }
}

export class Projectile extends AnimatedObject {
  constructor(x, y, dx, dy, type) {
    super(x, y, type);
    this.travelAngle = Math.acos(dx / norm(dx, dy));
    this.hx = global.allAnimatedObjectData[type]['projectileLength'] / 2 * dx / norm(dx, dy);
    this.hy = global.allAnimatedObjectData[type]['projectileLength'] / 2 * dy / norm(dx, dy);
    this.dx = this.spd * dx / norm(dx, dy);
    this.dy = this.spd * dy / norm(dx, dy);
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
    let hix = Math.floor((this.x + this.ccx + this.hx) / global.TILE_WIDTH);
    let hiy = Math.floor((this.y + this.ccy + this.hy) / global.TILE_HEIGHT);
    if (!global.tileData[global.tileMap[hiy][hix]]['passable']) {
      this.markedForDeletion = true;
      return;
    }
    for (let i = 0; i < global.enemies.length; i++) {
      let e = global.enemies[i];
      let hsx = this.x + this.ccx + this.hx - e.x;
      let hsy = this.y + this.ccy + this.hy - e.y;
      if (hsx >= 0 && hsx < e.spriteWidth && hsy >= 0 && hsy < e.spriteHeight){
        if (e.sprites[e.dir][Math.floor(e.stepCounter / global.FRAMES_PER_STEP)].data[4 * (hsx + hsy * e.spriteWidth) + 3] !== 0) {
          this.markedForDeletion = true;
          e.HP -= global.player.attackDamage;
          if (e.HP <= 0)
            e.markedForDeletion = true;
        }
      }
    }
  }

  draw() {
    if (!this.markedForDeletion) {
      drawSprite(this.x, this.y, global.sx, global.sy, this.sprites[this.dir][0]);
    }
  }
}

class Character extends AnimatedObject {
  constructor(x, y, type) {
    super(x, y, type);
    this.stands = global.allAnimatedObjectData[type]['sprite']['stands'];
    this.nRunFrames = global.allAnimatedObjectData[type]['sprite']['nRunFrames'];
    this.collisionMask = global.allAnimatedObjectData[type]['collisionMask'];
    this.spriteWidth = global.allAnimatedObjectData[type]['sprite']['width'];
    this.spriteHeight = global.allAnimatedObjectData[type]['sprite']['height'];
    this.stepCounter = 0;
    this.attacking = false;
    this.attackX = 0;
    this.attackY = 0;
    this.dir = 'd';
  }

  move() {  // needs to be overridden by child class
    let dir = global.DIRECTIONS[4 + this.dx / this.spd + 3 * this.dy / this.spd];
    if (dir !== '0') {
      this.dir = dir;
      this.stepCounter++;
      this.stepCounter %= this.nRunFrames * global.FRAMES_PER_STEP;
    }
  }

  draw() {
    if (this.stands && this.dx === 0 && this.dy === 0)
      drawSprite(this.x, this.y, global.sx, global.sy, this.sprites[this.dir][this.nRunFrames])
    else
      drawSprite(this.x, this.y, global.sx, global.sy, this.sprites[this.dir][Math.floor(this.stepCounter / global.FRAMES_PER_STEP)])
  }
}

export class Player extends Character {
  constructor(x, y, type) {
    super(x, y, type);
    this.attackDamage = global.allAnimatedObjectData[type]['attackDamage'];
    this.attackRange = global.allAnimatedObjectData[type]['attackRange'];
    this.attackArc = global.allAnimatedObjectData[type]['attackArcDeg'] * Math.PI / 180;
    this.rx = global.allAnimatedObjectData[type]['rangedAttackOrigin'][0];
    this.ry = global.allAnimatedObjectData[type]['rangedAttackOrigin'][1];
    this.attackTimer = 0;
    this.attackDelay = 5;
    this.attackType = 'ranged';
    this.maxHP = global.allAnimatedObjectData[type]['maxHP'];
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
    let cx = this.x - global.sx;
    if (cx < global.PADDING_SIZE && deltaX < 0) {
      global.sx += deltaX;
      if (global.sx < 0) {
        this.x -= (deltaX - global.sx);
        global.sx = 0;
      }
    }
    if (cx + this.spriteWidth + global.PADDING_SIZE > window.innerWidth && deltaX > 0) {
      global.sx += deltaX;
      if (global.sx >global. TILE_WIDTH * global.mapWidth - window.innerWidth) {
        this.x -= deltaX - (global.sx - (global.TILE_WIDTH * global.mapWidth - window.innerWidth));
        global.sx = global.TILE_WIDTH * global.mapWidth - window.innerWidth;
      }
    }
    let deltaY = this.dy;
    while (!collisionOk(this.x, this.y + deltaY, this.collisionMask) && deltaY !== 0) {
      deltaY -= Math.sign(deltaY);
    }

    this.y += deltaY;
    let cy = this.y - global.sy;
    if (cy < global.PADDING_SIZE && deltaY < 0) {
      global.sy += deltaY;
      if (global.sy < 0) {
        this.y -= (deltaY - global.sy);
        global.sy = 0;
      }
    }
    if (cy + this.spriteHeight + global.PADDING_SIZE > global.viewableHeight && deltaY > 0) {
      global.sy += deltaY;
      if (global.sy > global.TILE_HEIGHT * global.mapHeight - global.viewableHeight) {
        this.y -= deltaY - (global.sy - (global.TILE_HEIGHT * global.mapHeight - global.viewableHeight));
        global.sy = global.TILE_HEIGHT * global.mapHeight - global.viewableHeight;
      }
    }
    for (let i = 0; i < global.loadingZones.length; i++) {
      var ix = Math.floor((global.player.x + global.player.ccx) / global.TILE_WIDTH);
      var iy = Math.floor((global.player.y + global.player.ccy) / global.TILE_HEIGHT);
      if (ix === global.loadingZones[i]['ix'] && iy === global.loadingZones[i]['iy']) {
        global.x0 = global.loadingZones[i]['x0'];
        global.y0 = global.loadingZones[i]['y0'];
        global.reloadLZ = true;
        global.currentLZ = global.loadingZones[i]['destination'];
      }
    }
  }

  draw() {
    let sprite = global.ctx.createImageData(this.spriteWidth, this.spriteHeight);
    for (let i = 0; i < 4 * this.spriteWidth * this.spriteHeight; i++) {
      if (this.stands && this.dx === 0 && this.dy === 0) {
        sprite.data[i] = this.sprites[this.dir][this.nRunFrames].data[i];
      } else {
        sprite.data[i] = this.sprites[this.dir][Math.floor(this.stepCounter / global.FRAMES_PER_STEP)].data[i];
      }
      if (this.attacking) {
        if (sprite.data[4 * Math.floor(i / 4) + 3] !== 0) {
          sprite.data[4 * Math.floor(i / 4)] = 255;
        }
      }
    }
    drawSprite(this.x, this.y, global.sx, global.sy, sprite);
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
    for (let i = 0; i < global.enemies.length; i++) {
      let enemy = global.enemies[i];
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
    global.animatedObjects.push(new Projectile(this.x + this.rx, this.y + this.ry, this.attackX, this.attackY, 'playerRangedAttack'));
  }
}

export class Enemy extends Character {
  constructor(x, y, type) {
    super(x, y, type);
    this.maxHP = global.allAnimatedObjectData[type]['maxHP'];
    this.HP = this.maxHP;
    this.HPBarCenter = global.allAnimatedObjectData[type]['sprite']['HPBarCenter'];
    this.HPBarWidth = global.allAnimatedObjectData[type]['sprite']['HPBarWidth'];
  }

  move() {
    super.move();
    if (this.markedForDeletion)
      return;
    if (distance(this.x, this.y, global.player.x, global.player.y) < global.AGGRO_RANGE) {
      this.dx = Math.min(this.spd, Math.abs(global.player.x - this.x)) * Math.sign(global.player.x - this.x);
      this.dy = Math.min(this.spd, Math.abs(global.player.y - this.y)) * Math.sign(global.player.y - this.y);
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
      currentSprite = this.sprites[this.dir][Math.floor(this.stepCounter / global.FRAMES_PER_STEP)];
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
    drawSprite(this.x, this.y, global.sx, global.sy, currentSprite);
  }
}
