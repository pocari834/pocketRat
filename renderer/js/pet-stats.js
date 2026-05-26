/**
 * Pet Stats System - hunger, mood, energy
 * Drives behavior weighting and persistence
 */

var STAT_THRESHOLD = 30;

class PetStats {
  constructor() {
    this.hunger = 100;
    this.mood = 100;
    this.energy = 100;
    this.lastSaveTime = Date.now();

    this.decayRates = {
      hunger: 0.05,
      mood: 0.03,
      energy: 0.02,
    };

    this.sleepRecovery = 1.0;
  }

  update(deltaMs, currentState) {
    var deltaSec = deltaMs / 1000;

    this.hunger = Math.max(0, this.hunger - this.decayRates.hunger * deltaSec);
    this.mood = Math.max(0, this.mood - this.decayRates.mood * deltaSec);

    if (currentState === 'sleep') {
      this.energy = Math.min(100, this.energy + this.sleepRecovery * deltaSec);
    } else {
      this.energy = Math.max(0, this.energy - this.decayRates.energy * deltaSec);
    }
  }

  modifyHunger(amount) {
    this.hunger = Math.min(100, Math.max(0, this.hunger + amount));
  }

  modifyMood(amount) {
    this.mood = Math.min(100, Math.max(0, this.mood + amount));
  }

  modifyEnergy(amount) {
    this.energy = Math.min(100, Math.max(0, this.energy + amount));
  }

  getWeightModifiers() {
    var mods = {};

    if (this.hunger < STAT_THRESHOLD) {
      mods.chew = (mods.chew || 1) * 3.0;
    }
    if (this.mood < STAT_THRESHOLD) {
      mods.stand = (mods.stand || 1) * 2.0;
      mods.idle = (mods.idle || 1) * 0.5;
    }
    if (this.energy < STAT_THRESHOLD) {
      mods.sleep = (mods.sleep || 1) * 3.0;
      mods.walk = (mods.walk || 1) * 0.3;
      mods.follow = (mods.follow || 1) * 0.3;
    }

    return mods;
  }

  getCriticalAlert() {
    if (this.hunger < STAT_THRESHOLD) return '好饿…';
    if (this.energy < STAT_THRESHOLD) return '好困…';
    return null;
  }

  save() {
    try {
      var ipcRenderer = require('electron').ipcRenderer;
      ipcRenderer.send('pet-stats:save', {
        hunger: this.hunger,
        mood: this.mood,
        energy: this.energy,
        lastSaveTime: Date.now(),
      });
    } catch (e) {
      console.log('[PetStats] Save skipped (IPC not available)');
    }
  }

  async load() {
    try {
      var ipcRenderer = require('electron').ipcRenderer;
      var data = await ipcRenderer.invoke('pet-stats:load');
      if (data && data.hunger !== undefined) {
        var offlineMs = Date.now() - (data.lastSaveTime || Date.now());
        var offlineSec = offlineMs / 1000;

        this.hunger = Math.max(0, data.hunger - this.decayRates.hunger * offlineSec);
        this.mood = Math.max(0, data.mood - this.decayRates.mood * offlineSec);
        this.energy = Math.max(0, data.energy - this.decayRates.energy * offlineSec);
        this.lastSaveTime = data.lastSaveTime;
      }
    } catch (e) {
      console.log('[PetStats] Load skipped (main process not ready)');
    }
  }
}
