/**
 * Interaction System - Handles pet/feed/click/scare detection
 */

class InteractionManager {
  constructor(callbacks) {
    this.isMouseDown = false;
    this.mouseDownPos = { x: 0, y: 0 };
    this.mouseDownTime = 0;
    this.lastMouseMoveTime = 0;
    this.mouseSpeed = 0;
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.lastScreenX = 0;
    this.lastScreenY = 0;
    this.isDragging = false;
    this.isWindowDragging = false;
    this.petDetectionThreshold = 5;
    this.petTimeThreshold = 200;
    this.scareSpeedThreshold = 800;
    this.isInsidePet = false;
    this.callbacks = callbacks;
    this.setupListeners();
  }

  setupListeners() {
    document.addEventListener('mousedown', (e) => this.onMouseDown(e));
    document.addEventListener('mouseup', (e) => this.onMouseUp(e));
    document.addEventListener('mousemove', (e) => this.onMouseMove(e));
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.callbacks.onRightClick();
    });
  }

  onMouseDown(e) {
    this.isMouseDown = true;
    this.isDragging = false;
    this.isWindowDragging = false;
    this.mouseDownPos = { x: e.clientX, y: e.clientY };
    this.mouseDownTime = Date.now();
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.lastScreenX = e.screenX;
    this.lastScreenY = e.screenY;
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('pet:toggle-penetrate', false);
  }

  onMouseUp(e) {
    if (!this.isMouseDown) return;

    const duration = Date.now() - this.mouseDownTime;
    const dx = e.clientX - this.mouseDownPos.x;
    const dy = e.clientY - this.mouseDownPos.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // If the mouse barely moved, treat it as a click (dance) even if
    // window-drag was flagged mid-move.
    const wasActuallyClick = dist < 20 && duration < 400;

    if (this.isWindowDragging && !wasActuallyClick) {
      // Real drag ended - sync position to state machine
      const { ipcRenderer } = require('electron');
      ipcRenderer.send('pet:get-position');
    } else if (this.isDragging && dist > this.petDetectionThreshold && duration > this.petTimeThreshold) {
      // 抚摸：在宠物区域内拖�?
      if (this.isInsidePet) {
        // console.log(...);
        this.callbacks.onPet();
      }
    } else {
      // 点击：只有在宠物区域内才触发跳舞
      if (this.isInsidePet) {
        // console.log(...);
        this.callbacks.onClick();
      } else {
        // console.log(...);
      }
    }

    this.isMouseDown = false;
    this.isDragging = false;
    this.isWindowDragging = false;
    const { ipcRenderer } = require('electron');
    ipcRenderer.send('pet:toggle-penetrate', true);
  }

  onMouseMove(e) {
    const now = Date.now();
    const dt = now - this.lastMouseMoveTime;

    if (dt > 0) {
      const dx = e.clientX - this.lastMouseX;
      const dy = e.clientY - this.lastMouseY;
      this.mouseSpeed = Math.sqrt(dx * dx + dy * dy) / (dt / 1000);
    }

    if (this.isMouseDown) {
      const totalDx = e.clientX - this.mouseDownPos.x;
      const totalDy = e.clientY - this.mouseDownPos.y;
      const totalDist = Math.sqrt(totalDx * totalDx + totalDy * totalDy);

      if (!this.isWindowDragging && totalDist > 20) {
        this.isWindowDragging = true;
        if (this.callbacks.onDragStart) this.callbacks.onDragStart();
      }

      if (this.isWindowDragging) {
        const moveDx = e.screenX - this.lastScreenX;
        const moveDy = e.screenY - this.lastScreenY;
        const { ipcRenderer } = require('electron');
        ipcRenderer.send('pet:move-by', moveDx, moveDy);
      } else if (totalDist > this.petDetectionThreshold) {
        this.isDragging = true;
      }
    }

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.lastScreenX = e.screenX;
    this.lastScreenY = e.screenY;
    this.lastMouseMoveTime = now;

    if (this.mouseSpeed > this.scareSpeedThreshold && this.isInsidePet) {
      this.callbacks.onScare();
    }
  }

  setInsidePet(inside) {
    this.isInsidePet = inside;
  }

  getMouseSpeed() {
    return this.mouseSpeed;
  }
}

/**
 * Feed System - Drag food items onto the pet
 */
class FeedManager {
  constructor(callbacks) {
    this.isFeedMode = false;
    this.feedElement = null;
    this.callbacks = callbacks || {};
    this.createFeedUI();
    this.setupFeedListeners();
  }

  createFeedUI() {
    this.feedElement = document.createElement('div');
    this.feedElement.id = 'feed-panel';
    this.feedElement.innerHTML = `
      <div class="food-item" data-food="seed" draggable="true" title="种子">🌻</div>
      <div class="food-item" data-food="carrot" draggable="true" title="胡萝�?>🥕</div>
      <div class="food-item" data-food="cheese" draggable="true" title="奶酪">🧀</div>
    `;
    this.feedElement.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: none;
      gap: 8px;
      background: rgba(255,255,255,0.9);
      padding: 6px 10px;
      border-radius: 20px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.15);
      z-index: 20;
    `;
    document.body.appendChild(this.feedElement);
  }

  setupFeedListeners() {
    if (!this.feedElement) return;

    this.feedElement.querySelectorAll('.food-item').forEach((item) => {
      item.addEventListener('click', () => this.selectFood(item.dataset.food));
      item.addEventListener('dragstart', (event) => {
        event.dataTransfer.setData('text/plain', item.dataset.food);
        event.dataTransfer.effectAllowed = 'copy';
      });
    });

    document.addEventListener('dragover', (event) => {
      if (!this.isFeedMode) return;
      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'copy';
      }
    });

    document.addEventListener('drop', (event) => {
      if (!this.isFeedMode) return;
      event.preventDefault();
      const canvas = document.getElementById('canvas');
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const insidePetWindow = event.clientX >= rect.left && event.clientX <= rect.right
        && event.clientY >= rect.top && event.clientY <= rect.bottom;
      if (insidePetWindow) {
        this.selectFood(event.dataTransfer ? event.dataTransfer.getData('text/plain') : '');
      }
    });
  }

  selectFood(foodType) {
    if (!foodType) return;
    this.isFeedMode = false;
    if (this.feedElement) {
      this.feedElement.style.display = 'none';
    }
    if (this.callbacks.onFeed) {
      this.callbacks.onFeed(foodType);
    }
  }

  toggleFeedMode() {
    this.isFeedMode = !this.isFeedMode;
    if (this.feedElement) {
      this.feedElement.style.display = this.isFeedMode ? 'flex' : 'none';
    }
    return this.isFeedMode;
  }

  isFeeding() {
    return this.isFeedMode;
  }
}
