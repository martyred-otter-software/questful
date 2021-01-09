import {Enemy, Player} from './AnimatedObjects';
import {drawBG, drawHUD, BMPData2Sprite, padTilemapToFitScreen} from './Graphics';
import {computeVertices, computeEdges} from './Pathing';

import {useRef, useEffect} from 'react';

export var global = {
  TILE_WIDTH: 64,
  TILE_HEIGHT: 64,
  PADDING_SIZE: 256,
  FRAMES_PER_STEP: 3,
  delay: 25,
  DIRECTIONS: ['ul', 'u', 'ur', 'l', '0', 'r', 'dl', 'd', 'dr'],
  AGGRO_RANGE: 1000,
  ANIMATED_OBJECT_TYPES: ['player', 'orc', 'playerRangedAttack'],

  canvas: null,
  ctx: null,

  sx: 0,
  sy: 0,
  viewableHeight: 0,

  layoutData: null,
  HUDHeight: 150,
  HUDBG: null,

  tileMap: null,
  tileData: null,
  mapWidth: null,
  mapHeight: null,
  numTiles: null,
  tiles: null,
  loadingZones: null,

  vertices: null,
  edges: null,
  paths: null,

  allAnimatedObjectData: {},
  allSprites: {},

  animatedObjects: null,
  enemies: null,
  player: null,
  enemyList: null,

  currentLZ: 'data/overworld.json',
  x0: 128,
  y0: 128,
  reloadLZ: true,
  gameLoop: null,

  localData: true,
  time: null
}

export default function Main(props) {
  const {callback} = props;
  const canvas = useRef();

  useEffect(() => {
    game(canvas.current);
  }, []);

  return <>
    <canvas ref={canvas} width={window.innerWidth} height={window.innerHeight}/>
  </>
}

function game(canvas) {
  global.canvas = canvas;
  global.ctx = canvas.getContext('2d');
  global.time = new Date();
  init().then(() => {
    window.setInterval(function () {
      if (global.reloadLZ) {
        if (global.gameLoop !== undefined && global.gameLoop !== null)
          clearInterval(global.gameLoop);
        loadLZ(global.currentLZ).then(() => {
          global.gameLoop = window.setInterval(function () {
            global.canvas.width = window.innerWidth;
            global.canvas.height = window.innerHeight;
            global.viewableHeight = window.innerHeight - global.HUDHeight;

            for (let i = 0; i < global.enemies.length; i++) {
              if (global.enemies[i].markedForDeletion)
                global.enemies.splice(i--, 1);
            }
            for (let i = 0; i < global.animatedObjects.length; i++) {
              global.animatedObjects[i].move();
              if (global.animatedObjects[i].markedForDeletion)
                global.animatedObjects.splice(i--, 1);
            }
            drawBG(global.sx, global.sy);
            drawHUD(global.player);
            for (let i = 0; i < global.animatedObjects.length; i++)
              global.animatedObjects[i].draw();
            let newTime = new Date();
            global.ctx.strokeStyle = "#FFFFFF";
            global.ctx.strokeText(1000/(newTime - global.time), 10, 10);
            global.time = newTime;
          }, global.delay);
        });
        global.reloadLZ = false;
      }
    }, 50);

    window.addEventListener("keydown", function (e) {
      if (e.keyCode === 68)
        global.player.dx = global.player.spd;
      if (e.keyCode === 65)
        global.player.dx = -global.player.spd;
      if (e.keyCode === 83)
        global.player.dy = global.player.spd;
      if (e.keyCode === 87)
        global.player.dy = -global.player.spd;
    });

    window.addEventListener("keyup", function (e) {
      if (e.keyCode === 68 && global.player.dx > 0)
        global.player.dx = 0;
      if (e.keyCode === 65 && global.player.dx < 0)
        global.player.dx = 0;
      if (e.keyCode === 83 && global.player.dy > 0)
        global.player.dy = 0;
      if (e.keyCode === 87 && global.player.dy < 0)
        global.player.dy = 0;
    });

    window.addEventListener("mousedown", function (e) {
      global.player.attackX = e.offsetX - (global.player.x + global.player.ccx) + global.sx;
      global.player.attackY = e.offsetY - (global.player.y + global.player.ccy) + global.sy;
      global.player.attacking = true;
    });

    window.addEventListener("mouseup", function (e) {
      global.player.attacking = false;
    });
  });
}

