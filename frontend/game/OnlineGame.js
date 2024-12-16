// Extract roomCode and username from URL parameters
const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room_code');
const username = urlParams.get('username');

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
    const gameText = document.getElementById("startText");
    const playersname = document.getElementsByClassName("username");
    const paddles = document.getElementsByClassName("paddle");
    const net = document.getElementsByClassName("net");
    const score = document.getElementsByClassName("score");

    // Hide the start text and make game elements visible
    gameText.style.display = "none";
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

    ws.onclose = function () {
        console.log("WebSocket connection closed.");
        gameStarted = false;
        // window.location.href = "index.html"; // Optional: Redirect on disconnect
    };

    ws.onerror = function (event) {
        console.error("WebSocket error:", event);
        // window.location.href = "index.html"; // Optional: Redirect on error
    };

    ws.onmessage = function (event) {
        try {
            const data = JSON.parse(event.data);

            if (data.message === "start_game") {
                player1Name = data.player1;
                player2Name = data.player2;
                start_game();
            } else if (data.message === "game_update") {
                game_update(data.payload);
            } else if (data.message === "game_over") {
                game_over(data.payload);
            } else if (data.error) {
                console.error("Error from server:", data.error);
            }
        } catch (e) {
            console.error("Error parsing server message:", e, event.data);
        }
    };
}

// Sends the player's move to the server
function sendMove(direction) {
    if (!gameStarted) {
        console.log("Game not started. Ignoring move.");
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
function game_over(data) {
    // Update game text and reset visibility of player names
    const gameText = document.getElementById("startText");
    const playersname = document.getElementsByClassName("username");

    gameText.textContent = data.message;
    gameText.style.display = "block";
    for (const el of playersname) {
        el.style.opacity = "0%";
    }

    gameStarted = false;
    player = null;
}

// Initialize WebSocket
setupWebSocket(ws);


// // Extract roomCode and username from URL parameters
// const urlParams = new URLSearchParams(window.location.search);
// let player_identity = null;
// const roomCode = urlParams.get('room_code');
// const webSocketProtocol = window.location.protocol === 'https' ? 'wss' : 'ws'
// const wsEndpoint = `${webSocketProtocol}://127.0.0.2:8000/ws/game/${roomCode}/`
// const ws = new WebSocket(wsEndpoint);
// console.log(wsEndpoint);

// //game 
// let paddle1 = document.getElementById("paddle1");
// let paddle2 = document.getElementById("paddle2");
// let player1Score = document.getElementById("player1Score");
// let player2Score = document.getElementById("player2Score");
// const ball = document.getElementsByClassName('ball')




// function gameon(player1Name,player2Name){
//     let gameText = document.getElementById("startText");
//     const playersname = document.getElementsByClassName('username')
//     const paddles = document.getElementsByClassName('paddle')
//     const net = document.getElementsByClassName('net')
//     const score = document.getElementsByClassName('score')
//     gameText.style.display = "none";
//     for (let i = 0; i < playersname.length; i++) {
//         playersname[i].style.opacity = "100%";
//     }
//     for (let i = 0; i < paddles.length; i++) {
//         paddles[i].style.opacity = "100%";
//     }
//     for (let i = 0; i < ball.length; i++) {
//         ball[i].style.opacity = "100%";
//     }
//     for (let i = 0; i < net.length; i++) {
//         net[i].style.opacity = "100%";
//     }
//     for (let i = 0; i < score.length; i++) {
//         score[i].style.opacity = "100%";
//     }
//     document.getElementById("player1Name").textContent = player1Name 
//     document.getElementById("player2Name").textContent = player2Name 
//   }

// setupWebSocket(ws) 
// function setupWebSocket(ws) {
//   ws.onopen = function () {
//     console.log("WebSocket connection is open");
//     ws.send("Hello, server!");  // Send a test message to the server
//   };


//   ws.onclose = function () {
//     console.log("WebSocket connection is closed");
//     // window.location.href = "index.html"
//   };

//   ws.onerror = function (event) {
//     console.error("WebSocket error:", event);
//     // window.location.href = "index.html"
//   };

//   ws.onmessage = function (event) {
//     try{
//       const data = JSON.parse(event.data)
//       if(data.message === "start_game"){
//         start_game(data)
//         console.log("Received start_game message from server:", event.data);
//       }
//       else if(data.message === "game_update"){
//         game_update(data)
//       }
//     }
//     catch (e){
//       console.error("Error parsing server message:", e, event.data);
//     }
//   };
// }

// function start_game(data){
//   if(urlParams.get('username') === data.players.player1 )
//     player_identity = 'player1'
//   else
//     player_identity = 'player2'
//   gameon(data.players.player1,data.players.player2);

// }


// function sendMove(direction) {
//   const message = JSON.stringify({
//       action: "Move",
//       direction: direction, // "up", "down", "w", or "s"
//   });
//   ws.send(message);
// }

// window.addEventListener("keydown", (event) => {
//   if (player_identity === 'player2' && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
//     const direction = event.key === "ArrowUp" ? "ArrowUp" : "ArrowDown";
//     console.log('player 1 move: ' + event.key);
//     sendMove(direction);
//   } else if (player_identity === 'player1' && (event.key === "w" || event.key === "s")) {
//     const direction = event.key === "w" ? "w" : "s";
//     console.log('player 1 move: ' + event.key);
//     sendMove(direction);
//   }
// });
// function game_update(data) {
//   // Update the paddles' positions
  
//   paddle1.style.top = data.paddle1 + 'px';
//   paddle2.style.top = data.paddle2 + 'px';

//   // Update the players' scores
//   player1Score.textContent = data.player1Score;
//   player2Score.textContent = data.player2Score;

//   // Update the ball's position
//   const ballElement = ball[0];  
//   if (ballElement) {
//       ballElement.style.left = data.ballX + "px";
//       ballElement.style.top = data.ballY + "px";
//   }
// }