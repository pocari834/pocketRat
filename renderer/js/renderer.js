/**
 * Pet Renderer - Pixel art style pet visualization
 * Draws a cute pixel rat directly with Canvas, no external image files needed
 */

let ratColor = '#A0A0A0';

function setRatColor(color) {
  ratColor = color;
}

// ---- Load rat image ----
const ratImage = new Image();
let ratImageLoaded = false;
ratImage.src = './assets/rat.png';
ratImage.onload = () => { ratImageLoaded = true; };
ratImage.onerror = () => { console.error('Failed to load rat.png'); };

// ---- Dance video ----
const danceVideo = document.getElementById('dance-video');
let danceVideoLoaded = false;
if (danceVideo) {
  // Use the existing video file name with cache busting
  danceVideo.src = './assets/5b58a71a282cefa8334e5dc34d82f187_raw.mp4?t=' + Date.now();
  danceVideo.muted = true; // Required for autoplay in some browsers
  danceVideo.load();
  danceVideo.onloadeddata = () => { 
    danceVideoLoaded = true; 
    console.log('[Renderer] Dance video loaded, duration:', danceVideo.duration);
  };
  danceVideo.onerror = (e) => { 
    console.error('[Renderer] Failed to load dance video:', danceVideo.src, e); 
    console.error('[Renderer] Video error details:', danceVideo.error);
  };
  danceVideo.oncanplay = () => {
    console.log('[Renderer] Dance video can play');
  };
}

function playDanceVideo() {
  console.log('[Renderer] playDanceVideo called, video loaded:', danceVideoLoaded);
  if (!danceVideo) {
    console.error('[Renderer] Dance video element not found');
    return;
  }
  
  // Try to play even if not loaded, maybe it will load now
  danceVideo.currentTime = 0;
  danceVideo.style.display = 'block';
  
  const playPromise = danceVideo.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => {
      console.error('[Renderer] Video play failed:', e);
      // Fallback: try again with user gesture simulation
      setTimeout(() => {
        danceVideo.play().catch(e2 => console.error('[Renderer] Retry failed:', e2));
      }, 100);
    });
  }
  
  // If video hasn't loaded yet, log it
  if (!danceVideoLoaded) {
    console.warn('[Renderer] Video not fully loaded, attempting to play anyway');
  }
}

function stopDanceVideo() {
  if (danceVideo) {
    danceVideo.pause();
    danceVideo.style.display = 'none';
  }
}

let onDanceEndCallback = null;
if (danceVideo) {
  danceVideo.addEventListener('ended', () => {
    stopDanceVideo();
    if (onDanceEndCallback) onDanceEndCallback();
  });
}

function setOnDanceEnd(callback) {
  onDanceEndCallback = callback;
}

