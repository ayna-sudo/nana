// --- AUDIO SYNTHESIZER (Web Audio API) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  playJump() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(600, this.ctx.currentTime + 0.15);
    
    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.15);
  }

  playCoin() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime + 0.08);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.2);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.2);
  }

  playPowerup() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.25);
    
    gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.25);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.25);
  }

  playGameOver() {
    if (this.muted || !this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(300, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.5);
    
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.5);
    
    osc.start();
    osc.stop(this.ctx.currentTime + 0.5);
  }
}

const audio = new SoundController();

// --- GAME INITIALIZATION & VARIABLES ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const hud = document.getElementById('hud');
const startBtn = document.getElementById('startBtn');
const restartBtn = document.getElementById('restartBtn');
const soundBtn = document.getElementById('soundBtn');

const scoreText = document.getElementById('scoreText');
const coinsText = document.getElementById('coinsText');
const highScoreHUD = document.getElementById('highScoreHUD');
const finalScore = document.getElementById('finalScore');
const finalCoins = document.getElementById('finalCoins');
const finalHighScore = document.getElementById('finalHighScore');
const powerupBars = document.getElementById('powerup-bars');

let gameState = 'START'; // START, PLAYING, GAMEOVER
let score = 0;
let coins = 0;
let highScore = localStorage.getItem('neon_runner_high') || 0;
let gameSpeed = 6;
let baseSpeed = 6;
let distance = 0;
let lastTime = 0;

highScoreHUD.textContent = Math.floor(highScore);

// --- PLAYER OBJECT ---
const player = {
  x: 80,
  y: 0,
  width: 32,
  height: 54,
  normalHeight: 54,
  duckHeight: 28,
  vy: 0,
  gravity: 0.65,
  jumpStrength: -12.5,
  isGrounded: false,
  jumpCount: 0,
  maxJumps: 2,
  isDucking: false,
  color: '#00f3ff',
  trail: [],

  // Active Powerups
  shield: false,
  magnet: false,
  magnetTimer: 0,
  multiplier: false,
  multiplierTimer: 0,

  reset() {
    this.y = canvas.height - 60 - this.height;
    this.vy = 0;
    this.isGrounded = true;
    this.jumpCount = 0;
    this.isDucking = false;
    this.height = this.normalHeight;
    this.shield = false;
    this.magnetTimer = 0;
    this.multiplierTimer = 0;
    this.trail = [];
  },

  jump() {
    if (this.jumpCount < this.maxJumps) {
      this.vy = this.jumpStrength;
      this.isGrounded = false;
      this.jumpCount++;
      audio.playJump();
      createParticles(this.x + this.width / 2, this.y + this.height, '#00f3ff', 8);
    }
  },

  duck(enable) {
    if (enable && !this.isDucking) {
      this.isDucking = true;
      this.height = this.duckHeight;
      if (this.isGrounded) this.y += (this.normalHeight - this.duckHeight);
    } else if (!enable && this.isDucking) {
      this.isDucking = false;
      this.y -= (this.normalHeight - this.duckHeight);
      this.height = this.normalHeight;
    }
  },

  update() {
    // Apply Gravity
    this.vy += this.gravity;
    this.y += this.vy;

    const groundY = canvas.height - 60 - this.height;

    if (this.y >= groundY) {
      this.y = groundY;
      this.vy = 0;
      this.isGrounded = true;
      this.jumpCount = 0;
    }

    // Timers
    if (this.magnetTimer > 0) this.magnetTimer--;
    if (this.multiplierTimer > 0) this.multiplierTimer--;

    this.magnet = this.magnetTimer > 0;
    this.multiplier = this.multiplierTimer > 0;

    // Trail effect
    this.trail.push({ x: this.x, y: this.y, width: this.width, height: this.height, alpha: 0.5 });
    if (this.trail.length > 5) this.trail.shift();
  },

  draw() {
    // Draw Trail
    this.trail.forEach((t) => {
      ctx.fillStyle = `rgba(0, 243, 255, ${t.alpha * 0.3})`;
      ctx.fillRect(t.x - 5, t.y, t.width, t.height);
      t.alpha -= 0.08;
    });

    // Draw Player Body
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);

    // Player Eye / Visor
    ctx.fillStyle = '#fff';
    if (this.isDucking) {
      ctx.fillRect(this.x + 18, this.y + 6, 10, 4);
    } else {
      ctx.fillRect(this.x + 18, this.y + 10, 10, 6);
    }

    // Shield Effect
    if (this.shield) {
      ctx.strokeStyle = '#ff0077';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x + this.width / 2, this.y + this.height / 2, 35, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.shadowBlur = 0;
  }
};

// --- ENVIRONMENT & PARALLAX BACKGROUND ---
const stars = Array.from({ length: 40 }, () => ({
  x: Math.random() * canvas.width,
  y: Math.random() * (canvas.height - 100),
  size: Math.random() * 2,
  speed: Math.random() * 0.5 + 0.2
}));

const buildings = Array.from({ length: 8 }, (_, i) => ({
  x: i * 110,
  width: 80 + Math.random() * 40,
  height: 100 + Math.random() * 150,
  color: `hsl(${260 + Math.random() * 40}, 50%, 15%)`
}));

