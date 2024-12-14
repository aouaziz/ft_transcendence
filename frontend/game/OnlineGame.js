// Extract roomCode and username from URL parameters
const urlParams = new URLSearchParams(window.location.search);
let player_identity ;
const roomCode = urlParams.get('room_code');
const webSocketProtocol = window.location.protocol === 'https' ? 'wss' : 'ws'
const wsEndpoint = `${webSocketProtocol}://127.0.0.1:8000/ws/game/${roomCode}/`
const ws = new WebSocket(wsEndpoint);
console.log(wsEndpoint);

//game 
let paddle1 = document.getElementById("paddle1");
let paddle2 = document.getElementById("paddle2");
let player1Score = document.getElementById("player1Score");
let player2Score = document.getElementById("player2Score");
const ball = document.getElementsByClassName('ball')




function gameon(player1Name,player2Name){
    let gameText = document.getElementById("startText");
    const playersname = document.getElementsByClassName('username')
    const paddles = document.getElementsByClassName('paddle')
    const net = document.getElementsByClassName('net')
    const score = document.getElementsByClassName('score')
    gameText.style.display = "none";
    for (let i = 0; i < playersname.length; i++) {
        playersname[i].style.opacity = "100%";
    }
    for (let i = 0; i < paddles.length; i++) {
        paddles[i].style.opacity = "100%";
    }
    for (let i = 0; i < ball.length; i++) {
        ball[i].style.opacity = "100%";
    }
    for (let i = 0; i < net.length; i++) {
        net[i].style.opacity = "100%";
    }
    for (let i = 0; i < score.length; i++) {
        score[i].style.opacity = "100%";
    }
    document.getElementById("player1Name").textContent = player1Name 
    document.getElementById("player2Name").textContent = player2Name 
  }

setupWebSocket(ws) 
function setupWebSocket(ws) {
  ws.onopen = function () {
    console.log("WebSocket connection is open");
    ws.send("Hello, server!");  // Send a test message to the server
  };


  ws.onclose = function () {
    console.log("WebSocket connection is closed");
    // window.location.href = "index.html"
  };

  ws.onerror = function (event) {
    console.error("WebSocket error:", event);
    // window.location.href = "index.html"
  };

  ws.onmessage = function (event) {
    try{
      const data = JSON.parse(event.data)
      console.log("Received message from server:", event.data);
      if(data.message === "start_game"){
        start_game(data)
      }
      else if(data.message === "game_update"){
        game_update(data)
      }
    }
    catch (e){
      console.error("Error parsing server message:", e, event.data);
    }
  };
}

function start_game(data){
  if(urlParams.get('username') === data.players.player1 )
    player_identity = 'player1'
  else
    player_identity = 'player2'
  gameon(data.players.player1,data.players.player2);

}


function sendMove(direction) {
  const message = JSON.stringify({
      action: "Move",
      direction: direction, // "up", "down", "w", or "s"
  });
  ws.send(message);
}

window.addEventListener("keydown", (event) => {
  if (player_identity === 'player1' && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
    const direction = event.key === "ArrowUp" ? "up" : "down";
    console.log('player 1 move: ' + event.key);
    sendMove(direction);
  } else if (player_identity === 'player2' && (event.key === "w" || event.key === "s")) {
    const direction = event.key === "w" ? "up" : "down";
    console.log('player 2 move: ' + event.key);
    sendMove(direction);
  }
});


function game_update(data){
    paddle1.style.top = data.paddle1 + 'px';
    paddle2.style.top = data.paddle2 + 'px' ;
    player1Score.textContent= data.player1Score;
    player2Score.textContent= data.player1Score;
    ball.style.left = data.ballX + "px";
    ball.style.top = data.ballY + "px";
}