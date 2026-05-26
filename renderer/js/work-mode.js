/**
 * Work Efficiency Mode Manager
 * Modes: FOCUS, REST_REMINDER, DRINK_REMINDER, NIGHT_COMPANION
 */

const WorkMode = {
  NONE: 'none',
  FOCUS: 'focus',
  REST_REMINDER: 'rest_reminder',
  DRINK_REMINDER: 'drink_reminder',
  NIGHT_COMPANION: 'night_companion',
};

class WorkModeManager {
  constructor(config) {
    this.currentMode = WorkMode.NONE;
    this.config = Object.assign({
      restIntervalMinutes: 45,
      drinkIntervalMinutes: 120,
      nightStartHour: 23,
      nightEndHour: 6,
      focusIdleThresholdMs: 5 * 60 * 1000,
    }, config || {});
    this.lastActivityTime = Date.now();
    this.lastRestReminderTime = Date.now();
    this.lastDrinkReminderTime = Date.now();
    this.focusCheckInterval = null;
    this.onModeChange = null;
    this.onReminder = null;
    this.onNotify = null;
  }

  setCallbacks(onModeChange, onReminder, onNotify) {
    this.onModeChange = onModeChange;
    this.onReminder = onReminder;
    this.onNotify = onNotify;
  }

  updateConfig(config) {
    Object.assign(this.config, config);
  }

  recordActivity() {
    this.lastActivityTime = Date.now();
    if (this.currentMode === WorkMode.FOCUS) return;
    if (this.currentMode === WorkMode.REST_REMINDER) {
      this.lastRestReminderTime = Date.now();
      this.setMode(WorkMode.NONE);
    }
    if (this.currentMode === WorkMode.DRINK_REMINDER) {
      this.lastDrinkReminderTime = Date.now();
      this.setMode(WorkMode.NONE);
    }
  }

  startMonitoring() {
    this.focusCheckInterval = setInterval(() => this.tick(), 30000);
  }

  stopMonitoring() {
    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }
  }

  tick() {
    const now = Date.now();
    const idleTime = now - this.lastActivityTime;
    const hour = new Date().getHours();

    if (hour >= this.config.nightStartHour || hour < this.config.nightEndHour) {
      if (this.currentMode !== WorkMode.NIGHT_COMPANION && idleTime > this.config.focusIdleThresholdMs) {
        this.setMode(WorkMode.NIGHT_COMPANION);
        if (this.onReminder) this.onReminder('夜深了，该休息了 🌙');
        if (this.onNotify) this.onNotify('Pocket Rat', '鼠宝打瞌睡了，你也该休息啦~');
        return;
      }
    } else if (this.currentMode === WorkMode.NIGHT_COMPANION) {
      this.setMode(WorkMode.NONE);
      return;
    }

    const drinkElapsed = now - this.lastDrinkReminderTime;
    if (drinkElapsed > this.config.drinkIntervalMinutes * 60 * 1000) {
      this.setMode(WorkMode.DRINK_REMINDER);
      if (this.onReminder) this.onReminder('该喝水啦！💧');
      if (this.onNotify) this.onNotify('Pocket Rat', '鼠宝叼着水杯来提醒你喝水~');
      return;
    }

    const restElapsed = now - this.lastRestReminderTime;
    if (restElapsed > this.config.restIntervalMinutes * 60 * 1000) {
      this.setMode(WorkMode.REST_REMINDER);
      if (this.onReminder) this.onReminder('陪我玩一下嘛 🥺');
      if (this.onNotify) this.onNotify('Pocket Rat', '你已经工作很久了，休息一下吧！');
      return;
    }

    if (idleTime < 10000 && this.currentMode === WorkMode.NONE) {
      this.setMode(WorkMode.FOCUS);
      return;
    }

    if (idleTime > this.config.focusIdleThresholdMs && this.currentMode === WorkMode.FOCUS) {
      this.setMode(WorkMode.NONE);
    }
  }

  dismissReminder() {
    if (this.currentMode === WorkMode.REST_REMINDER) {
      this.lastRestReminderTime = Date.now();
      this.setMode(WorkMode.NONE);
    }
    if (this.currentMode === WorkMode.DRINK_REMINDER) {
      this.lastDrinkReminderTime = Date.now();
      this.setMode(WorkMode.NONE);
    }
  }

  getMode() {
    return this.currentMode;
  }

  setMode(mode) {
    if (this.currentMode === mode) return;
    this.currentMode = mode;
    if (this.onModeChange) this.onModeChange(mode);
  }
}
