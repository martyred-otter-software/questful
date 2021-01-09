import { global } from './main.js';

export function padTilemapToFitScreen(map) {
  let result = [];
  let hPadding;
  let vPadding;
  for (let j = 0; j < Math.max(Math.ceil(global.viewableHeight / global.TILE_HEIGHT), map.length); j++) {
    result.push([]);
    hPadding = Math.max(Math.floor((window.innerWidth / global.TILE_WIDTH - map[0].length) / 2), 0);
    for (let i = 0; i < Math.max(Math.ceil(window.innerWidth / global.TILE_WIDTH), map[0].length); i++) {
      vPadding = Math.max(Math.floor((global.viewableHeight / global.TILE_HEIGHT - map.length) / 2), 0);
      if (i >= hPadding && j >= vPadding && i - hPadding < map[0].length && j - vPadding < map.length)
        result[j].push(map[j - vPadding][i - hPadding]);
      else
        result[j].push(0);
    }
  }
  for (let c = 0; c < global.animatedObjects.length; c++) {
    global.animatedObjects[c].x += hPadding * global.TILE_WIDTH;
    global.animatedObjects[c].y += vPadding * global.TILE_HEIGHT;
  }
  for (let l = 0; l < global.loadingZones.length; l++) {
    global.loadingZones[l]['ix'] += hPadding;
    global.loadingZones[l]['iy'] += vPadding;
  }

  return result;
}


export function BMPData2Sprite(data, spriteWidth, spriteHeight) {
  let result = global.ctx.createImageData(spriteWidth, spriteHeight);
  let offset = (new Uint32Array(data.slice(10, 14)))[0];
  let tempBytes = new Uint8ClampedArray(data.slice(offset));
  for (let i = 0; i < spriteWidth * spriteHeight; i++) {
    let u = i % spriteWidth;
    let v = Math.floor(i / spriteWidth) + 1;
    let bmpIdx = 3 * (spriteWidth * (spriteHeight - v) + u);
    result.data[4 * i] = tempBytes[bmpIdx + 2];
    result.data[4 * i + 1] = tempBytes[bmpIdx + 1];
    result.data[4 * i + 2] = tempBytes[bmpIdx];
    if (tempBytes[bmpIdx] === 255 && tempBytes[bmpIdx + 1] === 255 && tempBytes[bmpIdx + 2])
      result.data[4 * i + 3] = 0;                   //A
    else
      result.data[4 * i + 3] = 255;                 //A
  }
  return result;
}

export function drawBG(sx, sy) {
  let xOffset = sx % global.TILE_WIDTH;
  let yOffset = sy % global.TILE_HEIGHT;
  let ix = Math.floor(sx / global.TILE_WIDTH);
  let iy = Math.floor(sy / global.TILE_HEIGHT);
  for (let i = 0; global.TILE_WIDTH * i - xOffset < window.innerWidth && i < global.tileMap[0].length; i++) {
    for (let j = 0; global.TILE_HEIGHT * j - yOffset < global.viewableHeight && j < global.tileMap.length; j++) {
      global.ctx.putImageData(global.tiles[global.tileMap[iy + j][ix + i]], global.TILE_WIDTH * i - xOffset, global.TILE_HEIGHT * j - yOffset);
    }
  }
}

export function drawHUD(player) {
  global.ctx.putImageData(global.HUDBG, 0, global.viewableHeight);
  let barData = global.layoutData['HUD']['HPBar'];
  global.ctx.fillStyle = barData['fullColor'];
  global.ctx.fillRect(barData['x'], global.viewableHeight + barData['y'], Math.floor(player.HP / player.maxHP * barData['w']), barData['h']);
  global.ctx.fillStyle = barData['emptyColor'];
  global.ctx.fillRect(barData['x'] + Math.floor(player.HP / player.maxHP * barData['w']), global.viewableHeight + barData['y'],
    barData['w'] - Math.floor(player.HP / player.maxHP * barData['w']), barData['h']);
  global.ctx.strokeStyle = barData['borderColor'];
  global.ctx.beginPath();
  global.ctx.rect(barData['x'], global.viewableHeight + barData['y'], barData['w'], barData['h']);
  global.ctx.stroke();
}

export function drawSprite(x, y, sx, sy, sprite) {
  let cx = x - sx;
  let cy = y - sy;
  let spriteTemp = global.ctx.createImageData(sprite.width, sprite.height);
  let BG = global.ctx.getImageData(cx, cy, sprite.width, sprite.height);
  for (let u = 0; u < sprite.width; u++) {
    for (let v = 0; v < sprite.height; v++) {
      if (sprite.data[4 * (v * sprite.width + u) + 3] === 0) {
        spriteTemp.data[4 * (v * sprite.width + u)] = BG.data[4 * (v * sprite.width + u)];
        spriteTemp.data[4 * (v * sprite.width + u) + 1] = BG.data[4 * (v * sprite.width + u) + 1];
        spriteTemp.data[4 * (v * sprite.width + u) + 2] = BG.data[4 * (v * sprite.width + u) + 2];
      } else {
        spriteTemp.data[4 * (v * sprite.width + u)] = sprite.data[4 * (v * sprite.width + u)];
        spriteTemp.data[4 * (v * sprite.width + u) + 1] = sprite.data[4 * (v * sprite.width + u) + 1];
        spriteTemp.data[4 * (v * sprite.width + u) + 2] = sprite.data[4 * (v * sprite.width + u) + 2];
      }
      spriteTemp.data[4 * (v * sprite.width + u) + 3] = 255;
    }
  }
  if (cx > -sprite.width && cx < window.innerWidth && cy > -sprite.height && cy < global.viewableHeight) {
    global.ctx.putImageData(spriteTemp, cx, cy);
  }
}
