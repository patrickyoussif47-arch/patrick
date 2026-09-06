// script.js
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');
const restartBtn = document.getElementById('restart');

const WIDTH = canvas.width;
const HEIGHT = canvas.height;

// Paddles
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const PADDLE_SPEED = 6;

let player = { x: 10, y: HEIGHT/2 - PADDLE_HEIGHT/2, vy:0 };
let computer = { x: WIDTH - PADDLE_WIDTH - 10, y: HEIGHT/2 - PADDLE_HEIGHT/2 };

// Ball
let ball = { x: WIDTH/2, y: HEIGHT/2, r:8, vx:4, vy:2 };
let playerScore = 0;
let computerScore = 0;
let running = true;

function resetBall(winner){
  ball.x = WIDTH/2;
  ball.y = HEIGHT/2;
  // send ball towards loser (so winner serves)
  const dir = winner === 'player' ? 1 : -1;
  ball.vx = 4 * dir;
  ball.vy = (Math.random() * 4 - 2);
  // pause briefly
  running = false;
  setTimeout(()=> running = true, 700);
}

function drawRect(x,y,w,h,fill='#fff'){
  ctx.fillStyle = fill;
  ctx.fillRect(x,y,w,h);
}

function drawCircle(x,y,r,fill='#fff'){
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fill();
}

function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function update(){
  if(running){
    // Move ball
    ball.x += ball.vx;
    ball.y += ball.vy;

    // Top/bottom collision
    if(ball.y - ball.r <= 0){ ball.y = ball.r; ball.vy *= -1; }
    if(ball.y + ball.r >= HEIGHT){ ball.y = HEIGHT - ball.r; ball.vy *= -1; }

    // Paddle collisions
    // player
    if(ball.x - ball.r <= player.x + PADDLE_WIDTH){
      if(ball.y >= player.y && ball.y <= player.y + PADDLE_HEIGHT){
        ball.x = player.x + PADDLE_WIDTH + ball.r; // prevent sticking
        // reflect
        const rel = (ball.y - (player.y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2); // -1..1
        const speed = Math.hypot(ball.vx, ball.vy) + 0.4; // slightly speed up
        const angle = rel * (Math.PI/3); // max 60deg
        ball.vx = Math.cos(angle) * speed; // to the right
        ball.vy = Math.sin(angle) * speed;
      } else if(ball.x - ball.r < 0){
        // missed
        computerScore++;
        updateScore();
        resetBall('computer');
      }
    }

    // computer
    if(ball.x + ball.r >= computer.x){
      if(ball.y >= computer.y && ball.y <= computer.y + PADDLE_HEIGHT){
        ball.x = computer.x - ball.r;
        const rel = (ball.y - (computer.y + PADDLE_HEIGHT/2)) / (PADDLE_HEIGHT/2);
        const speed = Math.hypot(ball.vx, ball.vy) + 0.4;
        const angle = rel * (Math.PI/3);
        ball.vx = -Math.cos(angle) * speed; // to the left
        ball.vy = Math.sin(angle) * speed;
      } else if(ball.x + ball.r > WIDTH){
        playerScore++;
        updateScore();
        resetBall('player');
      }
    }

    // Move player by vy (from arrow keys)
    player.y += player.vy;
    player.y = clamp(player.y, 0, HEIGHT - PADDLE_HEIGHT);

    // Simple AI for computer paddle: follow ball with limited speed
    const targetY = ball.y - PADDLE_HEIGHT/2;
    const diff = targetY - computer.y;
    const aiSpeed = 4.0; // adjust difficulty
    computer.y += clamp(diff, -aiSpeed, aiSpeed);
    computer.y = clamp(computer.y, 0, HEIGHT - PADDLE_HEIGHT);
  }
}

function updateScore(){
  playerScoreEl.textContent = `Player: ${playerScore}`;
  computerScoreEl.textContent = `Computer: ${computerScore}`;
}

function draw(){
  // clear
  ctx.fillStyle = '#000';
  ctx.fillRect(0,0,WIDTH,HEIGHT);

  // center net
  ctx.fillStyle = '#444';
  const step = 20;
  for(let y=0;y<HEIGHT;y+=step*2){
    ctx.fillRect(WIDTH/2 - 1, y+step/2, 2, step);
  }

  // paddles & ball
  drawRect(player.x, player.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  drawRect(computer.x, computer.y, PADDLE_WIDTH, PADDLE_HEIGHT);
  drawCircle(ball.x, ball.y, ball.r);
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// Controls: mouse movement over canvas
canvas.addEventListener('mousemove', (e)=>{
  const rect = canvas.getBoundingClientRect();
  const y = e.clientY - rect.top;
  player.y = clamp(y - PADDLE_HEIGHT/2, 0, HEIGHT - PADDLE_HEIGHT);
});

// Arrow keys
window.addEventListener('keydown', (e)=>{
  if(e.key === 'ArrowUp') { player.vy = -PADDLE_SPEED; }
  if(e.key === 'ArrowDown') { player.vy = PADDLE_SPEED; }
});
window.addEventListener('keyup', (e)=>{
  if(e.key === 'ArrowUp' || e.key === 'ArrowDown') { player.vy = 0; }
});

restartBtn.addEventListener('click', ()=>{
  playerScore = 0; computerScore = 0; updateScore(); resetBall();
  running = true;
});

// Initialize
updateScore();
resetBall();
requestAnimationFrame(loop);
