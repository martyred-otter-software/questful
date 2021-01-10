var stompClient = null;

function registerWithAPI() {
  let socket = new SockJS('http://questfulengine-env.eba-pgfvzpuh.us-east-1.elasticbeanstalk.com/questful-engine');
  stompClient = Stomp.over(socket);
  stompClient.connect({}, function (frame) {
    stompClient.subscribe('/topic/positions', function (message) {
      updatePlayerList(JSON.parse(message.body));
    });
  });
}

function getId() {
  let foundValidId = false;
  let idCandidate = 1;
  while (!foundValidId) {
    foundValidId = true;
    for (let i = 0; i < allies.length; i++) {
      if (idCandidate.toString() === allies[i].id) {
        foundValidId = false;
        break;
      }
    }
    idCandidate++;
  }
  return idCandidate.toString();
}

function updatePlayerList(playerInfo) {
  console.log(playerInfo['playerId']);
  for (let pIdx = 0; pIdx < allies.length; pIdx++) {
    if (playerInfo['playerId'] === allies[pIdx].id) {
      allies[pIdx].x = playerInfo['x'];
      allies[pIdx].y = playerInfo['y'];
    }
  }
  if (playerInfo['playerId'] !== myId) {
    allies.push(new Ally(playerInfo['x'], playerInfo['y'], 'player', playerInfo['playerId']));
    animatedObjects.push(allies[allies.length - 1]);
  }
}

function sendPlayerInfo(playerObject) {
  stompClient.send(JSON.stringify({
    'playerId': myId,
    'x': playerObject.x,
    'y': playerObject.y
  }));
}
