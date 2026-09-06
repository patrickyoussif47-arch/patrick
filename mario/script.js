// script.js - Simple platformer (Super Mario style) but minimal and original
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('score');
const livesEl = document.getElementById('lives');
const levelEl = document.getElementById('level');
const restartBtn = document.getElementById('restart');
const nextBtn = document.getElementById('nextLevel');

const WIDTH = canvas.width; const HEIGHT = canvas.height;

// Player
const PLAYER_W = 40, PLAYER_H = 48;
let player = { x:80, y:HEIGHT-150, w:PLAYER_W, h:PLAYER_H, vx:0, vy:0, speed:3.2, jump: -9.5, grounded:false };

// Physics
const GRAVITY = 0.5;
const FRICTION = 0.9;

// Level data (array of platforms and coins/enemies)
let levelIndex = 0;
const levels = [
  {
    platforms: [
      {x:0,y:HEIGHT-32,w:WIDTH,h:32},
      {x:200,y:420,w:140,h:20},
      {x:420,y:360,w:120,h:20},
      {x:620,y:300,w:120,h:20},
      {x:820,y:420,w:120,h:20}
    ],
    coins: [ {x:230,y:380}, {x:450,y:320}, {x:650,y:260}, {x:860,y:380} ],
    enemies: [ {x:500,y:336,dir:-1,range:80}, {x:740,y:276,dir:1,range:100} ]
  },
  {
    platforms: [
      {x:0,y:HEIGHT-32,w:WIDTH,h:32},
      {x:120,y:460,w:120,h:20},
      {x:280,y:380,w:120,h:20},
      {x:480,y:320,w:120,h:20},
      {x:660,y:420,w:120,h:20},
      {x:860,y:360,w:100,h:20}
    ],
    coins: [ {x:150,y:420}, {x:320,y:340}, {x:510,y:280}, {x:690,y:380}, {x:900,y:320} ],
    enemies: [ {x:340,y:356,dir:1,range:120}, {x:760,y:396,dir:-1,range:140} ]
  }
];

let platforms = [];
let coins = [];
let enemies = [];

let score = 0;
let lives = 3;

// Controls
const keys = {};
window.addEventListener('keydown', e => { keys[e.key] = true; e.preventDefault(); });
window.addEventListener('keyup', e => { keys[e.key] = false; });

function loadLevel(i){
  levelIndex = i % levels.length;
  const L = levels[levelIndex];
  platforms = L.platforms.map(p=>Object.assign({},p));
  coins = L.coins.map(c=>({x:c.x,y:c.y,w:14,h:14, collected:false}));
  enemies = L.enemies.map(e=>({x:e.x,y:e.y,w:36,h:32,baseX:e.x,dir:e.dir,range:e.range,speed:1.6}));
  player.x = 80; player.y = HEIGHT-150; player.vx = 0; player.vy = 0; player.grounded = false;
  levelEl.textContent = `Level: ${levelIndex+1}`;
}

function rectsOverlap(a,b){
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + (b.h||0) && a.y + a.h > b.y;
}

