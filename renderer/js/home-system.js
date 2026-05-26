/**
 * Home & Furniture System
 * Manages furniture inventory, placement, and interactions
 */

const FurnitureCategory = {
  BED: 'bed',
  TOY: 'toy',
  FOOD: 'food',
  DECOR: 'decor',
  UTILITY: 'utility',
};

// All available furniture definitions
const FURNITURE_CATALOG = {
  // Beds
  straw_bed: {
    id: 'straw_bed',
    name: '稻草床',
    category: FurnitureCategory.BED,
    price: 0,
    description: '简陋但温暖的稻草床',
    size: { w: 2, h: 2 },
    color: '#D4A574',
    accentColor: '#C4956A',
    happinessBonus: 0,
    comfortBonus: 1,
  },
  cushion_bed: {
    id: 'cushion_bed',
    name: '软垫床',
    category: FurnitureCategory.BED,
    price: 30,
    description: '柔软舒适的小垫子',
    size: { w: 2, h: 2 },
    color: '#FFB6C1',
    accentColor: '#FF91A4',
    happinessBonus: 1,
    comfortBonus: 2,
  },
  hammock: {
    id: 'hammock',
    name: '吊床',
    category: FurnitureCategory.BED,
    price: 50,
    description: '晃晃悠悠好舒服',
    size: { w: 2, h: 1 },
    color: '#87CEEB',
    accentColor: '#6BB3D9',
    happinessBonus: 2,
    comfortBonus: 2,
  },

  // Toys
  wheel: {
    id: 'wheel',
    name: '跑轮',
    category: FurnitureCategory.TOY,
    price: 20,
    description: '跑跑跑停不下来！',
    size: { w: 2, h: 2 },
    color: '#FFD700',
    accentColor: '#FFC107',
    happinessBonus: 3,
    comfortBonus: 0,
  },
  ball: {
    id: 'ball',
    name: '小球',
    category: FurnitureCategory.TOY,
    price: 10,
    description: '推来推去真好玩',
    size: { w: 1, h: 1 },
    color: '#FF6347',
    accentColor: '#E5533A',
    happinessBonus: 2,
    comfortBonus: 0,
  },
  tunnel_toy: {
    id: 'tunnel_toy',
    name: '管道玩具',
    category: FurnitureCategory.TOY,
    price: 35,
    description: '钻来钻去乐无穷',
    size: { w: 3, h: 1 },
    color: '#9370DB',
    accentColor: '#7B5FBF',
    happinessBonus: 3,
    comfortBonus: 1,
  },

  // Food
  bowl: {
    id: 'bowl',
    name: '食盆',
    category: FurnitureCategory.FOOD,
    price: 5,
    description: '装好吃的！',
    size: { w: 1, h: 1 },
    color: '#DEB887',
    accentColor: '#C9A56E',
    happinessBonus: 1,
    comfortBonus: 1,
  },
  water_bottle: {
    id: 'water_bottle',
    name: '水壶',
    category: FurnitureCategory.FOOD,
    price: 8,
    description: '渴了就喝',
    size: { w: 1, h: 2 },
    color: '#4FC3F7',
    accentColor: '#3AA8D8',
    happinessBonus: 0,
    comfortBonus: 2,
  },
  treat_jar: {
    id: 'treat_jar',
    name: '零食罐',
    category: FurnitureCategory.FOOD,
    price: 25,
    description: '满满的零食',
    size: { w: 1, h: 1 },
    color: '#FF8A65',
    accentColor: '#E5734D',
    happinessBonus: 2,
    comfortBonus: 1,
  },

  // Decor
  plant: {
    id: 'plant',
    name: '小盆栽',
    category: FurnitureCategory.DECOR,
    price: 15,
    description: '绿意盎然',
    size: { w: 1, h: 1 },
    color: '#66BB6A',
    accentColor: '#4CAF50',
    happinessBonus: 1,
    comfortBonus: 1,
  },
  painting: {
    id: 'painting',
    name: '小画框',
    category: FurnitureCategory.DECOR,
    price: 20,
    description: '艺术气息',
    size: { w: 1, h: 1 },
    color: '#FFD54F',
    accentColor: '#FFC107',
    happinessBonus: 1,
    comfortBonus: 0,
  },
  lamp: {
    id: 'lamp',
    name: '小台灯',
    category: FurnitureCategory.DECOR,
    price: 18,
    description: '暖暖的光',
    size: { w: 1, h: 1 },
    color: '#FFF9C4',
    accentColor: '#FFE082',
    happinessBonus: 1,
    comfortBonus: 2,
  },

  // Utility
  chest: {
    id: 'chest',
    name: '储物箱',
    category: FurnitureCategory.UTILITY,
    price: 15,
    description: '藏宝箱',
    size: { w: 2, h: 1 },
    color: '#8D6E63',
    accentColor: '#6D4C41',
    happinessBonus: 0,
    comfortBonus: 1,
  },
  litter_box: {
    id: 'litter_box',
    name: '小厕所',
    category: FurnitureCategory.UTILITY,
    price: 10,
    description: '保持卫生',
    size: { w: 1, h: 1 },
    color: '#B0BEC5',
    accentColor: '#90A4AE',
    happinessBonus: 0,
    comfortBonus: 3,
  },
};

