/**
 * Mini Games System
 * Games: CHASE_CURSOR, SNACK_RAIN, TUNNEL_RACE, CATCH_ME
 */

const MiniGameType = {
  CHASE_CURSOR: 'chase_cursor',
  SNACK_RAIN: 'snack_rain',
  TUNNEL_RACE: 'tunnel_race',
  CATCH_ME: 'catch_me',
};

// ---- Chase Cursor Game ----
class ChaseCursorGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.score = 0;
    this.maxDuration = 60000;
    this.petX = 100;
    this.petY = 100;
    this.targetX = 100;
    this.targetY = 100;
    this.catchCount = 0;
    this.CATCH_THRESHOLD = 20;
    this.onEnd = null;
    this.startTime = 0;
  }

  start() {
    this.isRunning = true;
    this.score = 0;
    this.catchCount = 0;
    this.startTime = Date.now();
    this._onMouseMove = (e) => {
      const point = this.getCanvasPoint(e);
      this.targetX = point.x;
      this.targetY = point.y;
    };
    document.addEventListener('mousemove', this._onMouseMove);
  }

  getCanvasPoint(event) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    };
  }

  update(deltaMs) {
    if (!this.isRunning) return;
    const dx = this.targetX - this.petX;
    const dy = this.targetY - this.petY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > this.CATCH_THRESHOLD) {
      this.petX += dx * 0.08;
      this.petY += dy * 0.08;
    } else {
      this.catchCount++;
      this.score++;
      this.targetX = 50 + Math.random() * (this.canvas.width - 100);
      this.targetY = 50 + Math.random() * (this.canvas.height - 100);
    }
    if (Date.now() - this.startTime > this.maxDuration) this.end();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = 'rgba(255, 200, 0, 0.3)';
    this.ctx.beginPath();
    this.ctx.arc(this.targetX, this.targetY, 25, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#A0A0A0';
    this.ctx.beginPath();
    this.ctx.arc(this.petX, this.petY, 20, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#222';
    this.ctx.beginPath();
    this.ctx.arc(this.petX - 6, this.petY - 5, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.beginPath();
    this.ctx.arc(this.petX + 6, this.petY - 5, 3, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText('抓住: ' + this.catchCount, 10, 25);
  }

  end() {
    this.isRunning = false;
    document.removeEventListener('mousemove', this._onMouseMove);
    const coins = Math.min(this.catchCount * 5, 50);
    if (this.onEnd) this.onEnd({
      gameType: MiniGameType.CHASE_CURSOR,
      score: this.catchCount,
      coins: coins,
      intimacy: Math.floor(coins / 10),
    });
  }

  stop() { this.isRunning = false; }
  isActive() { return this.isRunning; }
  setOnEnd(cb) { this.onEnd = cb; }
}

// ---- Snack Rain Game ----
class SnackRainGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.maxDuration = 45000;
    this.snacks = [];
    this.caught = 0;
    this.missed = 0;
    this.spawnTimer = 0;
    this.petX = 100;
    this.SNACK_EMOJIS = ['🌻', '🥕', '🧀', '🍎', '🥜'];
    this.onEnd = null;
    this.startTime = 0;
  }

  start() {
    this.isRunning = true;
    this.caught = 0;
    this.missed = 0;
    this.snacks = [];
    this.startTime = Date.now();
    this._onMouseMove = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      this.petX = (e.clientX - rect.left) * scaleX;
    };
    this._onClick = () => {
      this.snacks = this.snacks.filter(snack => {
        const dx = snack.x - this.petX;
        const dy = snack.y - 180;
        if (Math.abs(dx) < 30 && Math.abs(dy) < 30) {
          this.caught++;
          return false;
        }
        return true;
      });
    };
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('click', this._onClick);
  }

  update(deltaMs) {
    if (!this.isRunning) return;
    this.spawnTimer += deltaMs;
    if (this.spawnTimer > 600) {
      this.spawnTimer = 0;
      this.snacks.push({
        x: 20 + Math.random() * 160,
        y: -20,
        type: this.SNACK_EMOJIS[Math.floor(Math.random() * this.SNACK_EMOJIS.length)],
        speed: 2 + Math.random() * 2,
      });
    }
    for (const snack of this.snacks) snack.y += snack.speed;
    const before = this.snacks.length;
    this.snacks = this.snacks.filter(s => s.y < 220);
    this.missed += before - this.snacks.length;
    if (Date.now() - this.startTime > this.maxDuration) this.end();
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.font = '24px sans-serif';
    for (const snack of this.snacks) this.ctx.fillText(snack.type, snack.x, snack.y);
    this.ctx.fillStyle = '#8B4513';
    this.ctx.fillRect(this.petX - 25, 170, 50, 24);
    this.ctx.fillStyle = '#A0522D';
    this.ctx.fillRect(this.petX - 20, 160, 40, 14);
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText('接住: ' + this.caught + ' | 漏掉: ' + this.missed, 10, 25);
  }

  end() {
    this.isRunning = false;
    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('click', this._onClick);
    const coins = Math.min(this.caught * 10 + Math.floor(Math.random() * 10), 50);
    if (this.onEnd) this.onEnd({
      gameType: MiniGameType.SNACK_RAIN,
      score: this.caught,
      coins: coins,
      intimacy: Math.floor(this.caught / 2),
    });
  }

  stop() { this.isRunning = false; }
  isActive() { return this.isRunning; }
  setOnEnd(cb) { this.onEnd = cb; }
}

