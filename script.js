// script.js - simple platformer
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const restartBtn = document.getElementById('restart');

const W = canvas.width, H = canvas.height;
const GRAV = 0.6;

// Tile size
const TS = 40;

// Level layout (0 empty, 1 ground, 2 coin, 3 enemy, 4 goal)
const level = [
  "000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000",
  "000000000000000000000000000000000000000",
  "000000000000000000002000000000000000000",
  "000000000000000011111111000000000000000",
  "000000000000000000000000000000000004000",
  "000000000000000000000000000000001111110",
  "000000000000020000000000000000000000000",
  "111110000001111100000011111100000011111",
  "000000000000000000000000000000000000000",
  "111111111111111111111111111111111111111"
];

// Convert to numeric grid
const grid = level.map(row => row.split('').map(c => parseInt(c)));
const ROWS = grid.length;
const COLS = grid[0].length;

// Player
let player = {
  x: TS + 2,
  y: H - TS * 3,
  w: 28,
  h: 36,
  vx: 0,
  vy: 0,
  speed: 3.2,
  jumpPower: 12,
  onGround: false,
  lives: 3
};

let score = 0;
let cameraX = 0;
let keys = {};
let gameOver = false;
let win = false;

function tileAtPixel(x,y){
  const col = Math.floor(x/TS);
  const row = Math.floor(y/TS);
  if(row<0 || row>=ROWS || col<0 || col>=COLS) return 0;
  return grid[row][col];
}

function setTile(col,row,val){
  if(row<0||row>=ROWS||col<0||col>=COLS) return;
  grid[row][col]=val;
}