// Grid size for the room
const ROOM_GRID_COLS = 6;
const ROOM_GRID_ROWS = 4;
const CELL_SIZE = 70;

class HomeManager {
  constructor() {
    // Furniture placed in the room: grid position -> furniture id
    this.placedFurniture = {};  // { "row,col": furnitureId }
    // Inventory of owned but not placed furniture
    this.inventory = [];
    // Currency
    this.coins = 50;
    // Pet at home?
    this.petAtHome = false;
    this.petGridPos = null; // { row, col }

    // Callbacks
    this.onCoinsChange = null;
    this.onFurnitureChange = null;
    this.onPetEnterHome = null;
    this.onPetLeaveHome = null;

    // Load from store
    this.loadFromConfig();
  }

  setCallbacks(onCoinsChange, onFurnitureChange, onPetEnterHome, onPetLeaveHome) {
    this.onCoinsChange = onCoinsChange;
    this.onFurnitureChange = onFurnitureChange;
    this.onPetEnterHome = onPetEnterHome;
    this.onPetLeaveHome = onPetLeaveHome;
  }

  loadFromConfig() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const saved = localStorage.getItem('pocketRatHome');
        if (saved) {
          const data = JSON.parse(saved);
          this.placedFurniture = data.placedFurniture || {};
          this.inventory = data.inventory || [];
          this.coins = data.coins !== undefined ? data.coins : 50;
        } else {
          // Default: straw bed in center
          this.placedFurniture = { '1,2': 'straw_bed', '1,3': 'straw_bed' };
          this.inventory = ['bowl', 'ball'];
        }
      }
    } catch (e) {
      console.log('Home config load skipped');
    }
  }

  saveToConfig() {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('pocketRatHome', JSON.stringify({
          placedFurniture: this.placedFurniture,
          inventory: this.inventory,
          coins: this.coins,
        }));
      }
    } catch (e) {
      console.log('Home config save skipped');
    }
  }

  getCoins() { return this.coins; }

  addCoins(amount) {
    this.coins += amount;
    this.saveToConfig();
    if (this.onCoinsChange) this.onCoinsChange(this.coins);
  }

  spendCoins(amount) {
    if (this.coins < amount) return false;
    this.coins -= amount;
    this.saveToConfig();
    if (this.onCoinsChange) this.onCoinsChange(this.coins);
    return true;
  }

  buyFurniture(furnitureId) {
    const catalog = FURNITURE_CATALOG[furnitureId];
    if (!catalog) return false;
    if (!this.spendCoins(catalog.price)) return false;
    this.inventory.push(furnitureId);
    this.saveToConfig();
    if (this.onFurnitureChange) this.onFurnitureChange();
    return true;
  }

  placeFurniture(furnitureId, row, col) {
    const catalog = FURNITURE_CATALOG[furnitureId];
    if (!catalog) return false;

    // Check bounds
    if (row < 0 || col < 0 || row + catalog.size.h > ROOM_GRID_ROWS || col + catalog.size.w > ROOM_GRID_COLS) {
      return false;
    }

    // Check if cells are free
    for (let r = row; r < row + catalog.size.h; r++) {
      for (let c = col; c < col + catalog.size.w; c++) {
        const key = r + ',' + c;
        if (this.placedFurniture[key]) return false;
      }
    }

    // Remove from inventory
    const idx = this.inventory.indexOf(furnitureId);
    if (idx === -1) return false;
    this.inventory.splice(idx, 1);

    // Place on grid
    for (let r = row; r < row + catalog.size.h; r++) {
      for (let c = col; c < col + catalog.size.w; c++) {
        this.placedFurniture[r + ',' + c] = furnitureId;
      }
    }

    // Store origin cell for easy removal
    this.placedFurniture[row + ',' + col + '_origin'] = furnitureId;

    this.saveToConfig();
    if (this.onFurnitureChange) this.onFurnitureChange();
    return true;
  }

  removeFurniture(row, col) {
    const key = row + ',' + col;
    const furnitureId = this.placedFurniture[key];
    if (!furnitureId) return false;

    // Remove all cells of this furniture
    for (let r = 0; r < ROOM_GRID_ROWS; r++) {
      for (let c = 0; c < ROOM_GRID_COLS; c++) {
        if (this.placedFurniture[r + ',' + c] === furnitureId) {
          delete this.placedFurniture[r + ',' + c];
        }
      }
    }

    // Find and remove the correct origin marker
    for (const k of Object.keys(this.placedFurniture)) {
      if (k.endsWith('_origin') && this.placedFurniture[k] === furnitureId) {
        delete this.placedFurniture[k];
        break;
      }
    }

    this.inventory.push(furnitureId);
    this.saveToConfig();
    if (this.onFurnitureChange) this.onFurnitureChange();
    return true;
  }

  getPlacedFurnitureList() {
    const result = [];
    const seen = new Set();
    for (const key of Object.keys(this.placedFurniture)) {
      if (key.endsWith('_origin')) continue;
      const furnitureId = this.placedFurniture[key];
      if (seen.has(furnitureId)) continue;
      seen.add(furnitureId);
      const [row, col] = key.split(',').map(Number);
      result.push({ id: furnitureId, row, col, catalog: FURNITURE_CATALOG[furnitureId] });
    }
    return result;
  }

  getInventory() {
    return this.inventory.map(id => ({ id, catalog: FURNITURE_CATALOG[id] })).filter(f => f.catalog);
  }

  getTotalHappiness() {
    let total = 0;
    const seen = new Set();
    for (const key of Object.keys(this.placedFurniture)) {
      if (key.endsWith('_origin')) continue;
      const fid = this.placedFurniture[key];
      if (seen.has(fid)) continue;
      seen.add(fid);
      total += FURNITURE_CATALOG[fid].happinessBonus || 0;
    }
    return total;
  }

  getTotalComfort() {
    let total = 0;
    const seen = new Set();
    for (const key of Object.keys(this.placedFurniture)) {
      if (key.endsWith('_origin')) continue;
      const fid = this.placedFurniture[key];
      if (seen.has(fid)) continue;
      seen.add(fid);
      total += FURNITURE_CATALOG[fid].comfortBonus || 0;
    }
    return total;
  }

  setPetAtHome(atHome) {
    this.petAtHome = atHome;
    if (atHome) {
      this.petGridPos = { row: 2, col: 2 }; // near center, visible in canvas
      if (this.onPetEnterHome) this.onPetEnterHome();
    } else {
      this.petGridPos = null;
      if (this.onPetLeaveHome) this.onPetLeaveHome();
    }
  }

  isPetAtHome() { return this.petAtHome; }

  // Get serializable state
  getState() {
    return {
      coins: this.coins,
      inventory: this.inventory,
      placedFurniture: this.placedFurniture,
      petAtHome: this.petAtHome,
      happiness: this.getTotalHappiness(),
      comfort: this.getTotalComfort(),
    };
  }
}
