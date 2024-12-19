// Extract roomCode and username from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room_code');
const username = urlParams.get('username');
const popupBtn = document.getElementById("popup-btn");
const popup = document.getElementById("popup");
const popupText = document.getElementById("popup-text");
const popupWin = document.getElementById("popup-win");
const startText = document.getElementById("startText");
popupBtn.addEventListener('click',openpopup)


let player1Name = null;
let player2Name = null;
let player = null;
let gameStarted = false;

const webSocketProtocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
const wsEndpoint = `${webSocketProtocol}://127.0.0.1:8000/ws/game/${roomCode}/`;
const ws = new WebSocket(wsEndpoint);

console.log("WebSocket endpoint:", wsEndpoint);

// Game elements
const paddle1 = document.getElementById("paddle1");
const paddle2 = document.getElementById("paddle2");
const player1Score = document.getElementById("player1Score");
const player2Score = document.getElementById("player2Score");
const ball = document.getElementsByClassName("ball");




function start_game() {
    const playersname = document.getElementsByClassName("username");
    const paddles = document.getElementsByClassName("paddle");
    const net = document.getElementsByClassName("net");
    const score = document.getElementsByClassName("score");

    // Hide the start text and make game elements visible
    startText.style.display = "none";
    for (const el of [...playersname, ...paddles, ...ball, ...net, ...score]) {
        el.style.opacity = "100%";
    }

    document.getElementById("player1Name").textContent = player1Name;
    document.getElementById("player2Name").textContent = player2Name;

    // Assign player role
    player = player1Name === username ? "player1" : "player2";
    console.log(`Player username: ${username} assigned role: ${player}`);

    gameStarted = true;
}

// WebSocket setup
function setupWebSocket(ws) {
    ws.onopen = function () {
        console.log("WebSocket connection opened.");
    };

    ws.onclose = function (event) { 
        console.error("Error parsing server message:",  event);
        game_message("An error occurred while connecting to the game.");
        gameStarted = false;
    };

    ws.onerror = function (event) {
        console.error("WebSocket error:", event);
        game_message("Unable to join the game: Room does not exist.");
    };

    ws.onmessage = function (event) {
    try{
        const data = JSON.parse(event.data);
        if (data.message === "start_game") {
            player1Name = data.player1;
            player2Name = data.player2;
            start_game();
        } else if (data.message === "game_update") {
            console.log(data)
            game_update(data.payload);
        } else if (data.message === "game_over") {
            player1Score.textContent = data.score1;
            player2Score.textContent = data.score2;
            if(data.winner === username)
                popupWin.textContent = "You Won"
            else
                popupWin.textContent = "You Lost"

            game_message(data.payload.message);
        }
    } catch (e) {
        console.error("Error parsing server message:", e, event.data);
    }
    };
}

// Sends the player's move to the server
function sendMove(direction) {
    if (!gameStarted) {
        return;
    }

    const message = {
        action: "move",
        direction: direction,
        player: player,
    };
    ws.send(JSON.stringify(message));
}
// Handles player controls
window.addEventListener("keydown", (event) => {
    if (player === "player1" && (event.key === "w" || event.key === "s")) {
        const direction = event.key === "w" ? "up" : "down";
        sendMove(direction);
    } else if (player === "player2" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
        const direction = event.key === "ArrowUp" ? "up" : "down";
        sendMove(direction);
    }
});

window.addEventListener("keyup", (event)=>{
    sendMove('stop');
});


// Updates the game state (positions, scores, etc.)
function game_update(data) {

    // Update paddles
    paddle1.style.top = data.paddle1_y + "px";
    paddle2.style.top = data.paddle2_y + "px";

    // Update scores
    player1Score.textContent = data.score1;
    player2Score.textContent = data.score2;

    // Update ball position
    const ballElement = ball[0];
    if (ballElement) {
        ballElement.style.left = data.ball_x + "px";
        ballElement.style.top = data.ball_y + "px";
    }
}

// Handles game over messages
function game_message(message) {
    startText.style.opacity = "0%";
    popupText.textContent = message;
    popup.classList.add("open-popup");
    gameStarted = false;
    player = null;
}
function openpopup(){
    localStorage.clear();
    window.location.href = 'index.html'
  }

setupWebSocket(ws);
