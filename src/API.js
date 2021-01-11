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
      if (idCandidate.toString() === allies[i].id) {s
        foundValidId = false;
        break;
      }
    }
    idCandidate++;
  }
  //return idCandidate.toString();
  return Date.now().toString();
}

function updatePlayerList(playerInfo) {
  console.log(playerInfo['playerId']);
  if (playerInfo['playerId'] === myId)
    return;
  if (allies[playerInfo['playerId']]) {
    allies[playerInfo['playerId']].x = playerInfo['x'];
    allies[playerInfo['playerId']].y = playerInfo['y'];
  } else if (animatedObjects) {
    allies[playerInfo['playerId']] = new Ally(playerInfo['x'], playerInfo['y'], 'player');
    animatedObjects.push(allies[playerInfo['playerId']]);
  }
}

function sendPlayerInfo(playerObject) {
  stompClient.send("/app/position", {}, JSON.stringify({
    'playerId': myId,
    'x': playerObject.x,
    'y': playerObject.y
  }));
}
