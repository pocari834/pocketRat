// @ts-nocheck - electron-store 类型定义不完整，跳过类型检查
import Store from 'electron-store';

const defaults: Record<string, unknown> = {
  alwaysOnTop: true,
  clickThrough: true,
  semiTransparent: false,
  hideOnEdge: true,
  autoStart: false,
  currentRatName: '灰灰',
  currentRatColor: '#A0A0A0',
  focusMode: false,
  restReminder: true,
  drinkReminder: true,
  nightCompanion: true,
  restIntervalMinutes: 45,
  drinkIntervalMinutes: 120,
  volume: 0.7,
  petStatsHunger: 100,
  petStatsMood: 100,
  petStatsEnergy: 100,
  petStatsLastSaveTime: 0,
};

export class AppStore {
  private store: any;

  constructor() {
    this.store = new Store({
      defaults,
      name: 'pocket-rat-config',
    });
  }

  get(key: string): unknown {
    return this.store.get(key);
  }

  set(key: string, value: unknown): void {
    this.store.set(key, value);
  }

  setMultiple(data: Record<string, unknown>): void {
    this.store.set(data);
  }


  getPetStats(): Record<string, unknown> {
    return {
      hunger: this.store.get('petStatsHunger'),
      mood: this.store.get('petStatsMood'),
      energy: this.store.get('petStatsEnergy'),
      lastSaveTime: this.store.get('petStatsLastSaveTime'),
    };
  }

  setPetStats(hunger: number, mood: number, energy: number, lastSaveTime: number): void {
    this.store.set('petStatsHunger', hunger);
    this.store.set('petStatsMood', mood);
    this.store.set('petStatsEnergy', energy);
    this.store.set('petStatsLastSaveTime', lastSaveTime);
  }
  getAll(): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    for (const key of Object.keys(defaults)) {
      result[key] = this.store.get(key);
    }
    return result;
  }
}

export const createStore = (): AppStore => new AppStore();
