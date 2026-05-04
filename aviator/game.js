// ─── Constants ────────────────────────────────────────────────
const GOAL = 1_000_000;
const START = 1_000;
const HOUSE = 0.03;
const MULT_K = 0.00055; // multiplier = e^(K * elapsedMs)
const COUNTDOWN_SEC = 8;

// ─── Performance optimizations ─────────────────────────────────
// Mobile detection and performance tuning
const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
const UI_UPDATE_INTERVAL = isMobile ? 150 : 50; // Update UI less frequently on mobile
const MAX_PATH_POINTS = isMobile ? 50 : 100; // Limit path points on mobile
const CANVAS_SCALE = isMobile ? Math.min(devicePixelRatio, 2) : devicePixelRatio; // Cap DPR on mobile

// Disable heavy animations on low-end devices (older Android/iOS, low core count)
const isLowEndDevice = isMobile && (
  /Samsung|Android [4-6]|iPhone [6-8]|iPad [2-4]/i.test(navigator.userAgent) ||
  navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4
);

if (isLowEndDevice) {
  document.documentElement.style.setProperty('--animation-duration', '0s');
}

// ─── State ────────────────────────────────────────────────────
let balance = START;
let state = 'waiting'; // 'waiting' | 'flying' | 'crashed'
let crashPoint = 2;
let currentMult = 1;
let betPlaced = false;
let betAmt = 0;
let cashedOut = false;
let history = [];
let pathPts = [];
let flyStart = 0;
let raf = null;
let cdTimer = null;
let viewMaxMs = 10000;

// ─── Canvas ───────────────────────────────────────────────────
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

function resize() {
  const w = canvas.parentElement;
  const scale = CANVAS_SCALE;
  canvas.width = w.clientWidth * scale;
  canvas.height = w.clientHeight * scale;
  canvas.style.width = w.clientWidth + 'px';
  canvas.style.height = w.clientHeight + 'px';
  ctx.scale(scale, scale);
}
resize();
window.addEventListener('resize', () => { resize(); draw(); });

const W = () => canvas.parentElement.clientWidth;
const H = () => canvas.parentElement.clientHeight;

// ─── Crash Generation ─────────────────────────────────────────
function genCrash() {
  const r = Math.random();
  if (r < 0.01) return 1.00;
  return Math.min(Math.max((1 - HOUSE) / (1 - r), 1.00), 500);
}

// ─── Multiplier ───────────────────────────────────────────────
function multAtMs(ms) {
  return Math.exp(MULT_K * ms);
}

// ─── Canvas drawing ───────────────────────────────────────────
function multToXY(m, elapsed) {
  const w = W(), h = H();
  const ml = 8, mr = 24, mt = 16, mb = 18;
  const uw = w - ml - mr, uh = h - mt - mb;
  const x = ml + Math.min(elapsed / viewMaxMs, 1) * uw;
  const logM = Math.log(Math.max(m, 1)) / Math.log(Math.max(crashPoint * 1.2, 5));
  const y = (h - mb) - Math.min(logM, 1) * uh;
  return { x, y };
}

