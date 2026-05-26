const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function loadStateMachine() {
  const context = {
    console,
    Date,
    Math,
    module: { exports: {} },
  };
  vm.createContext(context);
  vm.runInContext(read('renderer/js/work-mode.js'), context);
  vm.runInContext(read('renderer/js/state-machine.js'), context);
  vm.runInContext('module.exports = { PetStateMachine, PetState, WorkMode };', context);
  return context.module.exports;
}

test('settings page uses supported IPC instead of removed electron remote API', () => {
  const html = read('renderer/settings.html');

  assert.equal(html.includes("require('electron').remote"), false);
  assert.match(html, /ipcRenderer\.send\('app:quit'\)/);
});

test('settings save broadcasts updated config to the pet renderer', () => {
  const main = read('src/main/main.ts');

  assert.match(main, /ipcMain\.on\('settings:save'/);
  assert.match(main, /mainWindow\?\.webContents\.send\('settings:updated',\s*data\)/);
});

test('settings markup has valid button and span closing tags', () => {
  const html = read('renderer/settings.html');

  assert.equal(html.includes('?/button>'), false);
  assert.equal(html.includes('?/span>'), false);
});

test('visible UI files do not contain common mojibake fragments', () => {
  const visibleFiles = [
    'renderer/home.html',
    'renderer/settings.html',
    'renderer/js/home-renderer.js',
    'renderer/js/pet.js',
    'renderer/js/state-machine.js',
    'renderer/js/work-mode.js',
    'renderer/js/mini-games.js',
    'src/main/main.ts',
  ];
  const mojibakePattern = /馃|鈿|鉂|榧|鍚|鐨|勫|彔|惞|獧|槉|洀|锔|鑸|掗|€|鍟|浠|撳|簱|紶|瀹|濆|浣|犲|缁|忓|伐|鍒|挄|拑|帀|煉|ズ|寵|棏|惰|搴|悵|堕|崕||/;

  const offenders = visibleFiles
    .map((file) => ({ file, text: read(file) }))
    .filter(({ text }) => mojibakePattern.test(text))
    .map(({ file }) => file);

  assert.deepEqual(offenders, []);
});

test('renderer html files define a content security policy', () => {
  const htmlFiles = [
    'renderer/pet.html',
    'renderer/settings.html',
    'renderer/home.html',
    'renderer/animation-test.html',
  ];

  const offenders = htmlFiles
    .filter((file) => !/Content-Security-Policy/i.test(read(file)));

  assert.deepEqual(offenders, []);
});

test('state machine uses drink reminder instead of rest reminder after two hours idle', () => {
  const { PetStateMachine, WorkMode } = loadStateMachine();
  const machine = new PetStateMachine();
  const now = Date.now();

  machine.lastMouseMove = now - (121 * 60 * 1000);
  machine.checkWorkMode();

  assert.equal(machine.workMode, WorkMode.DRINK_REMINDER);
});

test('pet mouse tracking updates both work manager and state machine activity', () => {
  const petScript = read('renderer/js/pet.js');

  assert.match(petScript, /stateMachine\.updateMouseActivity\(\)/);
  assert.match(petScript, /workModeManager\.recordActivity\(\)/);
});

test('right-click play menu starts the chase cursor mini game', () => {
  const main = read('src/main/main.ts');

  assert.match(main, /webContents\.send\('game:start',\s*'chase_cursor'\)/);
});

test('feed menu opens a food panel and food selection invokes feed interaction', () => {
  const petScript = read('renderer/js/pet.js');
  const interactionScript = read('renderer/js/interaction.js');

  assert.match(petScript, /feedManager\.toggleFeedMode\(\)/);
  assert.match(interactionScript, /callbacks\.onFeed/);
  assert.match(interactionScript, /data-food/);
});

test('mini game canvas uses the pet window size without css downscaling', () => {
  const miniGames = read('renderer/js/mini-games.js');

  assert.match(miniGames, /this\.gameCanvas\.width = 200/);
  assert.match(miniGames, /this\.gameCanvas\.height = 200/);
  assert.equal(miniGames.includes('width: 150px; height: 150px;'), false);
});

test('chase cursor game converts mouse coordinates into canvas coordinates', () => {
  const miniGames = read('renderer/js/mini-games.js');

  assert.match(miniGames, /getCanvasPoint\(e\)/);
  assert.match(miniGames, /this\.targetX = point\.x/);
  assert.match(miniGames, /this\.targetY = point\.y/);
});

test('mini game drawing coordinates fit inside the 200px pet window', () => {
  const miniGames = read('renderer/js/mini-games.js');
  const legacy300pxCoordinates = [
    'y < 320',
    'y - 260',
    '250, 50',
    '240, 40',
    'positions = [60, 150, 240]',
    '280, 25',
    'ballY > 320',
    'Math.random() * 240',
  ];

  const offenders = legacy300pxCoordinates.filter((snippet) => miniGames.includes(snippet));

  assert.deepEqual(offenders, []);
});
