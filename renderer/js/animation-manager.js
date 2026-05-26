/**
 * Animation Manager for Pocket Rat
 * 支持 PNG 序列帧动画，符合美术需求文档规范
 */

class AnimationManager {
  constructor() {
    this.animations = new Map(); // 存储所有动画数据
    this.loaded = false;
    this.currentAnimation = null;
    this.currentFrame = 0;
    this.accumulatedTime = 0;
    this.animationCompleteCallback = null;
  }

  /**
   * 初始化动画管理器
   * @param {Array} animationConfigs 动画配置数组
   */
  async init(animationConfigs = []) {
    console.log('[Animation] Initializing animation manager');
    
    // 默认动画配置
    const defaultConfigs = [
      // 待机动画（呼吸）
      {
        name: 'idle',
        frames: 6,
        frameRate: 8, // 8 fps 适合呼吸动画
        loop: true,
        path: './assets/animations/idle/idle_l_{frame}.png'
      },
      // 走路动画
      {
        name: 'walk',
        frames: 8,
        frameRate: 12,
        loop: true,
        path: './assets/animations/walk/walk_l_{frame}.png'
      },
      // 跳舞动画（特殊动作）
      {
        name: 'dance',
        frames: 12,
        frameRate: 15,
        loop: false,
        path: './assets/animations/dance/dance_l_{frame}.png'
      },
      // 睡觉动画
      {
        name: 'sleep',
        frames: 8,
        frameRate: 6, // 慢速呼吸
        loop: true,
        path: './assets/animations/sleep/sleep_l_{frame}.png'
      },
      // 吃东西动画
      {
        name: 'eat',
        frames: 6,
        frameRate: 10,
        loop: false,
        path: './assets/animations/eat/eat_l_{frame}.png'
      }
    ];

    const configs = animationConfigs.length > 0 ? animationConfigs : defaultConfigs;
    
    // 预加载所有动画
    const loadPromises = configs.map(config => this.loadAnimation(config));
    
    try {
      await Promise.all(loadPromises);
      this.loaded = true;
      console.log('[Animation] All animations loaded successfully');
    } catch (error) {
      console.error('[Animation] Failed to load animations:', error);
    }
  }