function draw() {
  const w = W(), h = H();
  ctx.clearRect(0, 0, w, h);

  ctx.fillStyle = '#1a0d0e';
  ctx.fillRect(0, 0, w, h);

  // Reduce grid complexity on mobile
  if (!isMobile) {
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    for (let x = w / 6; x < w; x += w / 6) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = h / 4; y < h; y += h / 4) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  }

  if (pathPts.length < 2) {
    ctx.beginPath();
    ctx.arc(16, h - 18, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,120,64,0.5)';
    ctx.fill();
    return;
  }

  const crashed = state === 'crashed';
  const lineColor = crashed ? '#ff2d4a' : '#ff7840';
  const glowColor = crashed ? 'rgba(255,45,74,.5)' : 'rgba(255,120,64,.45)';

  // Simplify gradient on mobile
  const grad = ctx.createLinearGradient(0, h, 0, 0);
  grad.addColorStop(0, crashed ? 'rgba(255,45,74,0)' : 'rgba(255,120,64,0)');
  grad.addColorStop(1, crashed ? 'rgba(255,45,74,.14)' : 'rgba(255,120,64,.12)');
  ctx.beginPath();
  ctx.moveTo(pathPts[0].x, h);
  for (const p of pathPts) ctx.lineTo(p.x, p.y);
  const last = pathPts[pathPts.length - 1];
  ctx.lineTo(last.x, h);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();

  // Reduce shadow blur on mobile
  const shadowBlur = isMobile ? 8 : 14;
  ctx.save();
  ctx.shadowBlur = shadowBlur;
  ctx.shadowColor = glowColor;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(pathPts[0].x, pathPts[0].y);
  for (let i = 1; i < pathPts.length; i++) ctx.lineTo(pathPts[i].x, pathPts[i].y);
  ctx.stroke();
  ctx.restore();

  if (pathPts.length >= 2) {
    const tip = pathPts[pathPts.length - 1];
    const prev = pathPts[Math.max(0, pathPts.length - 3)];
    ctx.save();
    ctx.translate(tip.x, tip.y);
    if (state === 'flying') {
      const ang = Math.atan2(tip.y - prev.y, tip.x - prev.x);
      ctx.rotate(ang);
      ctx.font = '20px serif';
      ctx.fillText('✈', -10, 7);
    } else if (state === 'crashed') {
      ctx.font = '24px serif';
      ctx.fillText('💥', -12, 10);
    }
    ctx.restore();
  }
}

// ─── Fixed 60 FPS game loop ──────────────────────────────────
// This implements a fixed timestep game loop that maintains 60 FPS
// independent of the display refresh rate. Game logic runs at fixed
// intervals while rendering can be called multiple times or skipped.
const TARGET_FPS = 60;
const FRAME_TIME = 1000 / TARGET_FPS; // ~16.67ms per frame
let lastFrameTime = 0;
let accumulatedTime = 0;

function startFlight() {
  state = 'flying';
  pathPts = [];
  flyStart = performance.now();
  viewMaxMs = Math.max(Math.log(crashPoint) / MULT_K * 1.25, 8000);
  updateUI();
  let lastRiseTime = 0;
  let lastUIUpdate = 0;
  lastFrameTime = performance.now();
  accumulatedTime = 0;

  function gameLoop(currentTime) {
    const deltaTime = currentTime - lastFrameTime;
    lastFrameTime = currentTime;
    accumulatedTime += deltaTime;

    // Prevent spiral of death - cap accumulated time
    if (accumulatedTime > FRAME_TIME * 5) {
      accumulatedTime = FRAME_TIME * 5;
    }

    // Update game logic at fixed 60 FPS
    while (accumulatedTime >= FRAME_TIME) {
      const elapsed = performance.now() - flyStart;
      currentMult = multAtMs(elapsed);

      // Auto cashout check
      if (document.getElementById('autoToggle').checked && betPlaced && !cashedOut) {
        const at = parseFloat(document.getElementById('autoCashVal').value) || 2;
        if (currentMult >= at) doCashOut();
      }

      // Check for crash
      if (currentMult >= crashPoint) {
        currentMult = crashPoint;
        pathPts.push(multToXY(currentMult, elapsed));
        state = 'crashed';
        draw();
        if (!isLowEndDevice) SFX.crash();
        onCrash();
        return;
      }

      // Sound effects (time-based, not frame-based)
      const riseInterval = isMobile ? 300 : 250;
      if (!isLowEndDevice && elapsed - lastRiseTime > riseInterval) {
        SFX.rise(currentMult);
        lastRiseTime = elapsed;
      }

      // Path points accumulation
      if (pathPts.length < MAX_PATH_POINTS || elapsed % 100 < 16) {
        pathPts.push(multToXY(currentMult, elapsed));
        if (pathPts.length > MAX_PATH_POINTS) {
          pathPts.shift();
        }
      }

      accumulatedTime -= FRAME_TIME;
    }

    // Render (can be called multiple times per logic update or skipped)
    draw();

    // UI updates (throttled)
    if (currentTime - lastUIUpdate > UI_UPDATE_INTERVAL) {
      updateMultDisplay();
      lastUIUpdate = currentTime;
    }

    // Continue loop if still flying
    if (state === 'flying') {
      raf = requestAnimationFrame(gameLoop);
    }
  }

  raf = requestAnimationFrame(gameLoop);
}