// ---- Pixel art rat drawing ----
function drawRat(state, frame, direction) {
  direction = direction || 1;
  const canvas = document.getElementById('canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, 200, 200);

  if (state === 'dance') {
    // Video is playing on top, just show a small hint
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('🎵', 100, 20);
    ctx.textAlign = 'left';
    return;
  }

  ctx.save();

  // Flip for direction
  if (direction === -1) {
    ctx.translate(200, 0);
    ctx.scale(-1, 1);
  }

  // Breathing animation
  const breathe = state === 'sleep' ? Math.sin(frame * 0.05) * 3 : Math.sin(frame * 0.08) * 1.5;
  // Walking bob
  const walkBob = (state === 'walk' || state === 'follow' || state === 'tunnel')
    ? Math.sin(frame * 0.3) * 3 : 0;

  const ox = 100; // center x
  const oy = 110 + breathe + walkBob; // center y (body center)

  if (ratImageLoaded) {
    const size = 150;
    ctx.drawImage(ratImage, ox - size / 2, oy - size / 2 + 5, size, size);
  } else {
  // ====== TAIL ======
  ctx.strokeStyle = '#B0B0B0';
  ctx.lineWidth = 4;
  ctx.lineCap = 'round';
  const tailWag = Math.sin(frame * 0.12) * 8;
  ctx.beginPath();
  ctx.moveTo(ox - 40, oy - 5);
  ctx.quadraticCurveTo(ox - 58, oy - 20 + tailWag, ox - 68, oy - 30 + tailWag);
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(ox - 68, oy - 30 + tailWag);
  ctx.quadraticCurveTo(ox - 72, oy - 40 + tailWag, ox - 65, oy - 42 + tailWag);
  ctx.stroke();

  // ====== BACK LEGS ======
  const legAnim = (state === 'walk' || state === 'follow' || state === 'tunnel')
    ? Math.sin(frame * 0.3) * 6 : 0;
  ctx.fillStyle = '#909090';
  // Back left leg
  drawRoundRect(ctx, ox - 28, oy + 18 - legAnim, 14, 16, 5);
  ctx.fill();
  // Back right leg
  drawRoundRect(ctx, ox - 5, oy + 18 + legAnim, 14, 16, 5);
  ctx.fill();

  // ====== BODY ======
  ctx.fillStyle = '#B8B8B8';
  drawRoundRect(ctx, ox - 38, oy - 22, 65, 44, 18);
  ctx.fill();

  // Belly
  ctx.fillStyle = '#D9D9D9';
  drawRoundRect(ctx, ox - 24, oy - 10, 40, 26, 12);
  ctx.fill();

  // ====== FRONT LEGS ======
  const frontLegAnim = (state === 'walk' || state === 'follow' || state === 'tunnel')
    ? Math.sin(frame * 0.3) * 5 : 0;
  ctx.fillStyle = '#A0A0A0';
  // Front left leg
  drawRoundRect(ctx, ox - 28, oy + 16 + frontLegAnim, 12, 18, 5);
  ctx.fill();
  // Front right leg
  drawRoundRect(ctx, ox + 8, oy + 16 - frontLegAnim, 12, 18, 5);
  ctx.fill();

  // Paws
  ctx.fillStyle = '#FFCCCC';
  ctx.beginPath();
  ctx.ellipse(ox - 22, oy + 34 + frontLegAnim, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ox + 14, oy + 34 - frontLegAnim, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ====== HEAD ======
  ctx.fillStyle = '#B8B8B8';
  ctx.beginPath();
  ctx.ellipse(ox + 15, oy - 28, 24, 22, 0.1, 0, Math.PI * 2);
  ctx.fill();

  // ====== EARS ======
  // Left ear
  ctx.fillStyle = '#A0A0A0';
  ctx.beginPath();
  ctx.ellipse(ox + 4, oy - 50, 10, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.ellipse(ox + 4, oy - 49, 6, 9, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Right ear
  ctx.fillStyle = '#A0A0A0';
  ctx.beginPath();
  ctx.ellipse(ox + 28, oy - 48, 10, 14, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#FFB6C1';
  ctx.beginPath();
  ctx.ellipse(ox + 28, oy - 47, 6, 9, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // ====== EYES ======
  if (state === 'sleep') {
    // Closed eyes - curved lines
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(ox + 8, oy - 30, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(ox + 22, oy - 30, 4, 0.2, Math.PI - 0.2);
    ctx.stroke();
  } else {
    // Open eyes - big cute pixel eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(ox + 8, oy - 30, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ox + 22, oy - 30, 5, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Eye highlights
    ctx.fillStyle = '#FFF';
    ctx.beginPath();
    ctx.arc(ox + 10, oy - 32, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox + 24, oy - 32, 2, 0, Math.PI * 2);
    ctx.fill();

    // Blink every few seconds
    if (Math.floor(frame / 120) % 8 === 0 && frame % 120 < 6) {
      ctx.fillStyle = '#B8B8B8';
      ctx.beginPath();
      ctx.ellipse(ox + 8, oy - 30, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(ox + 22, oy - 30, 6, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ox + 8, oy - 30, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox + 22, oy - 30, 4, 0.2, Math.PI - 0.2);
      ctx.stroke();
    }

    // Happy eyes when pet/stroked
    if (state === 'groom' || state === 'chew') {
      ctx.fillStyle = '#222';
      // Happy squint
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(ox + 8, oy - 29, 5, Math.PI + 0.3, -0.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(ox + 22, oy - 29, 5, Math.PI + 0.3, -0.3);
      ctx.stroke();
    }
  }

  // ====== NOSE ======
  ctx.fillStyle = '#FF9999';
  ctx.beginPath();
  ctx.ellipse(ox + 36, oy - 26, 4, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // ====== MOUTH ======
  if (state === 'chew') {
    const mouthOpen = Math.abs(Math.sin(frame * 0.4)) * 4;
    ctx.fillStyle = '#CC6666';
    ctx.beginPath();
    ctx.ellipse(ox + 30, oy - 18, 5, mouthOpen, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.strokeStyle = '#888';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ox + 30, oy - 20);
    ctx.quadraticCurveTo(ox + 34, oy - 16, ox + 30, oy - 15);
    ctx.stroke();
  }

  // ====== WHISKERS ======
  ctx.strokeStyle = '#999';
  ctx.lineWidth = 1;
  const whiskerWiggle = Math.sin(frame * 0.1) * 2;
  // Top whiskers
  ctx.beginPath();
  ctx.moveTo(ox + 34, oy - 24);
  ctx.lineTo(ox + 52, oy - 30 + whiskerWiggle);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(ox + 34, oy - 22);
  ctx.lineTo(ox + 54, oy - 22 + whiskerWiggle);
  ctx.stroke();
  // Bottom whiskers
  ctx.beginPath();
  ctx.moveTo(ox + 34, oy - 20);
  ctx.lineTo(ox + 50, oy - 14 - whiskerWiggle);
  ctx.stroke();

  // ====== CHEEKS (blush) ======
  ctx.fillStyle = 'rgba(255,182,193,0.35)';
  ctx.beginPath();
  ctx.ellipse(ox + 2, oy - 20, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(ox + 28, oy - 20, 8, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  }

  // ====== STAND STATE (rearing up) ======
  // Extra visual handled by overlays below

  // ====== State overlays ======
  if (state === 'sleep') {
    // Zzz bubbles
    ctx.fillStyle = '#87CEEB';
    ctx.font = 'bold 16px sans-serif';
    const zy = 55 + Math.sin(frame * 0.05) * 3;
    ctx.fillText('Z', 135, zy);
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('z', 148, zy - 10);
    ctx.font = 'bold 9px sans-serif';
    ctx.fillText('z', 157, zy - 18);

    // Sleep blush
    ctx.fillStyle = 'rgba(255,150,150,0.3)';
    ctx.beginPath();
    ctx.ellipse(ox + 5, oy - 18, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(ox + 27, oy - 18, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state === 'stand') {
    drawExclamation(ctx, ox + 20, oy - 62, frame);
  }

  if (state === 'scare') {
    drawScareEffect(ctx, frame);
  }

  if (state === 'chew') {
    // Crumb particles
    ctx.fillStyle = '#8D6E63';
    const chewOffset = Math.sin(frame * 0.4) * 2;
    ctx.beginPath();
    ctx.arc(ox + 42, oy - 18 + chewOffset, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(ox + 46, oy - 14 - chewOffset, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state === 'groom') {
    // Little sparkle near head
    const sparkX = ox + 5 + Math.sin(frame * 0.2) * 5;
    const sparkY = oy - 48 + Math.cos(frame * 0.2) * 3;
    ctx.fillStyle = '#FFD700';
    ctx.font = '12px sans-serif';
    ctx.fillText('✨', sparkX, sparkY);
  }

  ctx.restore();
}

// Helper: rounded rectangle
function drawRoundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
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

function drawExclamation(ctx, x, y, frame) {
  const bobble = Math.sin(frame * 0.15) * 3;
  ctx.fillStyle = '#FFD700';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('!', x, y + bobble);
}

function drawScareEffect(ctx, frame) {
  ctx.strokeStyle = '#AAA';
  ctx.lineWidth = 2;
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const angle = (i / spikes) * Math.PI * 2;
    const wiggle = Math.sin(frame * 0.3 + i) * 3;
    const cx = 100 + Math.cos(angle) * 65;
    const cy = 100 + Math.sin(angle) * 65;
    const ex = 100 + Math.cos(angle) * (80 + wiggle);
    const ey = 100 + Math.sin(angle) * (80 + wiggle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(ex, ey);
    ctx.stroke();
  }
}

// ---- Speech bubble ----
function showBubble(text, duration) {
  duration = duration || 3000;
  const bubble = document.getElementById('bubble');
  bubble.textContent = text;
  bubble.classList.add('show');
  setTimeout(() => {
    bubble.classList.remove('show');
  }, duration);
}

function hideBubble() {
  const bubble = document.getElementById('bubble');
  bubble.classList.remove('show');
}
