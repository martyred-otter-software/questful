const TILE_WIDTH = 64;
const TILE_HEIGHT = 64;
const PADDING_SIZE = 256;
const FRAMES_PER_STEP = 3;
const delay = 25; // ms delay
const DIRECTIONS = ['ul', 'u', 'ur', 'l', '0', 'r', 'dl', 'd', 'dr'];
const AGGRO_RANGE = Infinity;
const ANIMATED_OBJECT_TYPES = ['player', 'orc', 'man1', 'playerRangedAttack'];
const DEBUG = true;

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

var baseGraph = [];
var myId = "";

var allAnimatedObjectData = {};
var allSprites = {};

var animatedObjects;
var enemies;
var player;
var allies = {};
var enemyList;
var npcList;

var currentLZ = 'data/overworld.json';
var x0 = 128;
var y0 = 128;
var reloadLZ = true;
var gameLoop;
var currentPath;
var currentPaths2 = [];

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
          sendPlayerInfo(player);
          drawBG(sx, sy);
          for (let i = 0; i < animatedObjects.length; i++)
            animatedObjects[i].draw();
          if (DEBUG) {
            ctx.fillStyle = "#ff0000";
            for (let i = 0; i < baseGraph.vertices.length; i++) {
              ctx.fillRect(baseGraph.vertices[i].x - sx, baseGraph.vertices[i].y - sy, 4, 4);
            }
            if (enemies[0])
              ctx.fillRect(enemies[0].x + enemies[0].ccx - sx, enemies[0].y + enemies[0].ccy - sy, 5, 5);
            ctx.strokeStyle = "#ffffff";
            for (let i = 0; i < baseGraph.edges.length; i++) {
              ctx.beginPath();
              ctx.moveTo(baseGraph.edges[i].v1.x - sx, baseGraph.edges[i].v1.y - sy);
              ctx.lineTo(baseGraph.edges[i].v2.x - sx, baseGraph.edges[i].v2.y - sy);
              ctx.stroke();
            }
            if (currentPath) {
              ctx.strokeStyle = "#ffff00";
              ctx.beginPath();
              ctx.moveTo(currentPath.v1.x - sx, currentPath.v1.y - sy);
              ctx.lineTo(currentPath.v2.x - sx, currentPath.v2.y - sy);
              ctx.stroke();
            }
            for (let i = 0; i < currentPaths2.length; i++) {
              let currentPath2 = currentPaths2[i];
              ctx.strokeStyle = "#00ffff";
              ctx.beginPath();
              ctx.moveTo(currentPath2.v1.x - sx, currentPath2.v1.y - sy);
              ctx.lineTo(currentPath2.v2.x - sx, currentPath2.v2.y - sy);
              ctx.stroke();
            }
            ctx.strokeText(animatedObjects.length, 10, 10);
          }
          drawHUD(player);
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
    player.setAttacking(e.offsetX, e.offsetY);
  });

  window.addEventListener("mousemove", (e) => {
    if (player.attacking) {
      player.setAttacking(e.offsetX, e.offsetY);
    }
  });

  window.addEventListener("mouseup", function (e) {
    player.attacking = false;
  });
});

async function init() {
  ctx.fillStyle = "#00ff00";
  ctx.font = "30px Arial";
  if (DEBUG) {
    ctx.fillText("Loading... Debug/Demo Lines Enabled", 10, 50);
  } else {
    ctx.fillText("Loading...", 10, 50); 
  }
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
  ctx.fillStyle = "#00ff00";
  ctx.font = "30px Arial";
  ctx.fillText("Loading...", 10, 50); 
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
  allies = {};
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

  let vertices = computeVertices();
  let edges = computeEdges(vertices);
  baseGraph = new Graph(edges, vertices);
}

