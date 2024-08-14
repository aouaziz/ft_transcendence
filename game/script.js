let menu = document.querySelector('#menu-icon')
let navbar = document.querySelector('.navbar')
menu.onclick = () =>{
    menu.classList.toggle('bx-x')
    navbar.classList.toggle('open')
}

// Game events

document.addEventListener('keydown',startGame);
document.addEventListener('keydown',handleKeyDown);
document.addEventListener('keyup',handleKeyUp);

// Game variables 

let gameText = document.getElementById('startText');
let paddle1  = document.getElementById('paddle1');
let paddle2  = document.getElementById('paddle2');

const accelerationSpeed =1;
const maxSpeed =5;
const gameheight = 400;

let keysPrassed = {};
let gameRunning = false;
let paddle1Speed = 0;
let paddle2Speed = 0;
let paddle1Y = 150;
let paddle2Y = 150;
// Start Game

function startGame(){
    gameRunning = true;
    gameText.style.display = 'none';
    gameLoop();
    document.removeEventListener('keydown',startGame);
}

function gameLoop(){
    updatePaddle1();
    updatePaddle2();
    updateBall();
    setTimeout(gameLoop,8);
}

function handleKeyDown(e){
    keysPrassed[e.key] =true;
    console.log(keysPrassed);
}

function handleKeyUp(e){
    keysPrassed[e.key] =false;
    console.log(keysPrassed);
}

function updatePaddle1(){

    if(keysPrassed['w'])
    {
        paddle1Speed = Math.max(paddle1Speed -accelerationSpeed, -maxSpeed);
    }
    else if(keysPrassed['s'])
    {
        paddle1Speed = Math.min(paddle1Speed +accelerationSpeed, maxSpeed);
    }
    else{
        if(paddle1Speed >0){
            paddle1Speed = Math.max(paddle1Speed -accelerationSpeed,0);
        }
        if(paddle1Speed <0){
            paddle1Speed = Math.min(paddle1Speed + accelerationSpeed,0);
        }
    }
    
    paddle1Y += paddle1Speed; 
    
    if(paddle1Y < 0)
        paddle1Y  = 0;
    else if(paddle1Y > gameheight - paddle1.clientHeight)
        paddle1Y = gameheight - paddle1.clientHeight;

    paddle1.style.top = paddle1Y + 'px';
}
function updatePaddle2(){

    if(keysPrassed['ArrowUp'])
    {
        paddle2Speed = Math.max(paddle2Speed -accelerationSpeed, -maxSpeed);
    }
    else if(keysPrassed['ArrowDown'])
    {
        paddle2Speed = Math.min(paddle2Speed +accelerationSpeed, maxSpeed);
    }
    else{
        if(paddle2Speed >0){
            paddle2Speed = Math.max(paddle2Speed -accelerationSpeed,0);
        }
        if(paddle2Speed <0){
            paddle2Speed = Math.min(paddle2Speed + accelerationSpeed,0);
        }
    }
    
    paddle2Y += paddle2Speed; 
    
    if(paddle2Y < 0)
        paddle2Y  = 0;
    else if(paddle2Y > gameheight - paddle2.clientHeight)
        paddle2Y = gameheight - paddle2.clientHeight;

    paddle2.style.top = paddle2Y + 'px';
}

function updateBall(){

}