  /**
   * 加载单个动画
   * @param {Object} config 动画配置
   */
  async loadAnimation(config) {
    const { name, frames, frameRate, loop, path } = config;
    
    console.log(`[Animation] Loading animation: ${name} (${frames} frames)`);
    
    const animation = {
      name,
      frames,
      frameRate,
      loop,
      images: [],
      loaded: false
    };

    // 加载所有帧
    const imagePromises = [];
    for (let i = 0; i < frames; i++) {
      const frameNumber = (i + 1).toString().padStart(2, '0');
      const imagePath = path.replace('{frame}', frameNumber);
      
      const promise = new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
          console.log(`[Animation] Loaded ${name} frame ${frameNumber}`);
          resolve(img);
        };
        img.onerror = () => {
          console.warn(`[Animation] Failed to load ${imagePath}`);
          // 创建一个占位图片
          const placeholder = this.createPlaceholderImage(frameNumber);
          resolve(placeholder);
        };
        img.src = imagePath;
      });
      
      imagePromises.push(promise);
    }

    try {
      animation.images = await Promise.all(imagePromises);
      animation.loaded = true;
      this.animations.set(name, animation);
      console.log(`[Animation] Animation ${name} loaded successfully`);
    } catch (error) {
      console.error(`[Animation] Failed to load animation ${name}:`, error);
    }
  }

  /**
   * 创建占位图片（当实际图片加载失败时）
   */
  createPlaceholderImage(frameNumber) {
    const canvas = document.createElement('canvas');
    canvas.width = 150;
    canvas.height = 150;
    const ctx = canvas.getContext('2d');
    
    // 绘制一个简单的占位符
    ctx.fillStyle = '#333';
    ctx.fillRect(0, 0, 150, 150);
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Frame ' + frameNumber, 75, 75);
    
    const img = new Image();
    img.src = canvas.toDataURL();
    return img;
  }

  /**
   * 播放动画
   * @param {string} name 动画名称
   * @param {Function} onComplete 动画完成回调
   * @returns {boolean} 是否成功开始播放
   */
  play(name, onComplete = null) {
    if (!this.loaded) {
      console.warn('[Animation] Animation manager not loaded yet');
      return false;
    }

    const animation = this.animations.get(name);
    if (!animation || !animation.loaded) {
      console.warn(`[Animation] Animation ${name} not found or not loaded`);
      return false;
    }

    // 如果已经是当前动画且正在播放中，不做任何操作
    if (this.currentAnimation === animation && this.currentFrame < animation.frames) {
      return true;
    }

    this.currentAnimation = animation;
    this.currentFrame = 0;
    this.accumulatedTime = 0;
    this.animationCompleteCallback = onComplete;
    
    console.log(`[Animation] Playing animation: ${name}`);
    return true;
  }

  /**
   * 停止当前动画
   */
  stop() {
    if (this.currentAnimation) {
      console.log(`[Animation] Stopping animation: ${this.currentAnimation.name}`);
    }
    this.currentAnimation = null;
    this.currentFrame = 0;
    this.accumulatedTime = 0;
    this.animationCompleteCallback = null;
  }

  /**
   * 更新动画状态
   * @param {number} deltaTime 毫秒时间差
   */
  update(deltaTime) {
    if (!this.currentAnimation) return;

    const animation = this.currentAnimation;
    const frameDuration = 1000 / animation.frameRate;
    
    this.accumulatedTime += deltaTime;
    
    // 检查是否需要切换到下一帧
    if (this.accumulatedTime >= frameDuration) {
      this.currentFrame++;
      this.accumulatedTime -= frameDuration;
      
      // 检查动画是否结束
      if (this.currentFrame >= animation.frames) {
        if (animation.loop) {
          this.currentFrame = 0; // 循环播放
        } else {
          // 动画完成
          this.currentFrame = animation.frames - 1; // 停留在最后一帧
          this.animationComplete();
        }
      }
    }
  }

  /**
   * 动画完成处理
   */
  animationComplete() {
    console.log(`[Animation] Animation ${this.currentAnimation.name} completed`);
    
    if (this.animationCompleteCallback) {
      this.animationCompleteCallback();
    }
    
    // 对于非循环动画，完成后停止
    if (!this.currentAnimation.loop) {
      this.stop();
    }
  }

  /**
   * 获取当前帧的图片
   * @returns {Image|null} 当前帧图片
   */
  getCurrentFrame() {
    if (!this.currentAnimation || !this.currentAnimation.loaded) {
      return null;
    }
    
    if (this.currentFrame < 0 || this.currentFrame >= this.currentAnimation.frames) {
      return null;
    }
    
    return this.currentAnimation.images[this.currentFrame];
  }

  /**
   * 获取当前动画信息
   */
  getCurrentAnimationInfo() {
    if (!this.currentAnimation) {
      return null;
    }
    
    return {
      name: this.currentAnimation.name,
      currentFrame: this.currentFrame,
      totalFrames: this.currentAnimation.frames,
      frameRate: this.currentAnimation.frameRate,
      isLooping: this.currentAnimation.loop,
      isPlaying: this.currentFrame < this.currentAnimation.frames
    };
  }

  /**
   * 检查动画是否正在播放
   */
  isPlaying(name = null) {
    if (!this.currentAnimation) return false;
    
    if (name) {
      return this.currentAnimation.name === name && this.currentFrame < this.currentAnimation.frames;
    }
    
    return this.currentFrame < this.currentAnimation.frames;
  }

  /**
   * 获取所有已加载的动画
   */
  getLoadedAnimations() {
    const loaded = [];
    for (const [name, animation] of this.animations) {
      if (animation.loaded) {
        loaded.push({
          name,
          frames: animation.frames,
          frameRate: animation.frameRate,
          loop: animation.loop
        });
      }
    }
    return loaded;
  }
}

// 创建全局实例
const animationManager = new AnimationManager();

// 导出供其他文件使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnimationManager, animationManager };
}