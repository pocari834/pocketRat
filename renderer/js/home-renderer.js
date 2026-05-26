/**
 * Home Renderer - Draws the room and furniture using color blocks
 * Handles UI interactions: shop, inventory, placement, removal
 */

const { ipcRenderer } = require('electron');

const homeManager = new HomeManager();

// UI state
let currentTab = 'shop';
let selectedItem = null;     // id of selected shop/inventory item for placement
let removeMode = false;
let placementPreview = null; // { row, col } for ghost preview
let petAnimFrame = 0;

const canvas = document.getElementById('room-canvas');
const ctx = canvas.getContext('2d');

// ---- Room drawing ----

const WALL_COLOR = '#F5E6D3';
const FLOOR_COLOR = '#E8D5B7';
const FLOOR_LINE_COLOR = '#D4C4A8';
const DOOR_COLOR = '#8D6E63';
const DOOR_HANDLE_COLOR = '#FFD54F';

function drawRoom() {
  const W = canvas.width;
  const H = canvas.height;

  // Wall (top portion)
  ctx.fillStyle = WALL_COLOR;
  ctx.fillRect(0, 0, W, 60);

  // Wall decoration line
  ctx.fillStyle = '#D7CCC8';
  ctx.fillRect(0, 55, W, 3);

  // Floor
  ctx.fillStyle = FLOOR_COLOR;
  ctx.fillRect(0, 58, W, H - 58);

  // Floor grid lines (subtle)
  ctx.strokeStyle = FLOOR_LINE_COLOR;
  ctx.lineWidth = 0.5;
  for (let c = 0; c <= ROOM_GRID_COLS; c++) {
    const x = c * CELL_SIZE + 10;
    ctx.beginPath();
    ctx.moveTo(x, 58);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let r = 0; r <= ROOM_GRID_ROWS; r++) {
    const y = r * CELL_SIZE + 58;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }

  // Door (bottom right)
  const doorX = (ROOM_GRID_COLS - 1) * CELL_SIZE + 10;
  const doorY = H - CELL_SIZE;
  ctx.fillStyle = DOOR_COLOR;
  ctx.fillRect(doorX + 10, doorY + 5, 50, CELL_SIZE - 5);
  // Door frame
  ctx.strokeStyle = '#6D4C41';
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX + 10, doorY + 5, 50, CELL_SIZE - 5);
  // Door handle
  ctx.fillStyle = DOOR_HANDLE_COLOR;
  ctx.beginPath();
  ctx.arc(doorX + 50, doorY + 35, 4, 0, Math.PI * 2);
  ctx.fill();

  // Draw placed furniture
  drawPlacedFurniture();

  // Draw placement preview (ghost)
  if (placementPreview && selectedItem) {
    drawPlacementPreview();
  }

  // Draw pet if at home
  if (homeManager.petAtHome && homeManager.petGridPos) {
    drawPetInHome();
  }
}

function drawPlacedFurniture() {
  const drawn = new Set();
  for (const key of Object.keys(homeManager.placedFurniture)) {
    if (key.endsWith('_origin')) continue;
    const fid = homeManager.placedFurniture[key];
    if (drawn.has(fid)) continue;
    drawn.add(fid);

    const [row, col] = key.split(',').map(Number);
    const catalog = FURNITURE_CATALOG[fid];
    if (!catalog) continue;

    const x = col * CELL_SIZE + 10;
    const y = row * CELL_SIZE + 58;
    const w = catalog.size.w * CELL_SIZE;
    const h = catalog.size.h * CELL_SIZE;

    drawFurnitureShape(ctx, fid, catalog, x, y, w, h);
  }
}

