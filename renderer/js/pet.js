/**
 * Pet Main Entry Point
 * Connects all systems: renderer, state machine, interaction, work mode, mini games
 */

const { ipcRenderer } = require('electron');

// ---- Initialize systems ----
const stateMachine = new PetStateMachine();

// ---- Initialize pet stats ----
const petStats = new PetStats();

// Auto-save stats every 30 seconds
setInterval(() => { petStats.save(); }, 15000);
const workModeManager = new WorkModeManager();
const miniGameManager = new MiniGameManager();
const feedManager = new FeedManager({
  onFeed: () => {
    stateMachine.handleInteraction(InteractionType.FEED);
    petStats.modifyHunger(30);
    petStats.modifyMood(5);
    workModeManager.recordActivity();
    stateMachine.updateMouseActivity();
    showBubble('好吃！🧀', 2000);
  },
});

const interaction = new InteractionManager({
  onPet: () => {
    stateMachine.handleInteraction(InteractionType.PET);
    petStats.modifyMood(20);
    workModeManager.recordActivity();
    dismissReminderIfNeeded();
  },
  onFeed: () => {
    stateMachine.handleInteraction(InteractionType.FEED);
    petStats.modifyHunger(30);
    petStats.modifyMood(5);
    workModeManager.recordActivity();
  },
  onClick: () => {
    stateMachine.handleInteraction(InteractionType.CLICK);
    workModeManager.recordActivity();
    dismissReminderIfNeeded();
    petStats.modifyMood(15);
    petStats.modifyEnergy(-5);
  },
  onScare: () => {
    stateMachine.handleInteraction(InteractionType.SCARE);
  },
  onRightClick: () => {
      // right-click handled by custom menu
  },
  onDragStart: () => {
    stateMachine.transitionTo(PetState.IDLE);
  },
});

// ---- Connect callbacks ----
stateMachine.setCallbacks(
  (state, direction) => {
    console.log('State: ' + state + ', direction: ' + direction);
    if (state === PetState.DANCE) {
      playDanceVideo();
    } else {
      stopDanceVideo();
    }
  },
  (x, y) => {
    ipcRenderer.send('pet:set-position', x, y);
  },
  (text) => {
    showBubble(text);
  }
);

// When dance video ends, go back to idle
setOnDanceEnd(() => {
  stateMachine.transitionTo(PetState.IDLE);
});

workModeManager.setCallbacks(
  (mode) => {
    stateMachine.setWorkMode(mode);
  },
  (message) => {
    showBubble(message, 5000);
  },
  (title, body) => {
    ipcRenderer.send('tray:notify', title, body);
  }
);

miniGameManager.setCallbacks((result) => {
  console.log('Game ended: ' + result.gameType + ', score: ' + result.score + ', coins: ' + result.coins);
  petStats.modifyMood(25);
  petStats.modifyEnergy(-10);
  showBubble('得分: ' + result.score + '！金币 +' + result.coins + ' 🎉', 3000);
});

// ---- Load config ----
async function loadConfig() {
  try {
    await petStats.load();
    const config = await ipcRenderer.invoke('settings:load');
    if (config) {
      if (config.currentRatColor) setRatColor(config.currentRatColor);
      if (config.restIntervalMinutes) workModeManager.updateConfig({ restIntervalMinutes: config.restIntervalMinutes });
      if (config.drinkIntervalMinutes) workModeManager.updateConfig({ drinkIntervalMinutes: config.drinkIntervalMinutes });
    }
  } catch (e) {
    console.log('Config load skipped (main process not ready)');
  }
}

// ---- Get initial position ----
ipcRenderer.send('pet:get-screen-size');
ipcRenderer.on('pet:screen-size', (_event, width, height) => {
  stateMachine.setScreenSize(width, height);
  stateMachine.setPosition(width - 200, height - 200);
});

// Sync position after drag
ipcRenderer.on('pet:position', (_event, pos) => {
  if (pos) stateMachine.setPosition(pos[0], pos[1]);
});

// ---- Main game loop ----
let lastTime = performance.now();

let currentFps = 30;


