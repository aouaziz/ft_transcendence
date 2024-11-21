const player1Name = localStorage.getItem("player1Name")
const player2Name = localStorage.getItem("player2Name")

const player3Name = localStorage.getItem("player3Name")
let TournamentGame = localStorage.getItem("TournamentGame")
TournamentGame = parseInt(TournamentGame);

const player1Place = document.getElementById("player1");
const player2Place = document.getElementById("player2");
const player3Place = document.getElementById("player3");
const winner1 = document.getElementById("winner1");
const champion = document.getElementById("champion")

document.getElementById("player1Name").textContent = player1Name 
document.getElementById("player2Name").textContent = player2Name 

player1Place.textContent = player1Name
player2Place.textContent = player2Name
player3Place.textContent = player3Name

// Game events

const popupBtn = document.getElementById("popup-btn");
const popup = document.getElementById("popup");
const popupWin = document.getElementById("popupWin");
popupBtn.addEventListener('click',openpopup)
document.addEventListener("keydown", startGame);
document.addEventListener("keydown", handleKeyDown);
document.addEventListener("keyup", handleKeyUp);

// Game variables
let popupText = document.getElementById("popup-text");
let gameText = document.getElementById("startText");
let paddle1 = document.getElementById("paddle1");
let paddle2 = document.getElementById("paddle2");
let player1 = document.getElementById("player1Score");
let player2 = document.getElementById("player2Score");

const accelerationSpeed = 1;
const maxBallSpeed = 10; 
const maxSpeed = 5;
const gameHeight = 600;
const gameWidth = 1100;
const ball = document.getElementById("ball");


let keysPressed = {};
let gameRunning = false;
let paddle1Speed = 0;
let paddle2Speed = 0;
let paddle1Y = 261; //
let paddle2Y = 261;
let ballX = 544.5;
let ballSpeedX = 4;
let ballY = 290.5;
let ballSpeedY = 4;
let playr1Score = 0;
let playr2Score = 0;
console.log(TournamentGame);

if(!TournamentGame){
  popupBtn.textContent = "Start"
  popupText.textContent ="First Match { " + player1Name + " VS " + player2Name + " }"
  popupWin.textContent=""
  popup.classList.add("open-popup");
}

function openpopup(){
    if(TournamentGame <= 1)
    {
        TournamentGame++;
        localStorage.setItem("TournamentGame",TournamentGame)
        window.location.href = 'TournamentGame.html'
        return ;
    }
    localStorage.clear();
    window.location.href = 'index.html'
}
// Start Game

function startGame() {
  gameRunning = true;
  gameText.style.display = "none";
  gameLoop();
  document.removeEventListener("keydown", startGame);
}
function tournamentPopup(number){

  if(number === 1){

    if (TournamentGame === 1) { 
      popupWin.textContent=player1Name + " Won"
      popupText.textContent = "Final Match { " + player1Name + " VS " + player3Name + " }"
      localStorage.setItem("player1Name",player3Name)
      localStorage.setItem("player2Name",player1Name)
      localStorage.setItem("player3Name",player2Name)
      localStorage.setItem("round1winner",player1Name)
      localStorage.setItem("round1loser",player2Name)
      winner1.textContent = player1Name
      popupBtn.textContent = "Next Match"
      }
    else{
       popupWin.textContent=player1Name + " Won"
      player1Place.textContent = localStorage.getItem("round1winner")
      player2Place.textContent = localStorage.getItem("round1loser")
      player3Place.textContent = player1Name
      winner1.textContent = localStorage.getItem("round1winner")
      champion.textContent = player1Name
        popupText.textContent = "Congratulations " + player1Name + ", you won the Tournament!";
      }
  }
       
  if(number === 2){

      if (TournamentGame === 1) {
        popupWin.textContent=player2Name + " Won"
        popupText.textContent = "Final Match { " + player2Name + " VS " + player3Name + " }"
        localStorage.setItem("player1Name",player3Name)
        localStorage.setItem("player2Name",player2Name)
        localStorage.setItem("player3Name",player1Name)
        localStorage.setItem("round1winner",player2Name)
        localStorage.setItem("round1loser",player1Name)
        winner1.textContent = player2Name
        popupBtn.textContent = "Final Match"
      }
      else{ 
        popupWin.textContent= player2Name + " Won"
        player1Place.textContent = localStorage.getItem("round1winner")
        player2Place.textContent = localStorage.getItem("round1loser")
        player3Place.textContent = player1Name
        winner1.textContent = localStorage.getItem("round1winner")
        champion.textContent = player2Name
        popupText.textContent = "Congratulations " + player2Name + ", you won the Tournament!";
      }
    }
    popup.classList.add("open-popup");
    gameRunning = false; // Stop the game loop

}
function gameLoop() {
    if (playr1Score === 1) 
      tournamentPopup(1);
    if (playr2Score === 1) 
      tournamentPopup(2);
    if(gameRunning){
        updatePaddle1();
        updatePaddle2();
        updateBall();
        setTimeout(gameLoop, 8);
    }
}