function drawFurnitureShape(ctx, fid, catalog, x, y, w, h) {
  const padding = 4;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  roundRect(ctx, x + padding + 2, y + padding + 2, w - padding * 2, h - padding * 2, 6);
  ctx.fill();

  // Main body
  ctx.fillStyle = catalog.color;
  roundRect(ctx, x + padding, y + padding, w - padding * 2, h - padding * 2, 6);
  ctx.fill();

  // Accent/detail based on type
  ctx.fillStyle = catalog.accentColor;

  switch (fid) {
    case 'straw_bed':
    case 'cushion_bed':
    case 'hammock':
      // Pillow
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2 - 5, w * 0.25, h * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Blanket lines
      ctx.strokeStyle = catalog.accentColor;
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(x + padding + 8, y + h / 2 + 5 + i * 6);
        ctx.lineTo(x + w - padding - 8, y + h / 2 + 5 + i * 6);
        ctx.stroke();
      }
      if (fid === 'hammock') {
        // Ropes
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + padding, y + padding);
        ctx.lineTo(x + padding - 5, y - 10);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + w - padding, y + padding);
        ctx.lineTo(x + w - padding + 5, y - 10);
        ctx.stroke();
      }
      break;

    case 'wheel':
      // Wheel circle
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) * 0.35, 0, Math.PI * 2);
      ctx.stroke();
      // Stand
      ctx.fillRect(x + w / 2 - 2, y + h / 2 + 10, 4, 15);
      ctx.fillRect(x + w / 2 - 8, y + h - padding - 2, 16, 4);
      break;

    case 'ball':
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.beginPath();
      ctx.arc(x + w / 2 - 5, y + h / 2 - 5, 6, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'tunnel_toy':
      // Tunnel openings
      ctx.beginPath();
      ctx.ellipse(x + padding + 15, y + h / 2, 12, h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(x + w - padding - 15, y + h / 2, 12, h * 0.3, 0, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'bowl':
      // Bowl shape
      ctx.beginPath();
      ctx.ellipse(x + w / 2, y + h / 2, w * 0.3, h * 0.2, 0, 0, Math.PI);
      ctx.fill();
      // Food bits
      ctx.fillStyle = '#8D6E63';
      ctx.beginPath();
      ctx.arc(x + w / 2 - 3, y + h / 2 - 2, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w / 2 + 3, y + h / 2 - 3, 2, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'water_bottle':
      // Bottle shape
      ctx.fillRect(x + w / 2 - 6, y + padding + 8, 12, h - padding * 2 - 15);
      // Water level
      ctx.fillStyle = '#4FC3F7';
      ctx.fillRect(x + w / 2 - 4, y + h / 2, 8, h / 2 - padding - 7);
      // Nozzle
      ctx.fillStyle = '#B0BEC5';
      ctx.fillRect(x + w / 2 - 2, y + h - padding - 8, 4, 8);
      break;

    case 'treat_jar':
      // Jar body
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 + 5, 10, 0, Math.PI * 2);
      ctx.fill();
      // Lid
      ctx.fillStyle = '#6D4C41';
      roundRect(ctx, x + w / 2 - 8, y + padding + 4, 16, 6, 2);
      ctx.fill();
      break;

    case 'plant':
      // Pot
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(x + w / 2 - 8, y + h / 2, 16, h / 2 - padding - 2);
      // Leaves
      ctx.fillStyle = '#4CAF50';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + h / 2 - 3, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w / 2 - 7, y + h / 2 + 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x + w / 2 + 7, y + h / 2 + 2, 7, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'painting':
      // Frame
      ctx.strokeStyle = '#6D4C41';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + padding + 4, y + padding + 4, w - padding * 2 - 8, h - padding * 2 - 8);
      // Mini landscape
      ctx.fillStyle = '#87CEEB';
      ctx.fillRect(x + padding + 6, y + padding + 6, w - padding * 2 - 12, (h - padding * 2 - 12) / 2);
      ctx.fillStyle = '#66BB6A';
      ctx.fillRect(x + padding + 6, y + h / 2, w - padding * 2 - 12, h / 2 - padding - 6);
      break;

    case 'lamp':
      // Lamp shade
      ctx.beginPath();
      ctx.moveTo(x + w / 2 - 12, y + padding + 10);
      ctx.lineTo(x + w / 2 + 12, y + padding + 10);
      ctx.lineTo(x + w / 2 + 8, y + padding + 22);
      ctx.lineTo(x + w / 2 - 8, y + padding + 22);
      ctx.fill();
      // Stand
      ctx.fillStyle = '#8D6E63';
      ctx.fillRect(x + w / 2 - 2, y + padding + 22, 4, h - padding * 2 - 28);
      // Base
      ctx.fillRect(x + w / 2 - 8, y + h - padding - 6, 16, 4);
      // Light glow
      ctx.fillStyle = 'rgba(255,249,196,0.3)';
      ctx.beginPath();
      ctx.arc(x + w / 2, y + padding + 16, 15, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'chest':
      // Lid
      roundRect(ctx, x + padding + 2, y + padding + 2, w - padding * 2 - 4, (h - padding * 2) * 0.4, 3);
      ctx.fill();
      // Lock
      ctx.fillStyle = '#FFD54F';
      ctx.fillRect(x + w / 2 - 3, y + padding + (h - padding * 2) * 0.35, 6, 6);
      break;

    case 'litter_box':
      // Rim
      ctx.strokeStyle = catalog.accentColor;
      ctx.lineWidth = 2;
      roundRect(ctx, x + padding + 2, y + padding + 2, w - padding * 2 - 4, h - padding * 2 - 4, 4);
      ctx.stroke();
      // Grains
      ctx.fillStyle = '#D7CCC8';
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.arc(x + 15 + i * 10, y + h / 2 + 5, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;

    default:
      // Generic detail stripe
      ctx.fillRect(x + padding + 4, y + padding + 4, w - padding * 2 - 8, 4);
  }

  // Label
  ctx.fillStyle = '#5D4037';
  ctx.font = '9px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(catalog.name, x + w / 2, y + h - padding - 2);
  ctx.textAlign = 'left';
}

function drawPlacementPreview() {
  const { row, col } = placementPreview;
  const catalog = FURNITURE_CATALOG[selectedItem];
  if (!catalog) return;

  const x = col * CELL_SIZE + 10;
  const y = row * CELL_SIZE + 58;
  const w = catalog.size.w * CELL_SIZE;
  const h = catalog.size.h * CELL_SIZE;

  // Check if valid
  let valid = true;
  for (let r = row; r < row + catalog.size.h; r++) {
    for (let c = col; c < catalog.size.w + col; c++) {
      if (homeManager.placedFurniture[r + ',' + c]) valid = false;
    }
  }

  ctx.globalAlpha = 0.4;
  ctx.fillStyle = valid ? '#A5D6A7' : '#EF9A9A';
  roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 6);
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = '#5D4037';
  ctx.font = '10px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(catalog.name, x + w / 2, y + h / 2);
  ctx.textAlign = 'left';
  ctx.globalAlpha = 1;
}

function drawPetInHome() {
  const pos = homeManager.petGridPos;
  if (!pos) return;
  petAnimFrame++;

  const cx = pos.col * CELL_SIZE + 10 + CELL_SIZE / 2;
  const cy = pos.row * CELL_SIZE + 58 + CELL_SIZE / 2;
  const breathe = Math.sin(petAnimFrame * 0.08) * 1.5;
  const s = 0.55; // scale for home version

  ctx.save();
  ctx.translate(cx, cy + breathe);
  ctx.scale(s, s);

  // Tail
  const tailWag = Math.sin(petAnimFrame * 0.12) * 8;
  ctx.strokeStyle = '#B0B0B0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-40, -5);
  ctx.quadraticCurveTo(-58, -20 + tailWag, -68, -30 + tailWag);
  ctx.stroke();

  // Body
  ctx.fillStyle = '#B8B8B8';
  roundRect(ctx, -38, -22, 65, 44, 18);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#D9D9D9';
  roundRect(ctx, -24, -10, 40, 26, 12);
  ctx.fill();

  // Legs
  const legAnim = Math.sin(petAnimFrame * 0.3) * 4;
  ctx.fillStyle = '#909090';
  roundRect(ctx, -28, 18 - legAnim, 14, 14, 5);
  ctx.fill();
  roundRect(ctx, -5, 18 + legAnim, 14, 14, 5);
  ctx.fill();
  ctx.fillStyle = '#A0A0A0';
  roundRect(ctx, -28, 16 + legAnim, 12, 14, 5);
  ctx.fill();
  roundRect(ctx, 8, 16 - legAnim, 12, 14, 5);
  ctx.fill();

  // Head
  ctx.fillStyle = '#B8B8B8';
  ctx.beginPath();
  ctx.ellipse(15, -28, 24, 22, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#A0A0A0';
  ctx.beginPath();
  ctx.ellipse(4, -50, 10, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.ellipse(4, -49, 6, 9, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#A0A0A0';
  ctx.beginPath();
  ctx.ellipse(28, -48, 10, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.ellipse(28, -47, 6, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Eyes
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(8, -30, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(22, -30, 5, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFF';
  ctx.beginPath();
  ctx.arc(10, -32, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(24, -32, 2, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#FF9999';
  ctx.beginPath();
  ctx.ellipse(36, -26, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Cheeks
  ctx.fillStyle = 'rgba(255,182,193,0.35)';
  ctx.beginPath();
  ctx.ellipse(2, -20, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(28, -20, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Whiskers
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(34, -24);
  ctx.lineTo(50, -28);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(34, -22);
  ctx.lineTo(52, -22);
  ctx.stroke();

  ctx.restore();
}

// Rounded rect helper
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ---- UI Panel ----

function renderPanel() {
  const content = document.getElementById('panel-content');
  if (currentTab === 'shop') {
    renderShop(content);
  } else {
    renderInventory(content);
  }
}

function renderShop(container) {
  let html = '';
  for (const fid of Object.keys(FURNITURE_CATALOG)) {
    const cat = FURNITURE_CATALOG[fid];
    const canBuy = homeManager.coins >= cat.price;
    const selected = selectedItem === fid ? ' selected' : '';
    html += `<div class="shop-item${selected}" data-id="${fid}" data-action="buy-select" style="${canBuy ? '' : 'opacity:0.5'}">
      <div class="item-preview" style="background:${cat.color}"></div>
      <div class="item-info">
        <div class="item-name">${cat.name}</div>
        <div class="item-desc">${cat.description}</div>
      </div>
      <div class="item-price">🪙${cat.price}</div>
    </div>`;
  }
  container.innerHTML = html;
}

function renderInventory(container) {
  const inv = homeManager.getInventory();
  if (inv.length === 0) {
    container.innerHTML = '<div style="text-align:center;color:#8D6E63;font-size:12px;padding:20px;">仓库空空如也~<br>去商店买些家具吧！</div>';
    return;
  }
  let html = '';
  for (const item of inv) {
    const selected = selectedItem === item.id ? ' selected' : '';
    html += `<div class="inventory-item${selected}" data-id="${item.id}" data-action="place-select">
      <div class="item-preview" style="background:${item.catalog.color}"></div>
      <div class="item-info">
        <div class="item-name">${item.catalog.name}</div>
        <div class="item-desc">${item.catalog.description}</div>
      </div>
    </div>`;
  }
  container.innerHTML = html;
}

function updateStats() {
  document.getElementById('coins-display').textContent = homeManager.coins;
  document.getElementById('stat-happiness').textContent = homeManager.getTotalHappiness();
  document.getElementById('stat-comfort').textContent = homeManager.getTotalComfort();

  const btn = document.getElementById('btn-call-pet');
  if (homeManager.petAtHome) {
    btn.textContent = '🐹 让鼠宝出去玩';
    btn.classList.add('pet-home');
  } else {
    btn.textContent = '🐹 叫鼠宝回家';
    btn.classList.remove('pet-home');
  }
}

// ---- Event handling ----

// Canvas click: place or remove furniture
canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const col = Math.floor((mx - 10) / CELL_SIZE);
  const row = Math.floor((my - 58) / CELL_SIZE);

  if (col < 0 || col >= ROOM_GRID_COLS || row < 0 || row >= ROOM_GRID_ROWS) return;

  if (removeMode) {
    if (homeManager.removeFurniture(row, col)) {
      updateStats();
      renderPanel();
      redraw();
    }
    return;
  }

  // Place selected item
  if (selectedItem && currentTab === 'inventory') {
    if (homeManager.placeFurniture(selectedItem, row, col)) {
      selectedItem = null;
      placementPreview = null;
      updateStats();
      renderPanel();
      redraw();
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  const col = Math.floor((mx - 10) / CELL_SIZE);
  const row = Math.floor((my - 58) / CELL_SIZE);

  if (col >= 0 && col < ROOM_GRID_COLS && row >= 0 && row < ROOM_GRID_ROWS && selectedItem && !removeMode) {
    placementPreview = { row, col };
  } else {
    placementPreview = null;
  }
  redraw();
});

// Panel click delegation
document.getElementById('panel-content').addEventListener('click', (e) => {
  const item = e.target.closest('[data-action]');
  if (!item) return;

  const action = item.dataset.action;
  const id = item.dataset.id;

  if (action === 'buy-select') {
    const catalog = FURNITURE_CATALOG[id];
    if (homeManager.coins >= catalog.price) {
      if (confirm(`花 ${catalog.price} 金币买 ${catalog.name}？`)) {
        if (homeManager.buyFurniture(id)) {
          selectedItem = null;
          updateStats();
          renderPanel();
        }
      }
    }
  } else if (action === 'place-select') {
    if (selectedItem === id) {
      selectedItem = null;
    } else {
      selectedItem = id;
      removeMode = false;
      document.getElementById('btn-remove-mode').classList.remove('active');
    }
    renderPanel();
  }
});

// Tab switching
document.querySelectorAll('.panel-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    currentTab = tab.dataset.tab;
    selectedItem = null;
    placementPreview = null;
    renderPanel();
  });
});

// Close button
document.getElementById('close-btn').addEventListener('click', () => {
  ipcRenderer.send('home:close');
});

// Call pet button
document.getElementById('btn-call-pet').addEventListener('click', () => {
  if (homeManager.petAtHome) {
    homeManager.setPetAtHome(false);
    ipcRenderer.send('pet:leave-home');
  } else {
    homeManager.setPetAtHome(true);
    ipcRenderer.send('pet:enter-home');
  }
  updateStats();
  redraw();
});

// Remove mode toggle
document.getElementById('btn-remove-mode').addEventListener('click', () => {
  removeMode = !removeMode;
  selectedItem = null;
  placementPreview = null;
  document.getElementById('btn-remove-mode').classList.toggle('active', removeMode);
  canvas.style.cursor = removeMode ? 'crosshair' : 'pointer';
  renderPanel();

  // Show/remove hint
  let hint = document.getElementById('remove-hint');
  if (removeMode) {
    if (!hint) {
      hint = document.createElement('div');
      hint.id = 'remove-hint';
      hint.textContent = '💡 点击家具即可收起';
      hint.style.cssText = 'position:absolute;top:42px;left:50%;transform:translateX(-50%);background:#FFF3E0;color:#E65100;padding:4px 12px;border-radius:12px;font-size:11px;pointer-events:none;z-index:10;';
      document.querySelector('.room-area').appendChild(hint);
    }
    hint.style.display = 'block';
  } else if (hint) {
    hint.style.display = 'none';
  }
});

// IPC: sync coins from pet mini-games
ipcRenderer.on('home:sync-coins', (_event, coins) => {
  homeManager.addCoins(coins);
  updateStats();
});

ipcRenderer.on('home:pet-come-home', () => {
  homeManager.setPetAtHome(true);
  updateStats();
  redraw();
});

ipcRenderer.on('home:pet-go-out', () => {
  homeManager.setPetAtHome(false);
  updateStats();
  redraw();
});

// ---- Animation loop ----

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawRoom();
}

function animLoop() {
  redraw();
  requestAnimationFrame(animLoop);
}

// ---- Init ----
homeManager.setCallbacks(
  () => updateStats(),
  () => { renderPanel(); updateStats(); },
  null,
  null
);

updateStats();
renderPanel();
animLoop();
