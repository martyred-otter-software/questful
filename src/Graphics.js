function padTilemapToFitScreen(map) {
  let result = [];
  let hPadding;
  let vPadding;
  for (let j = 0; j < Math.max(Math.ceil(viewableHeight / TILE_HEIGHT), map.length); j++) {
    result.push([]);
    hPadding = Math.max(Math.floor((window.innerWidth / TILE_WIDTH - map[0].length) / 2), 0);
    for (let i = 0; i < Math.max(Math.ceil(window.innerWidth / TILE_WIDTH), map[0].length); i++) {
      vPadding = Math.max(Math.floor((viewableHeight / TILE_HEIGHT - map.length) / 2), 0);
      if (i >= hPadding && j >= vPadding && i - hPadding < map[0].length && j - vPadding < map.length)
        result[j].push(map[j - vPadding][i - hPadding]);
      else
        result[j].push(0);
    }
  }
  for (let c = 0; c < animatedObjects.length; c++) {
    animatedObjects[c].x += hPadding * TILE_WIDTH;
    animatedObjects[c].y += vPadding * TILE_HEIGHT;
  }
  for (let l = 0; l < loadingZones.length; l++) {
    loadingZones[l]['ix'] += hPadding;
    loadingZones[l]['iy'] += vPadding;
  }

  return result;
}


function BMPData2Sprite(data, spriteWidth, spriteHeight) {
  let result = ctx.createImageData(spriteWidth, spriteHeight);
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

function drawBG(sx, sy) {
  let xOffset = sx % TILE_WIDTH;
  let yOffset = sy % TILE_HEIGHT;
  let ix = Math.floor(sx / TILE_WIDTH);
  let iy = Math.floor(sy / TILE_HEIGHT);
  for (let i = 0; TILE_WIDTH * i - xOffset < window.innerWidth && i < tileMap[0].length; i++) {
    for (let j = 0; TILE_HEIGHT * j - yOffset < viewableHeight && j < tileMap.length; j++) {
      ctx.putImageData(tiles[tileMap[iy + j][ix + i]], TILE_WIDTH * i - xOffset, TILE_HEIGHT * j - yOffset);
    }
  }
}

function drawHUD(player) {
  ctx.fillStyle = '#111111';
  ctx.fillRect(0, viewableHeight, window.innerWidth, window.innerHeight);
  let barData = layoutData['HUD']['HPBar'];
  ctx.fillStyle = barData['fullColor'];
  ctx.fillRect(barData['x'], viewableHeight + barData['y'], Math.floor(player.HP / player.maxHP * barData['w']), barData['h']);
  ctx.fillStyle = barData['emptyColor'];
  ctx.fillRect(barData['x'] + Math.floor(player.HP / player.maxHP * barData['w']), viewableHeight + barData['y'],
    barData['w'] - Math.floor(player.HP / player.maxHP * barData['w']), barData['h']);
  ctx.strokeStyle = barData['borderColor'];
  ctx.beginPath();
  ctx.rect(barData['x'], viewableHeight + barData['y'], barData['w'], barData['h']);
  ctx.stroke();
}

function drawSprite(x, y, sx, sy, sprite) {
  let cx = x - sx;
  let cy = y - sy;
  let spriteTemp = ctx.createImageData(sprite.width, sprite.height);
  let BG = ctx.getImageData(cx, cy, sprite.width, sprite.height);
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
  if (cx > -sprite.width && cx < window.innerWidth && cy > -sprite.height && cy < viewableHeight) {
    ctx.putImageData(spriteTemp, cx, cy);
  }
}
