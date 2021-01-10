const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;
const PADDING_SIZE = 256;
const FRAMES_PER_STEP = 3;
const delay = 25; // ms delay
const DIRECTIONS = ['ul', 'u', 'ur', 'l', '0', 'r', 'dl', 'd', 'dr'];
const AGGRO_RANGE = 1000;
const ANIMATED_OBJECT_TYPES = ['player', 'orc', 'man1', 'playerRangedAttack'];

let c = document.getElementById("myCanvas");
let ctx = c.getContext("2d");

var sx;
var sy;
ctx.canvas.width = window.innerWidth;
ctx.canvas.height = window.innerHeight;
var viewableHeight = window.innerHeight

var layoutData;
var HUDHeight;
var HUDBG;

var tileMap;
var tileData;
var mapWidth;
var mapHeight;
var numTiles;
var tiles;
var loadingZones;

var vertices = [];
var edges = [];
var paths = [];
var myId = "";

var allAnimatedObjectData = {};
var allSprites = {};

var animatedObjects;
var enemies;
var player;
var allies = [];
var enemyList;
var npcList;

var currentLZ = 'data/overworld.json';
var x0 = 128;
var y0 = 128;
var reloadLZ = true;
var gameLoop;

init().then(() => {
  window.setInterval(function () {
    if (reloadLZ) {
      if (gameLoop !== undefined)
        clearInterval(gameLoop);
      loadLZ(currentLZ).then(() => {
        gameLoop = window.setInterval(function () {
          ctx.canvas.width = window.innerWidth;
          ctx.canvas.height = window.innerHeight;
          viewableHeight = window.innerHeight - HUDHeight;

          for (let i = 0; i < enemies.length; i++) {
            if (enemies[i].markedForDeletion)
              enemies.splice(i--,1);
          }
          for (let i = 0; i < animatedObjects.length; i++) {
            animatedObjects[i].move();
            if (animatedObjects[i].markedForDeletion)
              animatedObjects.splice(i--,1);
          }
          drawBG(sx, sy);
          drawHUD(player);
          for (let i = 0; i < animatedObjects.length; i++)
            animatedObjects[i].draw();
          ctx.strokeStyle = "#ffffff";
          ctx.strokeText(animatedObjects.length, 10, 10);
        }, delay);
      });
      reloadLZ = false;
    }
  }, 50);

  window.addEventListener("keydown", function (e) {
    if (e.keyCode === 68)
      player.dx = player.spd;
    if (e.keyCode === 65)
      player.dx = -player.spd;
    if (e.keyCode === 83)
      player.dy = player.spd;
    if (e.keyCode === 87)
      player.dy = -player.spd;
  });

  window.addEventListener("keyup", function (e) {
    if (e.keyCode === 68 && player.dx > 0)
      player.dx = 0;
    if (e.keyCode === 65 && player.dx < 0)
      player.dx = 0;
    if (e.keyCode === 83 && player.dy > 0)
      player.dy = 0;
    if (e.keyCode === 87 && player.dy < 0)
      player.dy = 0;
  });

  window.addEventListener("mousedown", function (e) {
    player.attackX = e.offsetX - (player.x + player.ccx) + sx;
    player.attackY = e.offsetY - (player.y + player.ccy) + sy;
    player.attacking = true;
  });

  window.addEventListener("mouseup", function (e) {
    player.attacking = false;
  });
});

async function init() {
  registerWithAPI();
  myId = getId();
  for (let c = 0; c < ANIMATED_OBJECT_TYPES.length; c++) {
    let ch = ANIMATED_OBJECT_TYPES[c];

    await fetch('data/' + ch + '.json')
      .then(response => response.json())
      .then((data) => {
        allAnimatedObjectData[ch] = data;
      });

    allSprites[ch] = {};
    for (let id = 0; id < DIRECTIONS.length; id++) {
      let dir = DIRECTIONS[id];
      if (dir === '0')
        continue;
      let curSpriteData = allAnimatedObjectData[ch]['sprite'];
      allSprites[ch][dir] = new Array(curSpriteData['data'][dir].length);
      for (let fr = 0; fr < curSpriteData['data'][dir].length; fr++) {

        await fetch(curSpriteData['data'][dir][fr])
          .then(response => response.arrayBuffer())
          .then((data) =>
            allSprites[ch][dir][fr] = BMPData2Sprite(data, curSpriteData['width'], curSpriteData['height'])
          );

      }

    }
  }
}

async function loadLZ(world) {
  await fetch('data/layout.json')
    .then(response => response.json())
    .then((data) => layoutData = data);
  HUDHeight = layoutData['HUD']['height'];
  await fetch(layoutData['HUD']['BGImg'])
    .then(response => response.arrayBuffer())
    .then((data) =>
      HUDBG = BMPData2Sprite(data, window.innerWidth, HUDHeight)
    );

  await fetch(world)
    .then(response => response.json())
    .then((data) => {
      mapWidth = data['nx'];
      mapHeight = data['ny'];
      tileData = data['tiles'];
      tileMap = data['map'];
      numTiles = data['nTiles'];
      enemyList = data['enemies'];
      npcList = data['npcs'];
      loadingZones = data['loadingZones'];
    });

  animatedObjects = [];
  enemies = [];
  player = new Player(x0, y0, 'player')
  animatedObjects.push(player);
  if (x0 + player.spriteWidth > window.innerWidth)
    sx = Math.min(x0 - PADDING_SIZE, TILE_WIDTH * mapWidth - window.innerWidth);
  else
    sx = 0;
  if (y0 + player.spriteHeight > viewableHeight)
    sy = Math.min(y0 - PADDING_SIZE, TILE_HEIGHT * mapHeight - viewableHeight);
  else
    sy = 0;

  for (let i = 0; i < enemyList.length; i++) {
    animatedObjects.push(new Enemy(enemyList[i]['x0'], enemyList[i]['y0'], enemyList[i]['type']));
    enemies.push(animatedObjects[animatedObjects.length - 1]);
  }
  for (let i = 0; i < npcList.length; i++)
    animatedObjects.push(new NPC(npcList[i]['x0'], npcList[i]['y0'], npcList[i]['type']));
  tiles = new Array(numTiles);
  for (let tIdx = 0; tIdx < numTiles; tIdx++) {
    await fetch(tileData[tIdx]['data'])
      .then(response => response.arrayBuffer())
      .then((data) =>
        tiles[tIdx] = BMPData2Sprite(data, TILE_WIDTH, TILE_HEIGHT)
      );
  }
  tileMap = padTilemapToFitScreen(tileMap);
  mapWidth = tileMap[0].length;
  mapHeight = tileMap.length;

  vertices = computeVertices();
  edges = computeEdges(vertices);

}