function update(){
  // input
  let move = 0;
  if(keys['ArrowLeft'] || keys['a'] || keys['A']) move = -1;
  if(keys['ArrowRight'] || keys['d'] || keys['D']) move = 1;

  player.vx += move * player.speed;
  player.vx *= FRICTION;
  player.vy += GRAVITY;

  // jump
  if((keys['ArrowUp'] || keys['w'] || keys['W'] || keys[' ']) && player.grounded){
    player.vy = player.jump; player.grounded = false;
  }

  // apply
  player.x += player.vx;
  player.y += player.vy;

  // bounds
  if(player.x < 0) player.x = 0, player.vx = 0;
  if(player.x + player.w > WIDTH) player.x = WIDTH - player.w, player.vx = 0;

  // fall out
  if(player.y > HEIGHT + 100){
    loseLife();
  }

  // platform collisions (simple AABB, resolve vertical then horizontal)
  player.grounded = false;
  for(const p of platforms){
    const plat = {x:p.x,y:p.y,w:p.w,h:p.h};
    if(rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, plat)){
      // determine overlap depths
      const px = (player.x + player.w/2) - (plat.x + plat.w/2);
      const py = (player.y + player.h/2) - (plat.y + plat.h/2);
      const overlapX = (player.w + plat.w)/2 - Math.abs(px);
      const overlapY = (player.h + plat.h)/2 - Math.abs(py);
      if(overlapY < overlapX){
        // resolve Y
        if(py > 0){
          // player is below platform -> push down
          player.y += overlapY;
          player.vy = Math.max(0, player.vy);
        } else {
          // player is above platform -> land
          player.y -= overlapY;
          player.vy = 0;
          player.grounded = true;
        }
      } else {
        // resolve X
        if(px > 0) player.x += overlapX; else player.x -= overlapX;
        player.vx = 0;
      }
    }
  }

  // coins
  for(const c of coins){
    if(!c.collected && rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:c.x,y:c.y,w:c.w,h:c.h})){
      c.collected = true; score += 10; scoreEl.textContent = `Score: ${score}`;
    }
  }

  // enemies
  for(const e of enemies){
    e.x += e.dir * e.speed;
    if(Math.abs(e.x - e.baseX) > e.range) e.dir *= -1;
    if(rectsOverlap({x:player.x,y:player.y,w:player.w,h:player.h}, {x:e.x,y:e.y,w:e.w,h:e.h})){
      // check if player is falling and hits enemy from top -> stomp
      if(player.vy > 1 && (player.y + player.h - e.y) < 20){
        // stomp
        score += 25; scoreEl.textContent = `Score: ${score}`;
        // bounce
        player.vy = -7;
        // remove enemy
        e.dead = true;
      } else {
        // hurt player
        loseLife();
      }
    }
  }
  enemies = enemies.filter(e=>!e.dead);
}

function loseLife(){
  lives -= 1; livesEl.textContent = `Lives: ${lives}`;
  if(lives <= 0){
    // game over -> restart
    alert(`Game Over! Final score: ${score}`);
    resetGame();
  } else {
    // reset player position
    player.x = 80; player.y = HEIGHT - 150; player.vx = 0; player.vy = 0;
  }
}

function resetGame(){
  score = 0; lives = 3; scoreEl.textContent = `Score: ${score}`; livesEl.textContent = `Lives: ${lives}`;
  loadLevel(0);
}

function drawRoundedRect(x,y,w,h,r){
  ctx.beginPath();
  ctx.moveTo(x+r,y);
  ctx.arcTo(x+w,y,x+w,y+h,r);
  ctx.arcTo(x+w,y+h,x,y+h,r);
  ctx.arcTo(x,y+h,x,y,r);
  ctx.arcTo(x,y,x+w,y,r);
  ctx.closePath();
  ctx.fill();
}

function draw(){
  // background
  ctx.clearRect(0,0,WIDTH,HEIGHT);
  // sky gradient
  const g = ctx.createLinearGradient(0,0,0,HEIGHT);
  g.addColorStop(0,'#9be7ff'); g.addColorStop(1,'#6ec2ff');
  ctx.fillStyle = g; ctx.fillRect(0,0,WIDTH,HEIGHT);

  // draw platforms
  for(const p of platforms){
    ctx.fillStyle = '#7c3';
    drawRoundedRect(p.x,p.y,p.w,p.h,6);
    // top highlight
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(p.x,p.y, p.w, Math.min(6,p.h));
  }

  // draw coins
  for(const c of coins){
    if(c.collected) continue;
    ctx.fillStyle = '#ffdd55';
    ctx.beginPath(); ctx.arc(c.x + c.w/2, c.y + c.h/2, 7, 0, Math.PI*2); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.fillRect(c.x + c.w/2 - 2, c.y + c.h/2 - 7, 4, 10);
  }

  // draw enemies
  for(const e of enemies){
    ctx.fillStyle = '#c33';
    ctx.fillRect(e.x, e.y, e.w, e.h);
    ctx.fillStyle = '#000'; ctx.fillRect(e.x + 6, e.y + 12, 8, 6); ctx.fillRect(e.x + e.w - 14, e.y + 12, 8, 6);
  }

  // draw player
  ctx.fillStyle = '#ff3b3b';
  ctx.fillRect(player.x, player.y, player.w, player.h);
  // face / detail
  ctx.fillStyle = '#fff'; ctx.fillRect(player.x + 8, player.y + 12, 6, 6);

}

function loop(){ update(); draw(); requestAnimationFrame(loop); }

restartBtn.addEventListener('click', ()=> resetGame());
nextBtn.addEventListener('click', ()=> loadLevel(levelIndex+1));

// start
scoreEl.textContent = `Score: ${score}`; livesEl.textContent = `Lives: ${lives}`;
loadLevel(0);
requestAnimationFrame(loop);
