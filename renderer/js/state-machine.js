/**
 * Pet State Machine - Manages all 7 core behaviors
 * States: IDLE, WALK, SLEEP, CHEW, GROOM, STAND, FOLLOW, TUNNEL
 */

const PetState = {
  IDLE: 'idle',
  WALK: 'walk',
  SLEEP: 'sleep',
  CHEW: 'chew',
  GROOM: 'groom',
  STAND: 'stand',
  FOLLOW: 'follow',
  TUNNEL: 'tunnel',
  DANCE: 'dance',
};

const InteractionType = {
  PET: 'pet',
  FEED: 'feed',
  CLICK: 'click',
  SCARE: 'scare',
  CHAT: 'chat',
};

// WorkMode is defined in work-mode.js, reused here

const STATE_CONFIG = {
  [PetState.IDLE]: {
    duration: [3000, 8000],
    nextWeights: [
      { state: PetState.WALK, weight: 15 },
      { state: PetState.CHEW, weight: 20 },
      { state: PetState.GROOM, weight: 20 },
      { state: PetState.STAND, weight: 25 },
      { state: PetState.SLEEP, weight: 20 },
    ],
    fps: 15,
  },
  [PetState.WALK]: {
    duration: [4000, 10000],
    nextWeights: [
      { state: PetState.IDLE, weight: 40 },
      { state: PetState.TUNNEL, weight: 10 },
      { state: PetState.STAND, weight: 25 },
      { state: PetState.CHEW, weight: 15 },
      { state: PetState.GROOM, weight: 10 },
    ],
    fps: 30,
  },
  [PetState.SLEEP]: {
    duration: [10000, 30000],
    nextWeights: [
      { state: PetState.IDLE, weight: 60 },
      { state: PetState.GROOM, weight: 30 },
      { state: PetState.WALK, weight: 10 },
    ],
    fps: 15,
  },
  [PetState.CHEW]: {
    duration: [3000, 6000],
    nextWeights: [
      { state: PetState.IDLE, weight: 40 },
      { state: PetState.GROOM, weight: 25 },
      { state: PetState.WALK, weight: 20 },
      { state: PetState.STAND, weight: 15 },
    ],
    fps: 24,
  },
  [PetState.GROOM]: {
    duration: [4000, 7000],
    nextWeights: [
      { state: PetState.IDLE, weight: 40 },
      { state: PetState.WALK, weight: 30 },
      { state: PetState.CHEW, weight: 20 },
      { state: PetState.STAND, weight: 10 },
    ],
    fps: 24,
  },
  [PetState.STAND]: {
    duration: [2000, 4000],
    nextWeights: [
      { state: PetState.IDLE, weight: 45 },
      { state: PetState.WALK, weight: 20 },
      { state: PetState.CHEW, weight: 20 },
      { state: PetState.GROOM, weight: 15 },
    ],
    fps: 15,
  },
  [PetState.FOLLOW]: {
    duration: [3000, 8000],
    nextWeights: [
      { state: PetState.IDLE, weight: 50 },
      { state: PetState.WALK, weight: 30 },
      { state: PetState.CHEW, weight: 20 },
    ],
    fps: 60,
  },
  [PetState.TUNNEL]: {
    duration: [2000, 4000],
    nextWeights: [
      { state: PetState.WALK, weight: 30 },
      { state: PetState.IDLE, weight: 45 },
      { state: PetState.STAND, weight: 25 },
    ],
    fps: 30,
  },
  [PetState.DANCE]: {
    duration: [3000, 5000],
    nextWeights: [
      { state: PetState.IDLE, weight: 100 },
    ],
    fps: 30,
  },
};

class PetStateMachine {
  constructor() {
    this.currentState = PetState.IDLE;
    this.stateTimer = 0;
    this.stateDuration = 5000;
    this.frame = 0;
    this.direction = 1;
    this.posX = 0;
    this.posY = 0;
    this.screenWidth = 1920;
    this.screenHeight = 1080;
    this.walkSpeed = 1.5;
    this.workMode = WorkMode.NONE;
    this.idleSince = Date.now();
    this.lastMouseMove = Date.now();
    this.chewTimer = 0;
    this.groomTimer = 0;
    this.CHEW_INTERVAL = 15 * 60 * 1000;
    this.GROOM_INTERVAL = 20 * 60 * 1000;
    this.onStateChange = null;
    this.onPositionChange = null;
    this.onBubbleShow = null;
    this.resetStateDuration();
  }

  setCallbacks(onStateChange, onPositionChange, onBubbleShow) {
    this.onStateChange = onStateChange;
    this.onPositionChange = onPositionChange;
    this.onBubbleShow = onBubbleShow;
  }

  setScreenSize(width, height) {
    this.screenWidth = width;
    this.screenHeight = height;
  }

  setPosition(x, y) {
    this.posX = x;
    this.posY = y;
  }

  getState() { return this.currentState; }
  getFrame() { return this.frame; }
  getDirection() { return this.direction; }

  getFps() {
    if (this.workMode === WorkMode.FOCUS) return 15;
    const config = STATE_CONFIG[this.currentState];
    if (!config) {
      console.warn('[StateMachine] Missing fps config for state:', this.currentState);
      return 30;
    }
    return config.fps;
  }

  setWorkMode(mode) {
    this.workMode = mode;
    if (mode === WorkMode.FOCUS) {
      this.transitionTo(PetState.IDLE);
    }
  }

  updateMouseActivity() {
    this.lastMouseMove = Date.now();
    this.idleSince = Date.now();
  }

