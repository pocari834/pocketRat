import { app, BrowserWindow, Tray, Menu, ipcMain, screen, nativeImage } from 'electron';
import * as path from 'path';
import { AppStore } from './store';

let mainWindow: BrowserWindow | null = null;
let settingsWindow: BrowserWindow | null = null;
let homeWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let store: AppStore;

function createMainWindow(): BrowserWindow {
  const { width: screenWidth, height: screenHeight } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 200,
    height: 200,
    x: screenWidth - 250,
    y: screenHeight - 250,
    transparent: false,
    backgroundColor: '#FFE0E0',
    frame: false,
    resizable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    hasShadow: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  const htmlPath = path.join(__dirname, '..', '..', 'renderer', 'pet.html');
  try { console.log('Loading pet.html from:', htmlPath); } catch (_) {}
  mainWindow.loadFile(htmlPath);

  // Open DevTools in debug
  if (process.env.POCKET_RAT_DEBUG === '1') {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  mainWindow.webContents.on('did-finish-load', () => {
  try { console.log('pet.html loaded successfully'); } catch (_) {}
  });

  mainWindow.webContents.on('console-message', (_event, level, message) => {
    try {
      const prefix = ["LOG", "WARN", "ERROR"][level] || "LOG";
      console.log(`[Renderer ${prefix}] ${message}`);
    } catch (_) { /* ignore broken pipe */ }
  });
  return mainWindow;
}

function createSettingsWindow(): void {
  if (settingsWindow) {
    settingsWindow.focus();
    return;
  }

  settingsWindow = new BrowserWindow({
    width: 380,
    height: 520,
    frame: false,
    resizable: false,
    transparent: true,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'settings.html'));

  settingsWindow.on('closed', () => {
    settingsWindow = null;
  });
}

function createHomeWindow(): void {
  if (homeWindow) {
    homeWindow.focus();
    return;
  }

  const { width: screenWidth } = screen.getPrimaryDisplay().workAreaSize;

  homeWindow = new BrowserWindow({
    width: 620,
    height: 400,
    x: Math.floor((screenWidth - 620) / 2),
    y: 100,
    frame: false,
    resizable: false,
    transparent: false,
    alwaysOnTop: true,
    backgroundColor: '#EFEBE9',
    title: '鼠宝的家',
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
    },
  });

  homeWindow.loadFile(path.join(__dirname, '..', '..', 'renderer', 'home.html'));

  homeWindow.on('closed', () => {
    homeWindow = null;
  });
}

function createTray(): void {
  const icon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAMlJREFUSEvt1LEJAjEUBdD/ySWcwBmcwSFcwidcwiV0BSd0BSf0BSI0EakiE2TiV96srflY5tP9+jN7OttYlvUby7J8j2VZVm+ez6cPMvY1H4g7I2Z8A14wD2d3wAVwBB7jE3CO24+5bgPv+AFcRbrgGryAO9EBV+Ay7kQH3AIv4Ba8wCVwg3vQBVfBE3COOnCNuNAFV8E9rkUP3AUP4hZ8iFvwKT6IW/AhbsO7+AsX+Qn5g1mW9R8m+w8k6zYVR8q1MgAAAABJRU5ErkJggg=='
  );
  tray = new Tray(icon);
  tray.setToolTip('Pocket Rat 🐹');

  const contextMenu = Menu.buildFromTemplate([
    { label: '🐹 显示鼠宝', click: () => mainWindow?.show() },
    { label: '🏠 鼠宝的家', click: () => createHomeWindow() },
    { label: '⚙️ 设置', click: () => createSettingsWindow() },
    { type: 'separator' },
    { label: '❌ 退出', click: () => app.quit() },
  ]);

  tray.setContextMenu(contextMenu);

  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    }
  });
}

// IPC handlers
function setupIPC(): void {
  // Pet right-click context menu
  ipcMain.on('pet:right-click', () => {
    try {
      const petMenu = Menu.buildFromTemplate([
        { label: '鼠宝的家', click: () => createHomeWindow() },
        { label: '喂食', click: () => mainWindow?.webContents.send('pet:feed') },
        { label: '追光标', click: () => mainWindow?.webContents.send('game:start', 'chase_cursor') },
        { type: 'separator' },
        { label: '设置', click: () => createSettingsWindow() },
      ]);
      if (mainWindow) { mainWindow.focus(); petMenu.popup({ window: mainWindow }); }
    } catch (e) { /* ignore */ }
  });

  ipcMain.on('pet:toggle-penetrate', (_event, enabled: boolean) => {
    if (mainWindow) {
      mainWindow.setIgnoreMouseEvents(enabled, { forward: true });
    }
  });

  ipcMain.on('pet:set-position', (_event, x: number, y: number) => {
    mainWindow?.setPosition(Math.round(x), Math.round(y));
  });

  ipcMain.on('pet:get-position', (event) => {
    const pos = mainWindow?.getPosition();
    event.reply('pet:position', pos);
  });

  ipcMain.on('pet:get-screen-size', (event) => {
    const { width, height } = screen.getPrimaryDisplay().workAreaSize;
    event.reply('pet:screen-size', width, height);
  });

  ipcMain.on('pet:move-by', (_event, dx: number, dy: number) => {
    if (mainWindow) {
      const [x, y] = mainWindow.getPosition();
      mainWindow.setPosition(Math.round(x + dx), Math.round(y + dy));
    }
  });

  ipcMain.on('pet:enter-home', () => {
    if (mainWindow) mainWindow.hide();
    homeWindow?.webContents.send('home:pet-come-home');
  });

  ipcMain.on('pet:leave-home', () => {
    if (mainWindow) mainWindow.show();
    homeWindow?.webContents.send('home:pet-go-out');
  });

  // Home window IPC
  ipcMain.on('home:close', () => {
    homeWindow?.close();
  });

  ipcMain.on('settings:close', () => {
    settingsWindow?.close();
  });

  ipcMain.on('settings:save', (_event, data: Record<string, unknown>) => {
    store.setMultiple(data);
    mainWindow?.webContents.send('settings:updated', data);
  });

  ipcMain.handle('settings:load', () => {
    return store.getAll();
  });

  ipcMain.on('tray:notify', (_event, title: string, body: string) => {
    tray?.displayBalloon({ title, content: body });
  });

  ipcMain.on('pet:always-on-top', (_event, enabled: boolean) => {
    mainWindow?.setAlwaysOnTop(enabled);
  });

  ipcMain.on('pet:set-opacity', (_event, opacity: number) => {
    mainWindow?.setOpacity(opacity);
  });

  ipcMain.on('app:quit', () => {
    app.quit();
  });

  // Pet stats persistence
  ipcMain.on('pet-stats:save', (_event, data: { hunger: number; mood: number; energy: number; lastSaveTime: number }) => {
    try { store.setPetStats(data.hunger, data.mood, data.energy, data.lastSaveTime); } catch (e) { console.error('[pet-stats:save]', e); }
  });

  ipcMain.handle('pet-stats:load', () => {
    try { return store.getPetStats(); } catch (e) { console.error('[pet-stats:load]', e); return {}; }
  });
}

app.whenReady().then(() => {
  store = new AppStore();

  createMainWindow();
  createTray();
  setupIPC();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
