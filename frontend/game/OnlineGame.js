// Extract roomCode and username from URL parameters
import { navigateTo } from './index.js';
import { fetchUserData } from './chat.js';


let ws = null;
export async function loadOnlineGamePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const roomCode = urlParams.get('room_code');
    const popupBtn = document.getElementById("popup-btn");
    const popup = document.getElementById("popup");
    const popupText = document.getElementById("popup-text");
    const startText = document.getElementById("startText");
    popupBtn.addEventListener('click', openpopup);

    let player1Name = null;
    let player2Name = null;
    let player = null;
    let gameStarted = false;
    let username = null;
    const userData = await fetchUserData();
    if (!userData || !userData.username) {
        console.error('Failed to fetch user data');
        return;
    }
    username = userData.username;

    const wsEndpoint = `wss://localhost:8443/ws/game/${roomCode}/`;
    ws = new WebSocket(wsEndpoint);

    console.log("WebSocket endpoint:", wsEndpoint);

    // Game elements
    const paddle1 = document.getElementById("paddle1");
    const paddle2 = document.getElementById("paddle2");
    const player1Score = document.getElementById("player1Score");
    const player2Score = document.getElementById("player2Score");
    const ball = document.getElementsByClassName("ball");

    // Function to start the game
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
            console.log("WebSocket connection closed:", event.reason);
            gameStarted = false;
            ws = null;
        };

        ws.onerror = function (event) {
            console.error("WebSocket error:", event);
            game_message("Unable to join the game: Room does not exist.");
        };

        ws.onmessage = function (event) {
            try {
                const data = JSON.parse(event.data);
                if (data.error) {
                    game_message(data.message);
                    ws.close();
                }
                if (data.message === "start_game") {
                    player1Name = data.player1;
                    player2Name = data.player2;
                    start_game();
                } else if (data.message === "game_update") {
                    game_update(data.payload);
                } else if (data.message === "game_over") {
                    game_update(data.payload);
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
            console.log("direction : " + direction);
            sendMove(direction);
        } else if (player === "player2" && (event.key === "ArrowUp" || event.key === "ArrowDown")) {
            const direction = event.key === "ArrowUp" ? "up" : "down";
            console.log("direction : " + direction);
            sendMove(direction);
        }
    });

    window.addEventListener("keyup", () => {
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

    function openpopup() {
        navigateTo('/');
    }


    // Initialize WebSocket
    setupWebSocket(ws);
}

export function closeWebSocket() {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
        console.log("WebSocket closed.");
        ws = null; // Clear the reference
    }
}