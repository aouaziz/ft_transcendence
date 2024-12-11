const urlParams = new URLSearchParams(window.location.search);
const roomCode = urlParams.get('room_code');
const gameStatus = document.getElementById("game-status");
let websocket;
if (roomCode) {
    websocket = new WebSocket(`ws://127.0.0.1:8000/ws/room/${roomCode}`);
    websocket.onopen = () => {
        gameStatus.textContent = `Connected to room: ${roomCode}`;
        console.log("WebSocket connection established.");
    };
    websocket.onmessage = (event) => {
        const data = JSON.parse(event.data);
        console.log("Message from server:", data);
        // Update game UI based on server messages
    };
    websocket.onclose = () => {
        gameStatus.textContent = "Disconnected from the game.";
        console.log("WebSocket connection closed.");
    };
    websocket.onerror = (error) => {
        gameStatus.textContent = "Error connecting to the game.";
        console.error("WebSocket error:", error);
    };
} else {
    gameStatus.textContent = "Invalid room code.";
}