async function init() {
  for (let c = 0; c < global.ANIMATED_OBJECT_TYPES.length; c++) {
    let ch = global.ANIMATED_OBJECT_TYPES[c];
    if (global.localData) {
      global.allAnimatedObjectData[ch] = require('./data/' + ch + '.json');
    } else {
      await fetch(ch + '.json')
        .then(response => response.json())
        .then((data) => {
          global.allAnimatedObjectData[ch] = data;
        });
    }
    global.allSprites[ch] = {};
    for (let id = 0; id < global.DIRECTIONS.length; id++) {
      let dir = global.DIRECTIONS[id];
      if (dir === '0')
        continue;
      let curSpriteData = global.allAnimatedObjectData[ch]['sprite'];
      global.allSprites[ch][dir] = new Array(curSpriteData['data'][dir].length);
      for (let fr = 0; fr < curSpriteData['data'][dir].length; fr++) {

        await fetch(curSpriteData['data'][dir][fr])
          .then(response => response.arrayBuffer())
          .then((data) =>
            global.allSprites[ch][dir][fr] = BMPData2Sprite(data, curSpriteData['width'], curSpriteData['height'])
          );

      }

    }
  }
}

async function loadLZ(world) {
  if (global.localData) {
    global.layoutData = require('../data/layout.json');
  } else {
    await fetch('data/layout.json')
      .then(response => response.json())
      .then((data) => global.layoutData = data);
  }
  global.HUDHeight = global.layoutData['HUD']['height'];
  global.viewableHeight = window.innerHeight - global.HUDHeight;
  if (global.localData) {
    await readFileData('./' + global.layoutData['HUD']['BGImg'])
      .then((data) =>
        global.HUDBG = BMPData2Sprite(data, window.innerWidth, global.HUDHeight)
      );
  } else {
    await fetch('./' + global.layoutData['HUD']['BGImg'])
      .then(response => response.arrayBuffer())
      .then((data) =>
        global.HUDBG = BMPData2Sprite(data, window.innerWidth, global.HUDHeight)
      );
  }
  if (global.localData) {
    let data = require('./' + world);
    global.mapWidth = data['nx'];
    global.mapHeight = data['ny'];
    global.tileData = data['tiles'];
    global.tileMap = data['map'];
    global.numTiles = data['nTiles'];
    global.enemyList = data['enemies'];
    global.loadingZones = data['loadingZones'];
  } else {
    await fetch(world)
      .then(response => response.json())
      .then((data) => {
        global.mapWidth = data['nx'];
        global.mapHeight = data['ny'];
        global.tileData = data['tiles'];
        global.tileMap = data['map'];
        global.numTiles = data['nTiles'];
        global.enemyList = data['enemies'];
        global.loadingZones = data['loadingZones'];
      });
  }

  global.animatedObjects = [];
  global.enemies = [];
  global.player = new Player(global.x0, global.y0, 'player')
  global.animatedObjects.push(global.player);
  if (global.x0 + global.player.spriteWidth > window.innerWidth)
    global.sx = Math.min(global.x0 - global.PADDING_SIZE, global.TILE_WIDTH * global.mapWidth - window.innerWidth);
  else
    global.sx = 0;
  if (global.y0 + global.player.spriteHeight > global.viewableHeight)
    global.sy = Math.min(global.y0 - global.PADDING_SIZE, global.TILE_HEIGHT * global.mapHeight - global.viewableHeight);
  else
    global.sy = 0;
  for (let i = 0; i < global.enemyList.length; i++) {
    global.animatedObjects.push(new Enemy(global.enemyList[i]['x0'], global.enemyList[i]['y0'], global.enemyList[i]['type']));
    global.enemies.push(global.animatedObjects[global.animatedObjects.length - 1]);
  }
  global.tiles = new Array(global.numTiles);
  for (let tIdx = 0; tIdx < global.numTiles; tIdx++) {
    await fetch(global.tileData[tIdx]['data'])
      .then(response => response.arrayBuffer())
      .then((data) =>
        global.tiles[tIdx] = BMPData2Sprite(data, global.TILE_WIDTH, global.TILE_HEIGHT)
      );
  }
  global.tileMap = padTilemapToFitScreen(global.tileMap);
  global.mapWidth = global.tileMap[0].length;
  global.mapHeight = global.tileMap.length;

  global.vertices = computeVertices();
  global.edges = computeEdges(global.vertices);

}

function readFileData(filename) {
  const file = new File([""], filename);

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      resolve(event.target.result);
      console.log('ok');
    };

    reader.onerror = (err) => {
      reject(err);
    };

    reader.readAsArrayBuffer(file)
  });
}