function onCrash() {
  history.unshift(+crashPoint.toFixed(2));
  if (history.length > 20) history.pop();
  updateHistoryUI();
  updateMultDisplay();
  updateUI();

  betPlaced = false;
  cashedOut = false;
  setTimeout(startCountdown, 1400);
}

// ─── Countdown ────────────────────────────────────────────────
function startCountdown() {
  // Check if game is over
  if (balance <= 0) {
    setTimeout(() => {
      if (!isLowEndDevice) SFX.gameOver(); // Skip game over sound on low-end devices
      show('gameOverOverlay');
    }, 600);
    return;
  }
  
  state = 'waiting';
  pathPts = [];
  let n = COUNTDOWN_SEC;
  document.getElementById('cdNum').textContent = n;
  document.getElementById('cdOverlay').classList.add('show');
  document.getElementById('multOverlay').style.visibility = 'hidden';
  updateUI();
  draw();

  // Use longer intervals on mobile for better performance
  const interval = isMobile ? 1200 : 1000;
  cdTimer = setInterval(() => {
    n--;
    if (n <= 0) {
      clearInterval(cdTimer);
      
      // If no bet was placed, auto-place default bet and start flight
      if (!betPlaced) {
        const amt = parseInt(document.getElementById('betAmount').value, 10);
        if (amt && amt >= 1 && amt <= balance) {
          betAmt = amt;
          balance -= betAmt;
          betPlaced = true;
          cashedOut = false;
          updateBalanceUI();
        }
      }
      
      document.getElementById('cdOverlay').classList.remove('show');
      document.getElementById('multOverlay').style.visibility = '';
      crashPoint = genCrash();
      currentMult = 1;
      viewMaxMs = Math.max(Math.log(crashPoint) / MULT_K * 1.25, 8000);
      startFlight();
    } else {
      // Reduce tick frequency on mobile and disable on low-end devices
      if (!isLowEndDevice && (!isMobile || n % 2 === 0)) {
        SFX.tick();
      }
      document.getElementById('cdNum').textContent = n;
    }
  }, interval);
}

// ─── Actions ──────────────────────────────────────────────────
function toggleMute() {
  const muted = SFX.toggleMute();
  const btn = document.getElementById('muteBtn');
  btn.textContent = muted ? '🔇' : '🔊';
  btn.classList.toggle('muted', muted);
}

function startGame() {
  document.getElementById('introOverlay').classList.remove('show');
  updateBalanceUI();
  draw();
  startCountdown();
}

function handleAction() {
  if (state === 'flying' && betPlaced && !cashedOut) {
    doCashOut();
  } else if (state === 'waiting' && !betPlaced) {
    doPlaceBet();
  }
}

function doPlaceBet() {
  const amt = parseInt(document.getElementById('betAmount').value, 10);
  if (!amt || amt < 1 || amt > balance) {
    shakeBet(); return;
  }
  betAmt = amt;
  balance -= betAmt;
  betPlaced = true;
  cashedOut = false;
  if (!isLowEndDevice) SFX.bet(); // Skip sound on low-end devices
  updateBalanceUI();
  updateUI();
  
  // Start flight immediately (don't wait for countdown)
  clearInterval(cdTimer);
  document.getElementById('cdOverlay').classList.remove('show');
  document.getElementById('multOverlay').style.visibility = '';
  crashPoint = genCrash();
  currentMult = 1;
  viewMaxMs = Math.max(Math.log(crashPoint) / MULT_K * 1.25, 8000);
  startFlight();
}

function doCashOut() {
  if (!betPlaced || cashedOut) return;
  cashedOut = true;
  const win = Math.floor(betAmt * currentMult);
  balance += win;
  if (!isLowEndDevice) SFX.cashout(); // Skip cashout sound on low-end devices
  updateBalanceUI();
  showToast(`+${fmt(win)} CR  @  ${currentMult.toFixed(2)}×`);
  updateUI();
  if (balance >= GOAL) {
    setTimeout(() => {
      if (!isLowEndDevice) SFX.bigWin(); // Skip big win sound on low-end devices
      show('winOverlay');
    }, 600);
  }
}