function drawBackground() {
  // Deep space background gradient
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, '#050510');
  grad.addColorStop(1, '#1a0033');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Stars
  ctx.fillStyle = '#fff';
  stars.forEach(s => {
    if (gameState === 'PLAYING') s.x -= s.speed;
    if (s.x < 0) s.x = canvas.width;
    ctx.fillRect(s.x, s.y, s.size, s.size);
  });

  // Buildings (Parallax Layer)
  buildings.forEach(b => {
    if (gameState === 'PLAYING') b.x -= gameSpeed * 0.2;
    if (b.x + b.width < 0) {
      b.x = canvas.width + Math.random() * 50;
      b.height = 100 + Math.random() * 150;
    }
    ctx.fillStyle = b.color;
    ctx.fillRect(b.x, canvas.height - 60 - b.height, b.width, b.height);
  });

  // Floor Grid
  ctx.strokeStyle = '#00f3ff';
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = '#00f3ff';
  ctx.beginPath();
  ctx.moveTo(0, canvas.height - 60);
  ctx.lineTo(canvas.width, canvas.height - 60);
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Floor Fill
  ctx.fillStyle = '#0a0a16';
  ctx.fillRect(0, canvas.height - 60, canvas.width, 60);
}

// --- OBSTACLES, COINS & POWERUPS ---
let obstacles = [];
let collectibles = [];
let particles = [];
let spawnTimer = 0;

class Obstacle {
  constructor() {
    this.type = Math.random() < 0.6 ? 'SPIKE' : 'DRONE';
    this.width = this.type === 'SPIKE' ? 30 : 40;
    this.height = this.type === 'SPIKE' ? 35 : 30;
    this.x = canvas.width + 50;
    this.y = this.type === 'SPIKE' ? canvas.height - 60 - this.height : canvas.height - 125;
  }

  update() {
    this.x -= gameSpeed;
  }

  draw() {
    ctx.shadowBlur = 10;
    if (this.type === 'SPIKE') {
      ctx.shadowColor = '#ff0055';
      ctx.fillStyle = '#ff0055';
      ctx.beginPath();
      ctx.moveTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    } else {
      // Drone
      ctx.shadowColor = '#ffcc00';
      ctx.fillStyle = '#ffcc00';
      ctx.fillRect(this.x, this.y, this.width, this.height);
      // Red Eye
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this.x + 5, this.y + 10, 10, 10);
    }
    ctx.shadowBlur = 0;
  }
}

class Collectible {
  constructor(x, y, type = 'COIN') {
    this.x = x;
    this.y = y;
    this.type = type; // COIN, SHIELD, MAGNET, MULTIPLIER
    this.size = type === 'COIN' ? 12 : 18;
    this.collected = false;
  }

  update() {
    this.x -= gameSpeed;

    // Magnet Logic
    if (player.magnet && this.type === 'COIN') {
      const dx = (player.x + player.width / 2) - this.x;
      const dy = (player.y + player.height / 2) - this.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 180) {
        this.x += (dx / dist) * 10;
        this.y += (dy / dist) * 10;
      }
    }
  }

  draw() {
    ctx.shadowBlur = 8;
    if (this.type === 'COIN') {
      ctx.shadowColor = '#ffd700';
      ctx.fillStyle = '#ffd700';
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Powerups
      let color = '#ff0077';
      let symbol = 'S';
      if (this.type === 'MAGNET') { color = '#00ffaa'; symbol = 'M'; }
      if (this.type === 'MULTIPLIER') { color = '#aa00ff'; symbol = '2X'; }

      ctx.shadowColor = color;
      ctx.fillStyle = color;
      ctx.fillRect(this.x - this.size, this.y - this.size, this.size * 2, this.size * 2);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, this.x, this.y);
    }
    ctx.shadowBlur = 0;
  }
}

// --- PARTICLES ---
function createParticles(x, y, color, count = 10) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x, y,
      vx: (Math.random() - 0.5) * 6,
      vy: (Math.random() - 0.5) * 6,
      size: Math.random() * 4 + 2,
      color,
      life: 1
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life -= 0.03;

    if (p.life <= 0) {
      particles.splice(i, 1);
    } else {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.life;
      ctx.fillRect(p.x, p.y, p.size, p.size);
      ctx.globalAlpha = 1;
    }
  }
}

// --- SPAWN MANAGER ---
function handleSpawns() {
  spawnTimer++;
  if (spawnTimer > Math.max(45, 100 - gameSpeed * 4)) {
    spawnTimer = 0;

    // Spawn Obstacle
    obstacles.push(new Obstacle());

    // Chance to spawn coins or powerups
    if (Math.random() < 0.7) {
      const coinY = Math.random() < 0.5 ? canvas.height - 80 : canvas.height - 140;
      for (let i = 0; i < 3; i++) {
        collectibles.push(new Collectible(canvas.width + 120 + (i * 30), coinY, 'COIN'));
      }
    } else if (Math.random() < 0.25) {
      const types = ['SHIELD', 'MAGNET', 'MULTIPLIER'];
      const pType = types[Math.floor(Math.random() * types.length)];
      collectibles.push(new Collectible(canvas.width + 100, canvas.height - 130, pType));
    }
  }
}

// --- COLLISION DETECTION ---
function checkCollisions() {
  // AABB Collision
  for (let i = obstacles.length - 1; i >= 0; i--) {
    let obs = obstacles[i];
    if (
      player.x < obs.x + obs.width &&
      player.x + player.width > obs.x &&
      player.y < obs.y + obs.height &&
      player.y + player.height > obs.y