function handleKeyDown(e) {
  keysPressed[e.key] = true;
}

function handleKeyUp(e) {
  keysPressed[e.key] = false;
}

function updatePaddle1() {
  if (keysPressed["w"]) {
    paddle1Speed = Math.max(paddle1Speed - accelerationSpeed, -maxSpeed);
  } else if (keysPressed["s"]) {
    paddle1Speed = Math.min(paddle1Speed + accelerationSpeed, maxSpeed);
  } else {
    if (paddle1Speed > 0) {
      paddle1Speed = Math.max(paddle1Speed - accelerationSpeed, 0);
    }
    if (paddle1Speed < 0) {
      paddle1Speed = Math.min(paddle1Speed + accelerationSpeed, 0);
    }
  }

  paddle1Y += paddle1Speed;

  if (paddle1Y < 0) paddle1Y = 0;
  else if (paddle1Y > gameHeight - paddle1.clientHeight)
    paddle1Y = gameHeight - paddle1.clientHeight;

  paddle1.style.top = paddle1Y + "px";
}
function updatePaddle2() {
  if (keysPressed["ArrowUp"]) {
    paddle2Speed = Math.max(paddle2Speed - accelerationSpeed, -maxSpeed);
  } else if (keysPressed["ArrowDown"]) {
    paddle2Speed = Math.min(paddle2Speed + accelerationSpeed, maxSpeed);
  } else {
    if (paddle2Speed > 0) {
      paddle2Speed = Math.max(paddle2Speed - accelerationSpeed, 0);
    }
    if (paddle2Speed < 0) {
      paddle2Speed = Math.min(paddle2Speed + accelerationSpeed, 0);
    }
  }

  paddle2Y += paddle2Speed;

  if (paddle2Y < 0) paddle2Y = 0;
  else if (paddle2Y > gameHeight - paddle2.clientHeight)
    paddle2Y = gameHeight - paddle2.clientHeight;

  paddle2.style.top = paddle2Y + "px";
}
function updateBall() {
  ballX += ballSpeedX;
  ballY += ballSpeedY;

  // Top and bottom wall collision
  if (ballY >= gameHeight - ball.clientHeight || ballY <= 0) {
    ballSpeedY = -ballSpeedY;
  }

  // Paddle1 collision
  if (
    ballX <= paddle1.clientWidth &&
    ballY >= paddle1Y &&
    ballY <= paddle1Y + paddle1.clientHeight
  ) {
    ballSpeedX = -ballSpeedX;
    increaseBallSpeed(); // Increase speed on paddle hit
  }

  // Paddle2 collision
  if (
    ballX >= gameWidth - paddle2.clientWidth - ball.clientWidth &&
    ballY >= paddle2Y &&
    ballY <= paddle2Y + paddle2.clientHeight
  ) {
    ballSpeedX = -ballSpeedX;
    increaseBallSpeed(); // Increase speed on paddle hit
  }

  if (ballX <= 0) {
    playr1Score++;
    updateScore();
    resetBall();
    resetPaddle();
    pauseGame();
  } else if (ballX >= gameWidth - ball.clientWidth) {
    playr2Score++;
    updateScore();
    resetBall();
    resetPaddle();
    pauseGame();  
  }

  ball.style.left = ballX + "px";
  ball.style.top = ballY + "px";
}

function increaseBallSpeed() {
  if (Math.abs(ballSpeedX) < maxBallSpeed) {
    ballSpeedX *= 1.1; // Increase X speed by 10%
  }
  if (Math.abs(ballSpeedY) < maxBallSpeed) {
    ballSpeedY *= 1.1; // Increase Y speed by 10%
  }
}

// Ball reset function
function resetBall(){
  ballY = gameHeight / 2 - ball.clientHeight / 2;
  ballX = gameWidth / 2 - ball.clientWidth / 2;
  // Randomize starting direction with initial speed
  ballSpeedX = (Math.random() >= 0.5 ? 2 : -2) * 1.5;
  ballSpeedY = (Math.random() >= 0.5 ? 2 : -2) * 1.5;
}

function resetPaddle(){
    paddle1Y = 261;
    paddle2Y = 261;
    paddle1.style.top = paddle1Y + "px";
    paddle2.style.top = paddle2Y + "px";
}


function updateScore() {
  player1.textContent = playr1Score;
  player2.textContent = playr2Score;
}


function pauseGame(){
    gameRunning =false;
    document.addEventListener('keydown',startGame);
}