function shakeBet() {
  const el = document.getElementById('betAmount');
  el.classList.remove('shake');
  void el.offsetWidth;
  el.classList.add('shake');
  setTimeout(() => el.classList.remove('shake'), 400);
}

function quickBet(frac) {
  const amt = Math.max(1, Math.floor(balance * frac));
  document.getElementById('betAmount').value = amt;
}

// ─── UI ───────────────────────────────────────────────────────
function updateUI() {
  const btn = document.getElementById('actionBtn');
  const betInput = document.getElementById('betAmount');

  if (state === 'flying') {
    betInput.disabled = true;
    if (betPlaced && !cashedOut) {
      btn.className = 'state-cashout';
      btn.textContent = 'INCASSA';
    } else {
      btn.className = 'state-wait';
      btn.textContent = cashedOut ? 'INCASSATO ✓' : 'IN VOLO...';
    }
  } else if (state === 'waiting') {
    betInput.disabled = false;
    if (betPlaced) {
      btn.className = 'state-wait';
      btn.textContent = 'PUNTATA PIAZZATA ✓';
    } else {
      btn.className = 'state-bet';
      btn.textContent = 'SCOMMETTI';
    }
  } else if (state === 'crashed') {
    betInput.disabled = true;
    btn.className = 'state-wait';
    btn.textContent = 'VOLO TERMINATO';
  }
}

function updateMultDisplay() {
  const val = document.getElementById('multValue');
  const sub = document.getElementById('multSub');
  val.textContent = currentMult.toFixed(2) + '×';

  if (state === 'flying') {
    val.className = 'mult-value flying';
    if (betPlaced && !cashedOut) {
      sub.textContent = `${fmt(betAmt)} → ${fmt(Math.floor(betAmt * currentMult))} CR`;
    } else if (cashedOut) {
      sub.textContent = 'Incassato ✓';
    } else {
      sub.textContent = 'Volo in corso...';
    }
  } else if (state === 'crashed') {
    val.className = 'mult-value crashed';
    sub.textContent = '💥 Crashed!';
  } else {
    val.className = 'mult-value waiting';
    sub.textContent = 'In attesa...';
  }
}

function updateBalanceUI() {
  const balanceEl = document.getElementById('balanceDisplay');
  const pct = Math.min(balance / GOAL * 100, 100);
  const progressFill = document.getElementById('progressFill');
  const progressPct = document.getElementById('progressPct');

  balanceEl.textContent = fmt(balance);
  progressFill.style.width = Math.max(pct, 0.05) + '%';
  const pctStr = pct < 0.01 ? '<0,01%' : (pct < 1
    ? pct.toFixed(2).replace('.', ',') + '%'
    : pct.toFixed(1).replace('.', ',') + '%');
  progressPct.textContent = pctStr;
}

function updateHistoryUI() {
  document.getElementById('historyPills').innerHTML = history.map(cp => {
    const cls = cp < 1.5 ? 'low' : cp < 5 ? 'mid' : 'high';
    return `<span class="pill ${cls}">${cp.toFixed(2)}×</span>`;
  }).join('');
}

let toastTimer = null;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2400);
}

function show(id) {
  document.getElementById(id).classList.add('show');
}

function fmt(n) {
  return Math.floor(n).toLocaleString('it-IT');
}

// ─── Reset ────────────────────────────────────────────────────
function resetGame() {
  clearInterval(cdTimer);
  cancelAnimationFrame(raf);

  balance = START;
  state = 'waiting';
  betPlaced = false;
  cashedOut = false;
  currentMult = 1;
  pathPts = [];
  history = [];

  document.getElementById('gameOverOverlay').classList.remove('show');
  document.getElementById('winOverlay').classList.remove('show');
  document.getElementById('cdOverlay').classList.remove('show');
  document.getElementById('multOverlay').style.visibility = '';
  document.getElementById('betAmount').value = 50;
  document.getElementById('betAmount').disabled = false;
  document.getElementById('toast').classList.remove('show');

  updateBalanceUI();
  updateHistoryUI();
  updateMultDisplay();
  draw();
  startCountdown();
}

// ─── Init ─────────────────────────────────────────────────────
draw();