  handleInteraction(type) {
    switch (type) {
      case InteractionType.PET:
        this.transitionTo(PetState.IDLE);
        if (this.onBubbleShow) this.onBubbleShow('吱吱~ 💕');
        break;
      case InteractionType.FEED:
        this.transitionTo(PetState.CHEW);
        if (this.onBubbleShow) this.onBubbleShow('好吃！');
        break;
      case InteractionType.CLICK:
        this.transitionTo(PetState.DANCE);
        if (this.onBubbleShow) this.onBubbleShow('💃 跳舞啦！');
        break;
      case InteractionType.SCARE:
        this.transitionTo(PetState.IDLE);
        if (this.onBubbleShow) this.onBubbleShow('呜...');
        break;
    }
  }

  update(deltaMs) {
    this.frame++;
    this.stateTimer += deltaMs;

    if (this.currentState === PetState.DANCE) {
      // Fallback: if video didn't load or got stuck, auto-return to idle after 10s
      if (this.stateTimer > 10000) {
        this.transitionTo(PetState.IDLE);
      }
      return;
    }

    this.checkWorkMode();

    this.chewTimer += deltaMs;
    this.groomTimer += deltaMs;

    if (this.chewTimer >= this.CHEW_INTERVAL && this.currentState === PetState.IDLE) {
      this.chewTimer = 0;
      this.transitionTo(PetState.CHEW);
      return;
    }

    if (this.groomTimer >= this.GROOM_INTERVAL && this.currentState === PetState.IDLE) {
      this.groomTimer = 0;
      this.transitionTo(PetState.GROOM);
      return;
    }

    const hour = new Date().getHours();
    if (hour >= 23 || hour < 6) {
      if (this.currentState === PetState.IDLE && Date.now() - this.idleSince > 5 * 60 * 1000) {
        this.transitionTo(PetState.SLEEP);
        return;
      }
    }

    if (this.stateTimer >= this.stateDuration) {
      const nextState = this.pickNextState();
      this.transitionTo(nextState);
    }

    if (this.currentState === PetState.WALK) {
      this.posX += this.walkSpeed * this.direction;
      if (this.posX <= 0) { this.direction = 1; this.posX = 0; }
      else if (this.posX >= this.screenWidth - 200) { this.direction = -1; this.posX = this.screenWidth - 200; }
      if (this.onPositionChange) this.onPositionChange(this.posX, this.posY);
    }

    if (this.currentState === PetState.TUNNEL) {
      this.posX += this.walkSpeed * 2 * this.direction;
      if (this.posX < -200) { this.posX = this.screenWidth; this.direction = -1; }
      else if (this.posX > this.screenWidth) { this.posX = -200; this.direction = 1; }
      if (this.onPositionChange) this.onPositionChange(this.posX, this.posY);
    }
  }

  checkWorkMode() {
    if (this.workMode === WorkMode.REST_REMINDER) {
      if (this.currentState !== PetState.STAND) {
        this.transitionTo(PetState.STAND);
        if (this.onBubbleShow) this.onBubbleShow('陪我玩一下嘛 🥺');
      }
      return;
    }
    if (this.workMode === WorkMode.DRINK_REMINDER) {
      if (this.currentState !== PetState.STAND) {
        this.transitionTo(PetState.STAND);
        if (this.onBubbleShow) this.onBubbleShow('该喝水啦！💧');
      }
      return;
    }
    if (this.workMode === WorkMode.NIGHT_COMPANION) {
      if (this.currentState === PetState.IDLE || this.currentState === PetState.WALK) {
        this.transitionTo(PetState.SLEEP);
      }
      return;
    }

    const now = Date.now();
    const idleTime = now - this.lastMouseMove;
    if (idleTime > 45 * 60 * 1000) {
      this.workMode = WorkMode.REST_REMINDER;
      if (this.onBubbleShow) this.onBubbleShow('你已经工作很久了，休息一下吧！');
    } else if (idleTime > 2 * 60 * 60 * 1000) {
      this.workMode = WorkMode.DRINK_REMINDER;
      if (this.onBubbleShow) this.onBubbleShow('别忘了喝水哦！💧');
    }
  }

  transitionTo(state) {
    if (this.currentState === state) return;
    this.currentState = state;
    this.stateTimer = 0;
    this.resetStateDuration();
    if (this.onStateChange) this.onStateChange(state, this.direction);
  }

  pickNextState() {
    const config = STATE_CONFIG[this.currentState];
    if (!config || !config.nextWeights) {
      console.warn('[StateMachine] Missing nextWeights for state:', this.currentState);
      return PetState.IDLE;
    }
    const weights = config.nextWeights;
    const totalWeight = weights.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    for (const { state, weight } of weights) {
      random -= weight;
      if (random <= 0) return state;
    }
    return weights[0].state;
  }

  resetStateDuration() {
    const config = STATE_CONFIG[this.currentState];
    if (!config || !config.duration) {
      console.warn('[StateMachine] Missing duration for state:', this.currentState);
      this.stateDuration = 5000;
      return;
    }
    const [min, max] = config.duration;
    this.stateDuration = min + Math.random() * (max - min);
  }

  feedMousePosition(mx, my) {
    if (this.currentState === PetState.FOLLOW) {
      const targetX = mx - 75;
      if (targetX > this.posX) this.direction = 1;
      else this.direction = -1;
      this.posX += (targetX - this.posX) * 0.05;
      if (this.onPositionChange) this.onPositionChange(this.posX, this.posY);
    }
  }

  startFollow() {
    this.transitionTo(PetState.FOLLOW);
  }
}