function rectIntersects(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function update(){
  if(gameOver || win) return;

  // Input
  if(keys['ArrowLeft'] || keys['a']) player.vx = -player.speed;
  else if(keys['ArrowRight'] || keys['d']) player.vx = player.speed;
  else player.vx = 0;

  // Apply gravity
  player.vy += GRAV;

  // Horizontal movement + collision
  player.x += player.vx;
  // check horizontal collisions with tiles
  const left = Math.floor(player.x/TS);
  const right = Math.floor((player.x + player.w)/TS);
  const top = Math.floor(player.y/TS);
  const bottom = Math.floor((player.y + player.h - 1)/TS);

  for(let r=top;r<=bottom;r++){
    for(let c=left;c<=right;c++){
      const t = grid[r] && grid[r][c];
      if(t === 1){
        // collide
        if(player.vx > 0){
          player.x = c*TS - player.w; // push left
        } else if(player.vx < 0){
          player.x = c*TS + TS; // push right
        }
        player.vx = 0;
      }
    }
  }

  // Vertical movement + collision
  player.y += player.vy;
  player.onGround = false;
  const left2 = Math.floor(player.x/TS);
  const right2 = Math.floor((player.x + player.w)/TS);
  const top2 = Math.floor(player.y/TS);
  const bottom2 = Math.floor((player.y + player.h - 1)/TS);

  for(let r=top2;r<=bottom2;r++){
    for(let c=left2;c<=right2;c++){
      const t = grid[r] && grid[r][c];
      if(t === 1){
        if(player.vy > 0){
          // landing on top
          player.y = r*TS - player.h;
          player.vy = 0;
          player.onGround = true;
        } else if(player.vy < 0){
          player.y = r*TS + TS;
          player.vy = 0;
        }
      }
      if(t === 2){
        // coin
        // remove coin and increment score
        setTile(c,r,0);
        score++;
      }
      if(t === 3){
        // enemy tile; simple damage when overlapping
        // if player is falling onto enemy, defeat it
        const tileRect = { x: c*TS, y: r*TS, w: TS, h: TS };
        const playerRect = { x: player.x, y: player.y, w: player.w, h: player.h };
        if(rectIntersects(playerRect, tileRect)){
          if(player.vy > 2){
            // stomp enemy
            setTile(c,r,0);
            player.vy = -8;
            score += 2;
          } else {
            // take damage
            hit();
          }
        }
      }
      if(t === 4){
        // goal
        win = true;
      }
    }
  }

  // Jump
  if((keys['ArrowUp']||keys['w']||keys[' ']) && player.onGround){
    player.vy = -player.jumpPower;
    player.onGround = false;
  }

  // Boundaries
  if(player.y > H + 200){
    // fell off
    hit();
  }

  // camera follows player
  cameraX = player.x - W/3;
  cameraX = Math.max(0, Math.min(cameraX, COLS*TS - W));

  // Update HUD
  scoreEl.textContent = `Coins: ${score}`;
  livesEl.textContent = `Lives: ${player.lives}`;
}

function hit(){
  player.lives--;
  if(player.lives <= 0){
    gameOver = true;
  } else {
    // reset player position
    player.x = TS + 2;
    player.y = H - TS * 3;
    player.vx = player.vy = 0;
  }
}

function draw(){
  // clear
  ctx.clearRect(0,0,W,H);

  // background
  ctx.fillStyle = '#87ceeb';
  ctx.fillRect(0,0,W,H);

  // ground color
  const startCol = Math.floor(cameraX/TS);
  const endCol = Math.ceil((cameraX + W)/TS);

  for(let r=0;r<ROWS;r++){
    for(let c=startCol;c<endCol;c++){
      const t = grid[r] && grid[r][c];
      if(!t) continue;
      const x = c*TS - cameraX;
      const y = r*TS;
      if(t === 1){
        ctx.fillStyle = '#8d6e63';
        ctx.fillRect(x, y, TS, TS);
        // highlight
        ctx.strokeStyle = '#5d4037';
        ctx.strokeRect(x+1,y+1,TS-2,TS-2);
      } else if(t === 2){
        // coin
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(x+TS/2, y+TS/2, TS/4, 0, Math.PI*2);
        ctx.fill();
      } else if(t === 3){
        // enemy (simple red square)
        ctx.fillStyle = '#c62828';
        ctx.fillRect(x+6,y+6,TS-12,TS-12);
      } else if(t === 4){
        // goal flag
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x+TS/4, y+TS/4, TS/8, TS*3/4);
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.moveTo(x+TS/4+TS/8,y+TS/4);
        ctx.lineTo(x+TS/4+TS/8+14,y+TS/4+10);
        ctx.lineTo(x+TS/4+TS/8,y+TS/4+20);
        ctx.fill();
      }
    }
  }

  // draw player
  ctx.fillStyle = '#1565c0';
  ctx.fillRect(player.x - cameraX, player.y, player.w, player.h);
  // eyes
  ctx.fillStyle = '#fff';
  ctx.fillRect(player.x - cameraX + 6, player.y + 8, 6, 6);
  ctx.fillRect(player.x - cameraX + 16, player.y + 8, 6, 6);

  // HUD overlays for win/gameover
  if(win){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('You reached the goal! Well done!', W/2, H/2);
  }
  if(gameOver){
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(0,0,W,H);
    ctx.fillStyle = '#fff';
    ctx.font = '36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over', W/2, H/2 - 20);
    ctx.font = '20px Arial';
    ctx.fillText('Press Restart to play again', W/2, H/2 + 20);
  }
}

function loop(){
  update();
  draw();
  requestAnimationFrame(loop);
}

// Input
window.addEventListener('keydown', e => { keys[e.key] = true; });
window.addEventListener('keyup', e => { keys[e.key] = false; });

restartBtn.addEventListener('click', ()=>{
  // reset state
  player.x = TS + 2;
  player.y = H - TS * 3;
  player.vx = player.vy = 0;
  player.lives = 3;
  score = 0;
  gameOver = false;
  win = false;
  // restore original grid coins/enemies/goal
  // re-create grid from level description
  for(let r=0;r<ROWS;r++){
    for(let c=0;c<COLS;c++){
      grid[r][c] = parseInt(level[r][c]);
    }
  }
});

// Initialize HUD
scoreEl.textContent = `Coins: ${score}`;
livesEl.textContent = `Lives: ${player.lives}`;

requestAnimationFrame(loop);