// ---- Tunnel Race Game ----
class TunnelRaceGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.maxDuration = 60000;
    this.holes = [];
    this.score = 0;
    this.round = 0;
    this.maxRounds = 10;
    this.isRevealing = false;
    this.guessed = false;
    this.onEnd = null;
  }

  start() {
    this.isRunning = true;
    this.score = 0;
    this.round = 0;
    this.setupRound();
    this._onClick = (e) => {
      if (!this.isRevealing || this.guessed) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      for (const hole of this.holes) {
        const dx = mx - hole.x;
        const dy = my - hole.y;
        if (Math.sqrt(dx * dx + dy * dy) < 30) {
          this.guessed = true;
          if (hole.hasRat) this.score += 10;
          setTimeout(() => {
            if (this.round >= this.maxRounds) this.end();
            else this.setupRound();
          }, 1000);
          break;
        }
      }
    };
    document.addEventListener('click', this._onClick);
  }

  setupRound() {
    this.round++;
    this.guessed = false;
    this.isRevealing = false;
    const positions = [45, 100, 155];
    const ratIndex = Math.floor(Math.random() * 3);
    this.holes = positions.map((x, i) => ({ x, y: 135, hasRat: i === ratIndex }));
    setTimeout(() => { this.isRevealing = true; }, 1000);
  }

  update() {}

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for (const hole of this.holes) {
      this.ctx.fillStyle = '#5D4037';
      this.ctx.beginPath();
      this.ctx.ellipse(hole.x, hole.y, 30, 15, 0, 0, Math.PI * 2);
      this.ctx.fill();
      if (this.isRevealing && hole.hasRat) {
        this.ctx.fillStyle = '#A0A0A0';
        this.ctx.beginPath();
        this.ctx.arc(hole.x, hole.y - 15, 18, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = '#222';
        this.ctx.beginPath();
        this.ctx.arc(hole.x - 5, hole.y - 18, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.beginPath();
        this.ctx.arc(hole.x + 5, hole.y - 18, 3, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText('回合: ' + this.round + '/' + this.maxRounds + ' | 得分: ' + this.score, 10, 25);
  }

  end() {
    this.isRunning = false;
    document.removeEventListener('click', this._onClick);
    if (this.onEnd) this.onEnd({
      gameType: MiniGameType.TUNNEL_RACE,
      score: this.score,
      coins: Math.floor(this.score * 0.5) + Math.floor(Math.random() * 20),
      intimacy: Math.floor(this.score / 10),
    });
  }

  stop() { this.isRunning = false; }
  isActive() { return this.isRunning; }
  setOnEnd(cb) { this.onEnd = cb; }
}

// ---- Catch Me Game ----
class CatchMeGame {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.isRunning = false;
    this.maxDuration = 60000;
    this.ballY = 50;
    this.ballX = 100;
    this.ballVelocityY = 0;
    this.isLaunched = false;
    this.catchCount = 0;
    this.round = 0;
    this.maxRounds = 10;
    this.gravity = 0.3;
    this.onEnd = null;
  }

  start() {
    this.isRunning = true;
    this.catchCount = 0;
    this.round = 0;
    this.launchBall();
    this._onClick = (e) => {
      if (!this.isLaunched) return;
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const dx = mx - this.ballX;
      const dy = my - this.ballY;
      if (Math.sqrt(dx * dx + dy * dy) < 25) {
        this.catchCount++;
        this.isLaunched = false;
        setTimeout(() => {
          if (this.round >= this.maxRounds) this.end();
          else this.launchBall();
        }, 500);
      }
    };
    document.addEventListener('click', this._onClick);
  }

  launchBall() {
    this.round++;
    this.ballY = 50;
    this.ballX = 35 + Math.random() * 130;
    this.ballVelocityY = 0;
    this.isLaunched = true;
  }

  update() {
    if (!this.isRunning || !this.isLaunched) return;
    this.ballVelocityY += this.gravity;
    this.ballY += this.ballVelocityY;
    if (this.ballY > 220) {
      this.isLaunched = false;
      setTimeout(() => {
        if (this.round >= this.maxRounds) this.end();
        else this.launchBall();
      }, 500);
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#FF6B6B';
    this.ctx.beginPath();
    this.ctx.arc(this.ballX, this.ballY, 15, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.strokeStyle = '#E55555';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();
    this.ctx.fillStyle = '#A0A0A0';
    this.ctx.beginPath();
    this.ctx.ellipse(100, 175, 25, 18, 0, 0, Math.PI * 2);
    this.ctx.fill();
    this.ctx.fillStyle = '#333';
    this.ctx.font = 'bold 16px sans-serif';
    this.ctx.fillText('接住: ' + this.catchCount + ' | 回合: ' + this.round + '/' + this.maxRounds, 10, 25);
  }

  end() {
    this.isRunning = false;
    document.removeEventListener('click', this._onClick);
    const coins = Math.min(this.catchCount * 5 + Math.floor(Math.random() * 15), 50);
    if (this.onEnd) this.onEnd({
      gameType: MiniGameType.CATCH_ME,
      score: this.catchCount,
      coins: coins,
      intimacy: this.catchCount,
    });
  }

  stop() { this.isRunning = false; }
  isActive() { return this.isRunning; }
  setOnEnd(cb) { this.onEnd = cb; }
}

// ---- Mini Game Manager ----
class MiniGameManager {
  constructor() {
    this.currentGame = null;
    this.gameCanvas = null;
    this.onGameEnd = null;
    this.animFrameId = 0;
    this.lastTime = 0;
  }

  setCallbacks(onGameEnd) {
    this.onGameEnd = onGameEnd;
  }

  startGame(type) {
    this.stopGame();
    this.gameCanvas = document.createElement('canvas');
    this.gameCanvas.width = 200;
    this.gameCanvas.height = 200;
    this.gameCanvas.style.cssText = `
      position: fixed; top: 0; left: 0;
      width: 200px; height: 200px;
      z-index: 9999;
      background: rgba(255,255,255,0.9);
      border-radius: 12px;
    `;
    document.body.appendChild(this.gameCanvas);

    switch (type) {
      case MiniGameType.CHASE_CURSOR:
        this.currentGame = new ChaseCursorGame(this.gameCanvas); break;
      case MiniGameType.SNACK_RAIN:
        this.currentGame = new SnackRainGame(this.gameCanvas); break;
      case MiniGameType.TUNNEL_RACE:
        this.currentGame = new TunnelRaceGame(this.gameCanvas); break;
      case MiniGameType.CATCH_ME:
        this.currentGame = new CatchMeGame(this.gameCanvas); break;
    }

    this.currentGame.setOnEnd((result) => {
      if (this.onGameEnd) this.onGameEnd(result);
      this.stopGame();
    });

    this.currentGame.start();
    this.lastTime = performance.now();
    this.gameLoop();
  }

  gameLoop() {
    if (!this.currentGame || !this.currentGame.isActive()) return;
    const now = performance.now();
    const delta = now - this.lastTime;
    this.lastTime = now;
    this.currentGame.update(delta);
    this.currentGame.render();
    this.animFrameId = requestAnimationFrame(() => this.gameLoop());
  }

  stopGame() {
    if (this.currentGame) { this.currentGame.stop(); this.currentGame = null; }
    if (this.animFrameId) { cancelAnimationFrame(this.animFrameId); this.animFrameId = 0; }
    if (this.gameCanvas) { this.gameCanvas.remove(); this.gameCanvas = null; }
  }

  isPlaying() {
    return this.currentGame ? this.currentGame.isActive() : false;
  }
}