function gameLoop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;

  const targetFps = stateMachine.getFps();
  if (targetFps !== currentFps) currentFps = targetFps;

  stateMachine.update(delta);
  petStats.update(delta, stateMachine.getState());
  stateMachine.setWeightModifiers(petStats.getWeightModifiers());

  drawRat(stateMachine.getState(), stateMachine.getFrame(), stateMachine.getDirection());
  updateStatsUI(petStats.hunger, petStats.mood, petStats.energy);
  const interval = 1000 / currentFps;
  const elapsed = performance.now() - timestamp;

  if (elapsed < interval) {
    setTimeout(() => requestAnimationFrame(gameLoop), interval - elapsed);
  } else {
    requestAnimationFrame(gameLoop);
  }
}

// ---- Mouse tracking for click-through detection ----
document.addEventListener('mousemove', (e) => {
  const canvas = document.getElementById('canvas');
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  const isInside = x >= 0 && x <= 200 && y >= 0 && y <= 200;
  interaction.setInsidePet(isInside);

  if (isInside) {
    ipcRenderer.send('pet:toggle-penetrate', false);
  } else {
    ipcRenderer.send('pet:toggle-penetrate', true);
  }

  workModeManager.recordActivity();
  stateMachine.updateMouseActivity();
  if (isInside) { showStatsPanel(); } else { hideStatsPanelDelayed(); }
});



// ---- Custom right-click menu ----
var ctxMenu = document.getElementById("ctx-menu") || {};
document.addEventListener("contextmenu", function(e) {
  e.preventDefault();
  if (ctxMenu.style) { ctxMenu.style.display = "block"; ctxMenu.style.left = e.clientX + "px"; ctxMenu.style.top = e.clientY + "px"; }
});
document.addEventListener("click", function() {
  if (ctxMenu.style) ctxMenu.style.display = "none";
});

// Menu item clicks
ctxMenu.addEventListener('click', function(e) {
  var action = e.target.getAttribute('data-action');
  ctxMenu.style.display = 'none';
  if (action === 'home') { ipcRenderer.send('pet:enter-home'); }
  else if (action === 'feed') { ipcRenderer.send('pet:feed'); }
  else if (action === 'game') { ipcRenderer.send('game:start', 'chase_cursor'); }
  else if (action === 'settings') { ipcRenderer.send('settings:open'); }
});
ipcRenderer.on('settings:updated', (_event, config) => {
  if (config.currentRatColor) setRatColor(config.currentRatColor);
  if (config.alwaysOnTop !== undefined) {
    ipcRenderer.send('pet:always-on-top', config.alwaysOnTop);
  }
  if (config.semiTransparent !== undefined) {
    ipcRenderer.send('pet:set-opacity', config.semiTransparent ? 0.6 : 1.0);
  }
  if (config.restIntervalMinutes || config.drinkIntervalMinutes) {
    workModeManager.updateConfig({
      restIntervalMinutes: config.restIntervalMinutes,
      drinkIntervalMinutes: config.drinkIntervalMinutes,
    });
  }
});

ipcRenderer.on('game:start', (_event, gameType) => {
  petStats.modifyMood(15);
  petStats.modifyEnergy(-5);
  miniGameManager.startGame(gameType);
});

ipcRenderer.on('game:stop', () => {
  miniGameManager.stopGame();
});

// ---- Pet responds to right-click menu actions ----
ipcRenderer.on('pet:feed', () => {
  petStats.modifyHunger(30);
  petStats.modifyMood(5);
  const isOpen = feedManager.toggleFeedMode();
  showBubble(isOpen ? '拖一个零食给我吧~' : '下次再吃~', 2000);
});

ipcRenderer.on('pet:play', () => {
  stateMachine.handleInteraction(InteractionType.CLICK);
  showBubble('吱吱！玩！🎾', 2000);
});

// ---- Dismiss work mode reminders ----
function dismissReminderIfNeeded() {
  workModeManager.dismissReminder();
}


// ---- Start ----
loadConfig().then(() => {
  workModeManager.startMonitoring();
  requestAnimationFrame(gameLoop);
  showBubble('吱吱！我来了~ 🐹', 3000);
});
