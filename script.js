'use strict';
const W = 800, H = 450;
const $ = id => document.getElementById(id);
const cvs = $('gameCanvas');
const cx = cvs.getContext('2d');
cx.imageSmoothingEnabled = false;

/* ============ INPUT ============ */
const keys = {}, pressed = {};
window.addEventListener('keydown', e => {
  if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Enter'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) pressed[e.code] = true;
  keys[e.code] = true;
});
window.addEventListener('keyup', e => { keys[e.code] = false; });
window.addEventListener('blur', () => { for (const k in keys) keys[k] = false; });

/* ============ AUDIO (tiny synth, no files) ============ */
let AC = null, muted = false;
function sfx(f, d = 0.1, type = 'square', v = 0.04, slide = 0) {
  if (muted) return;
  try {
    AC = AC || new (window.AudioContext || window.webkitAudioContext)();
    const o = AC.createOscillator(), g = AC.createGain(), t = AC.currentTime;
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f + slide), t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(t + d);
  } catch (e) {}
}

/* ============ DRONE IMAGE UPLOAD (kept) ============ */
let activeDroneImage = null;
$('drone-sheet-input').addEventListener('change', e => {
  const file = e.target.files[0]; if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => { activeDroneImage = img; $('drone-upload-label').textContent = '✔ DRONE LOADED'; };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
});

/* ============ SPRITE ATLAS (Kystos) ============ */
const cellW = 80, cellH = 80;
function createCyberneticRogueAtlas() {
  const c = document.createElement('canvas');
  c.width = cellW * 8; c.height = cellH * 4;
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;

  function drawRogueFrame(col, row, pose, step) {
    const ox = col * cellW + 40, oy = row * cellH + 74;
    g.save(); g.translate(ox, oy);
    let bobY = 0, lean = 0, legL = 0, legR = 0, capeWave = Math.sin(step * 1.5) * 3;
    if (pose === 'idle') { bobY = (step % 2 === 1) ? -1 : 0; }
    else if (pose === 'run') { bobY = -Math.abs(Math.sin(step * 1.6)) * 3; lean = 0.18; legL = Math.sin(step * 1.6) * 7; legR = -Math.sin(step * 1.6) * 7; capeWave = -8 + Math.cos(step * 1.6) * 4; }
    else if (pose === 'jump') { bobY = -4; lean = 0.1; legL = -4; legR = 4; capeWave = -6; }
    else if (pose === 'fall') { bobY = -2; lean = -0.08; legL = 3; legR = -2; capeWave = -10; }
    else if (pose === 'attack') { lean = step >= 2 ? 0.32 : -0.1; legL = step >= 2 ? -6 : 0; legR = step >= 2 ? 8 : 0; capeWave = step >= 2 ? -14 : 2; }
    else if (pose === 'shoot') { lean = -0.05; capeWave = -4; }
    else if (pose === 'dash') { lean = 0.45; capeWave = -18; }

    if (pose === 'dash') {
      g.fillStyle = 'rgba(138, 43, 226, 0.45)'; g.fillRect(-36, -46, 34, 42);
      g.fillStyle = '#a855f7'; g.fillRect(-38, -38, 22, 4); g.fillRect(-32, -24, 26, 4); g.fillRect(-35, -12, 20, 4);
    }
    g.translate(0, bobY); g.rotate(lean);
    g.fillStyle = '#181524'; g.fillRect(-9 + legL, -18, 7, 18); g.fillRect(2 + legR, -18, 7, 18);
    g.fillStyle = '#6b5b8c'; g.fillRect(-7 + legL, -14, 3, 10); g.fillRect(4 + legR, -14, 3, 10);
    g.fillStyle = '#241936'; g.beginPath(); g.moveTo(-8, -44); g.lineTo(-22 + capeWave, -10); g.lineTo(-12 + capeWave * 0.6, -6); g.lineTo(-2, -14); g.closePath(); g.fill();
    g.fillStyle = '#3b2859'; g.fillRect(-14 + capeWave * 0.5, -36, 4, 24);
    g.fillStyle = '#14111f'; g.fillRect(-10, -42, 20, 26);
    g.fillStyle = '#584a75'; g.fillRect(-4, -38, 8, 3); g.fillRect(-4, -32, 8, 3); g.fillRect(-4, -26, 8, 3);
    g.fillStyle = '#2d2042'; g.fillRect(-13, -45, 26, 11);
    g.fillStyle = '#473366'; g.fillRect(-12, -45, 24, 3);
    g.fillStyle = '#261b38'; g.beginPath(); g.moveTo(-13, -43); g.lineTo(-10, -60); g.lineTo(6, -61); g.lineTo(13, -44); g.closePath(); g.fill();
    g.fillStyle = '#483569'; g.fillRect(-8, -59, 13, 3);
    g.fillStyle = '#09070f'; g.fillRect(-2, -54, 12, 10);
    g.fillStyle = '#c084fc'; g.fillRect(2, -51, 7, 3);
    g.fillStyle = '#f3e8ff'; g.fillRect(5, -51, 3, 2);
    if (pose === 'attack' && step >= 2) {
      g.strokeStyle = '#10b981'; g.lineWidth = 6; g.beginPath(); g.arc(10, -28, 30, -1.0, 1.0); g.stroke();
      g.fillStyle = '#94a3b8'; g.fillRect(22, -42, 10, 16);
      g.fillStyle = '#334155'; g.fillRect(18, -38, 6, 8);
    }
    if (pose === 'shoot') {
      g.fillStyle = '#38bdf8'; g.fillRect(10, -34, 16, 6);
      g.fillStyle = '#1e293b'; g.fillRect(8, -32, 6, 10);
      g.fillStyle = '#ffffff'; g.fillRect(26, -33, 6, 4);
    }
    g.restore();
  }
  for (let i = 0; i < 4; i++) drawRogueFrame(i, 0, 'idle', i);
  for (let i = 0; i < 4; i++) drawRogueFrame(4 + i, 0, 'run', i);
  for (let i = 0; i < 4; i++) drawRogueFrame(i, 1, 'run', i);
  for (let i = 0; i < 3; i++) drawRogueFrame(4 + i, 1, 'jump', i);
  drawRogueFrame(7, 1, 'fall', 0);
  for (let i = 0; i < 5; i++) drawRogueFrame(i, 2, 'attack', i);
  for (let i = 0; i < 3; i++) drawRogueFrame(5 + i, 2, 'dash', i);
  for (let i = 0; i < 3; i++) drawRogueFrame(i, 3, 'shoot', i);
  return c;
}
const atlas = createCyberneticRogueAtlas();
const anims = {
  idle:   [ {r:0,c:0},{r:0,c:1},{r:0,c:2},{r:0,c:3} ],
  run:    [ {r:1,c:0},{r:1,c:1},{r:1,c:2},{r:1,c:3} ],
  jump:   [ {r:1,c:4},{r:1,c:5},{r:1,c:6} ],
  fall:   [ {r:1,c:7} ],
  attack: [ {r:2,c:0},{r:2,c:1},{r:2,c:2},{r:2,c:3},{r:2,c:4} ],
  dash:   [ {r:2,c:5},{r:2,c:6},{r:2,c:7} ],
  shoot:  [ {r:3,c:0},{r:3,c:1},{r:3,c:2} ]
};
function drawSprite(g, sxc, syb, facing, fr, alpha = 1, sc = 88) {
  g.save(); g.globalAlpha = alpha; g.translate(sxc, syb);
  if (facing === 'left') g.scale(-1, 1);
  g.drawImage(atlas, fr.c * cellW, fr.r * cellH, cellW, cellH, -sc / 2, -sc + 6, sc, sc);
  g.restore();
}
const ATK_LEN = 22, DASH_LEN = 14, SHOOT_LEN = 12;
function frameFor(P) {
  const s = P.state, list = anims[s];
  if (s === 'attack') return list[Math.min(list.length - 1, Math.floor((ATK_LEN - P.atkT) / ATK_LEN * list.length))];
  if (s === 'dash') return list[Math.min(2, Math.floor((DASH_LEN - P.dashT) / DASH_LEN * 3))];
  if (s === 'shoot') return list[Math.min(2, Math.floor((SHOOT_LEN - P.shootT) / SHOOT_LEN * 3))];
  if (s === 'jump') return list[P.vy < -6 ? 0 : P.vy < -1 ? 1 : 2];
  if (s === 'fall') return list[0];
  P.animT += (s === 'run' && P.sprinting) ? 1.6 : 1;
  return list[Math.floor(P.animT / (s === 'run' ? 5 : 12)) % list.length];
}

/* ============ ENEMY / PROP ART ============ */
function drawDrone(ctx, ex, ey) {
  ctx.save();
  if (activeDroneImage) { ctx.drawImage(activeDroneImage, ex, ey, 36, 30); }
  else {
    ctx.fillStyle = '#1e2229'; ctx.beginPath(); ctx.moveTo(ex + 18, ey + 4); ctx.lineTo(ex + 34, ey + 14); ctx.lineTo(ex + 28, ey + 22); ctx.lineTo(ex + 8, ey + 22); ctx.lineTo(ex + 2, ey + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff0000'; ctx.beginPath(); ctx.arc(ex + 18, ey + 13, 4.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(ex + 17, ey + 12, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#2b303c'; ctx.beginPath(); ctx.moveTo(ex + 6, ey + 14); ctx.lineTo(ex - 8, ey + 20); ctx.lineTo(ex - 6, ey + 30); ctx.lineTo(ex + 8, ey + 24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.strokeRect(ex - 4, ey + 21, 8, 7);
    ctx.fillStyle = '#2b303c'; ctx.beginPath(); ctx.moveTo(ex + 30, ey + 14); ctx.lineTo(ex + 44, ey + 20); ctx.lineTo(ex + 42, ey + 30); ctx.lineTo(ex + 28, ey + 24); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#7a828e'; ctx.lineWidth = 1.5; ctx.strokeRect(ex + 32, ey + 21, 8, 7);
    ctx.fillStyle = '#111318'; ctx.fillRect(ex + 14, ey + 22, 3, 10); ctx.fillRect(ex + 19, ey + 22, 3, 10);
  }
  ctx.restore();
}
function drawCrawler(ctx, ex, ey) {
  ctx.save();
  ctx.fillStyle = '#3a4252'; ctx.beginPath(); ctx.moveTo(ex + 18, ey); ctx.lineTo(ex + 34, ey + 8); ctx.lineTo(ex + 32, ey + 22); ctx.lineTo(ex + 4, ey + 22); ctx.lineTo(ex + 2, ey + 8); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#5c677d'; ctx.fillRect(ex + 14, ey + 4, 10, 14);
  ctx.fillStyle = '#ef4444'; ctx.fillRect(ex + 12, ey + 10, 14, 3);
  ctx.fillStyle = '#1e2229'; ctx.fillRect(ex - 4, ey + 10, 10, 8); ctx.fillRect(ex + 30, ey + 10, 10, 8);
  ctx.strokeStyle = '#2b303c'; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(ex + 8, ey + 20); ctx.lineTo(ex - 2, ey + 28); ctx.lineTo(ex + 4, ey + 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex + 14, ey + 20); ctx.lineTo(ex + 8, ey + 28); ctx.lineTo(ex + 2, ey + 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex + 28, ey + 20); ctx.lineTo(ex + 38, ey + 28); ctx.lineTo(ex + 32, ey + 34); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(ex + 22, ey + 20); ctx.lineTo(ex + 28, ey + 28); ctx.lineTo(ex + 34, ey + 34); ctx.stroke();
  ctx.restore();
}
function drawZombie(ctx, ex, ey) {
  ctx.save();
  ctx.fillStyle = '#31382b'; ctx.fillRect(ex + 8, ey + 12, 24, 28);
  ctx.fillStyle = '#4a5d4e'; ctx.fillRect(ex + 10, ey + 2, 20, 14);
  ctx.fillStyle = '#84cc16'; ctx.fillRect(ex + 14, ey + 6, 4, 3); ctx.fillRect(ex + 22, ey + 6, 4, 3);
  ctx.fillStyle = '#3f4f43'; ctx.fillRect(ex - 4, ey + 16, 14, 4); ctx.fillRect(ex + 26, ey + 16, 14, 4);
  ctx.fillStyle = '#1e261f'; ctx.fillRect(ex + 11, ey + 40, 6, 8); ctx.fillRect(ex + 21, ey + 40, 6, 8);
  ctx.restore();
}
function drawSurvivor(ctx, ex, ey) {
  ctx.save();
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(ex + 8, ey + 12, 24, 28);
  ctx.fillStyle = '#cbd5e1'; ctx.fillRect(ex + 10, ey + 2, 20, 14);
  ctx.fillStyle = '#0f172a'; ctx.fillRect(ex + 14, ey + 6, 12, 3);
  ctx.fillStyle = '#64748b'; ctx.fillRect(ex + 24, ey + 18, 18, 4);
  ctx.restore();
}
function drawRedBlob(ctx, ex, ey) {
  ctx.save();
  ctx.fillStyle = '#dc2626'; ctx.beginPath();
  ctx.moveTo(ex, ey + 24); ctx.quadraticCurveTo(ex + 2, ey + 5, ex + 15, ey + 8);
  ctx.quadraticCurveTo(ex + 31, ey + 1, ex + 36, ey + 24);
  ctx.quadraticCurveTo(ex + 18, ey + 33, ex, ey + 24); ctx.fill();
  ctx.fillStyle = '#fff1f2'; ctx.fillRect(ex + 9, ey + 15, 6, 7); ctx.fillRect(ex + 22, ey + 15, 6, 7);
  ctx.fillStyle = '#450a0a'; ctx.fillRect(ex + 11, ey + 17, 3, 5); ctx.fillRect(ex + 24, ey + 17, 3, 5);
  ctx.restore();
}
function drawSurvivorBody(ctx, x, y) {
  ctx.save(); ctx.translate(x, y); ctx.rotate(-0.04);
  ctx.strokeStyle = '#64748b'; ctx.lineWidth = 6; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-8, -10); ctx.lineTo(-28, -5); ctx.lineTo(-38, -7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(6, -9); ctx.lineTo(24, -4); ctx.lineTo(36, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -8); ctx.lineTo(22, -1); ctx.lineTo(35, -1); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-8, -8); ctx.lineTo(-20, -1); ctx.lineTo(-34, -1); ctx.stroke();
  ctx.fillStyle = '#25617a'; ctx.fillRect(-10, -16, 22, 12);
  ctx.fillStyle = '#94a3b8'; ctx.beginPath(); ctx.arc(-18, -13, 7, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#475569'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(-22, -14); ctx.lineTo(-15, -12); ctx.stroke();
  ctx.restore();
}
function drawPebble(ctx, px, py) {
  ctx.save(); ctx.fillStyle = '#991b1b'; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 8, py - 12); ctx.lineTo(px + 18, py); ctx.closePath(); ctx.fill(); ctx.restore();
}
function drawCyberTree(ctx, tx, ty, t) {
  ctx.save();
  ctx.fillStyle = '#11221c'; ctx.fillRect(tx + 12, ty, 24, 100);
  ctx.fillStyle = '#1a3328'; ctx.fillRect(tx + 18, ty, 10, 100);
  ctx.fillStyle = '#064e3b'; ctx.beginPath(); ctx.arc(tx + 24, ty - 10, 32, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#10b981'; ctx.beginPath(); ctx.arc(tx + 14, ty - 18, 16, 0, Math.PI * 2); ctx.arc(tx + 34, ty - 12, 14, 0, Math.PI * 2); ctx.fill();
  const pulse = 0.5 + 0.5 * Math.sin(t * 0.08 + tx);
  ctx.fillStyle = `rgba(110,231,183,${0.5 + pulse * 0.5})`;
  ctx.fillRect(tx + 20, ty + 30, 4, 8); ctx.fillRect(tx + 22, ty + 70, 4, 8);
  ctx.restore();
}
const ENEMY_SIZE = { drone: [36, 30], crawler: [40, 34], zombie: [36, 48], survivor: [36, 48], redblob: [36, 28] };
const ENEMY_COL = { drone: '#ef4444', crawler: '#ef4444', zombie: '#84cc16', survivor: '#38bdf8', redblob: '#ef4444' };

/* ============ ZONE DATA ============ */
const G_ = (x, y, w) => [x, y, w, 50, 'g'];
const S_ = (x, y, w, h = 18) => [x, y, w, h, 'p'];
const B_ = (x, y, w, h = 24) => [x, y, w, h, 'b'];
const ZONES = [
  { name: 'ZONE 1: ASHEN SECTOR', goal: 3800, bg: '#2b2b2b',
    pal: { g: '#242224', gt: '#4a4542', p: '#6e352c', pt: '#9e5447' }, hud: '#e2a856',
    platforms: [G_(0,400,480), S_(520,310,140), S_(720,240,150), G_(940,400,620), S_(1620,300,160), G_(1860,400,620), S_(2560,280,150), G_(2800,400,1150)],
    enemies: [['drone',580,270,520,650,1.5],['crawler',1020,366,950,1500,2],['drone',1400,250,1000,1500,-2],['crawler',2000,366,1900,2450,-2.5],['drone',2900,300,2850,3500,2.5]],
    cps: [1800, 2800], hint: '[A/D] Move | [W/Space] Jump x2 | [Shift] Sprint | [J] Slash | [K] Dash | [L] Blaster | [↓] Slam | [P] Pause' },
  { name: 'ZONE 2: SALTED SHORE', goal: 2900, bg: '#050b14',
    pal: { g: '#0f2a3a', gt: '#10b981', p: '#0f2a3a', pt: '#10b981' }, hud: '#10b981',
    platforms: [G_(0,400,500), S_(560,310,160), S_(780,230,140), G_(980,400,800), S_(1840,290,180), G_(2100,400,900)],
    enemies: [['drone',620,270,560,720,2],['crawler',1100,366,980,1700,2.2],['drone',1900,250,1800,2050,-2.5]],
    cps: [1400], hint: '[A/D] Move | [W/Space] Jump x2 | [Shift] Sprint | [J] Slash | [K] Dash | [L] Blaster | [↓] Slam' },
  { name: 'ZONE 3: CYBER-FOREST', goal: 3800, bg: '#02120a',
    pal: { g: '#06281e', gt: '#10b981', p: '#06281e', pt: '#10b981' }, hud: '#10b981',
    platforms: [G_(0,400,600), S_(680,300,160), G_(920,400,800), S_(1800,260,150), G_(2040,400,1800)],
    trees: [550, 1200, 2300],
    enemies: [['crawler',1050,366,920,1600,2],['drone',2200,260,2100,2800,2.5]],
    cps: [1100, 2100], hint: '[J] Chop the data-trees & slash | [↓] Slam also fells trees | [K] Dash | [L] Blaster | [Shift] Sprint' },
  { name: 'ZONE 4: CANOPY SWING', goal: 3800, bg: '#011c10',
    pal: { g: '#083320', gt: '#34d399', p: '#083320', pt: '#34d399' }, hud: '#34d399',
    noDouble: true, noSprint: true,
    platforms: [G_(0,400,400), G_(600,380,300), G_(1100,360,350), G_(1700,340,400), G_(2300,380,1500)],
    anchors: [[480,150],[950,140],[1500,130],[2100,140]],
    enemies: [['drone',700,240,620,850,2],['drone',1800,220,1720,2000,-2.5]],
    cps: [1100, 2200], hint: 'Jump near a vine, hold [S] to grapple | [Space/W/K] release & launch | [J] Slash | [L] Blaster' },
  { name: 'ZONE 5: TOXIC WASTELAND', goal: 3800, bg: '#1a4d0b',
    pal: { g: '#332b1d', gt: '#84cc16', p: '#332b1d', pt: '#84cc16' }, hud: '#84cc16',
    platforms: [G_(0,400,500), S_(580,310,180), G_(840,400,800), S_(1720,280,200), G_(2000,400,2000)],
    enemies: [['zombie',620,352,580,750,1.2],['zombie',1100,352,900,1500,1.5],['zombie',2300,352,2100,2800,1.4]],
    cps: [1200, 2200], hint: 'Zombies chase when you get close | [J] Slash | [↓] Slam crushes crowds | [L] Blaster | [Shift] Sprint' },
  { name: 'ZONE 6: ROBO CAVES (CORE)', goal: 4200, bg: '#12081c',
    pal: { g: '#221533', gt: '#a855f7', p: '#221533', pt: '#a855f7' }, hud: '#c084fc',
    platforms: [G_(0,400,500), S_(580,310,180), G_(840,400,700), S_(1620,270,160), G_(1880,400,2400)],
    lasers: [[1200,150,250],[2400,150,250]],
    enemies: [['crawler',950,366,840,1500,2.5],['drone',2000,250,1900,2600,3],['crawler',2800,366,2500,3500,3]],
    cps: [1400, 2600], hint: 'Lasers flicker before they fire — wait it out or [K] Dash through | [J] Slash | [L] Blaster' },
  { name: 'ZONE 7: MIRROR LAND', goal: 3800, bg: '#0f172a',
    pal: { g: '#1e3a8a', gt: '#38bdf8', p: '#1e3a8a', pt: '#38bdf8' }, hud: '#38bdf8',
    platforms: [G_(0,400,500), S_(560,300,180), G_(820,400,700), S_(1600,280,160), G_(1840,400,2200)],
    enemies: [['survivor',620,352,560,720,1.8],['survivor',1100,352,820,1400,2],['survivor',2100,352,1900,2600,2.2]],
    cps: [1200, 2200], hint: 'The survivors think you are the machine | [J] Slash | [K] Dash | [L] Blaster | [Shift] Sprint' },
  { name: 'ZONE 8: SLIME PITS', goal: 3400, bg: '#123324',
    pal: { g: '#163b2a', gt: '#52d68a', p: '#1e4a35', pt: '#7af0aa' }, hud: '#7af0aa',
    bounceVelocity: -19,
    platforms: [G_(0,400,430), B_(500,360,110), S_(700,290,140), G_(900,400,360), B_(1320,340,120), S_(1510,250,140), G_(1730,400,380), B_(2160,330,130), S_(2370,240,150), G_(2610,400,850)],
    enemies: [['redblob',740,262,700,800,1.3],['redblob',1050,372,930,1200,1.5],['redblob',1810,372,1750,2050,1.6],['redblob',2410,212,2370,2470,1.4]],
    cps: [1700], hint: 'Use the bounce pads to launch across the slime pits | [J] Slash | [K] Dash | [L] Blaster' },
  { name: 'ZONE 9: THE QUIET COAST', goal: 3200, bg: '#0b2430',
    pal: { g: '#173744', gt: '#4a9b9b', p: '#173744', pt: '#4a9b9b' }, hud: '#8ecbd0',
    safe: true, speed: 4.8, noSprint: true, whisperTypewriter: true,
    platforms: [G_(0,400,3400)],
    bodies: [2250,2510,2780],
    whispers: [[350,'The coast is quiet. For once, nothing is chasing you.'],[950,'Keep walking. The tide has carried the signals away.'],[1570,'You followed their call all this way.'],[2130,'Those shapes on the shore... they are the survivors.'],[2620,'They did not make it. You are too late.']],
    enemies: [], cps: [], hint: 'Walk along the coast. You are safe here.' },
  { name: 'ZONE 10: BLOOD DRIVE', goal: 3800, bg: '#450a0a', moon: true,
    pal: { g: '#5c1010', gt: '#ef4444', p: '#5c1010', pt: '#ef4444' }, hud: '#fca5a5',
    safe: true, speed: 2.0, jump: -10,
    platforms: [G_(0,400,4500)],
    pebbles: [600,950,1300,1650,2000,2350,2700,3100,3500],
    whispers: [[500,'The sky is quiet.'],[1400,'Somewhere, someone is waiting.'],[2400,'Keep walking.'],[3300,'Almost there...']],
    enemies: [], cps: [], hint: '[A/D] Slow Walk | Safe Passage (No Life Loss)' }
];

/* ============ STORY FLOW ============ */
const STEPS = [
  { k:'d', tag:'CHAPTER 01 // ASHEN SECTOR', text:'Drones and mech-crawlers swarm the ruins. Draw your blaster [L], slash with your blade [J], or shadow dash [K] to survive!', btn:'ENTER ODYSSEY' },
  { k:'z', z:0 },
  { k:'d', tag:'CHAPTER 02 // THE SALTED SHORE', text:'You reach the coastal relay. The path forward requires crossing the dark, haunted gulf by vessel.', btn:'ENTER SALTED SHORE' },
  { k:'z', z:1 },
  { k:'boat' },
  { k:'d', tag:'CHAPTER 03 // THE OVERGROWN WILDWOOD', text:'You have docked near a mutated bio-mechanical forest. Giant data-trees block your path—use your axe slash [J] to chop them down and clear the way!', btn:'ENTER CYBER-FOREST' },
  { k:'z', z:2 },
  { k:'d', tag:'CHAPTER 04 // THE HIGH-WIRE CANOPY', text:'The lower forest paths are impassable! Ascend into the towering canopy and use your grapple tether [S] on data-vines to swing across bottomless chasms.', btn:'ENTER CANOPY SWING' },
  { k:'z', z:3 },
  { k:'d', tag:'CHAPTER 05 // THE TOXIC WASTELAND', text:'You emerge into an irradiated wasteland of radioactive ash and ruined machinery. Shambling hordes of cyber-zombies roam the toxic earth—cut them down before they overwhelm you!', btn:'ENTER WASTELAND' },
  { k:'z', z:4 },
  { k:'d', tag:'CHAPTER 06 // THE ROBO CAVES', text:'You have breached the subterranean metal bowels of the AI overlord. Navigate laser security grids, defeat elite mech-guards, and reach the core!', btn:'ENTER ROBO CAVES' },
  { k:'z', z:5 },
  { k:'d', tag:'CHAPTER 07 // THE MIRROR LAND', text:'You step into the reflecting canyons of Mirror Land. Paranoiac human survivors dwell here—they mistake you for an AI threat and will attack on sight!', btn:'ENTER MIRROR LAND' },
  { k:'z', z:6 },
  { k:'d', tag:'CHAPTER 08 // THE SLIME PITS', text:'The ground is alive with hostile red blobs. Use the bounce pads to launch over the pits and clear a path through them.', btn:'ENTER THE SLIME PITS' },
  { k:'z', z:7 },
  { k:'d', tag:'CHAPTER 09 // THE QUIET COAST', text:'The coast is calm, and nothing here can hurt you. Walk on. The words in the wind may explain what happened to the survivors.', btn:'WALK THE COAST' },
  { k:'z', z:8 },
  { k:'d', tag:'INTERLUDE // THE BLOOD DRIVE', text:'At last, you reach the Blood Drive. Kystos falls to his knees, overcome by grief.', btn:'CONTINUE' },
  { k:'kneel' },
  { k:'d', tag:'CHAPTER 10 // THE BLOOD DRIVE', text:'When he is ready, Kystos rises and continues down the crimson highway. Take a slow walk; no one can harm you here.', btn:'ENTER BLOOD DRIVE' },
  { k:'z', z:9 },
  { k:'credits' },
  { k:'boss' }
];

/* ============ GLOBAL STATE ============ */
let mode = 'title', stepIdx = -1, G = null, score = 0, falls = 0;

function showScene(id) {
  document.querySelectorAll('.scene').forEach(s => s.classList.add('hidden'));
  $(id).classList.remove('hidden');
}
function toTitle() { mode = 'title'; showScene('title-scene'); }
function startGame() { score = 0; falls = 0; stepIdx = -1; nextStep(); }
function nextStep() {
  stepIdx++;
  const s = STEPS[stepIdx];
  if (!s) { toTitle(); return; }
  if (s.k === 'd') startDialog(s);
  else if (s.k === 'z') startZone(s.z);
  else if (s.k === 'boat') startBoat();
  else if (s.k === 'kneel') startKneel();
  else if (s.k === 'credits') startCredits();
  else if (s.k === 'boss') startBoss();
}
function clickBtn(fn) { return e => { e.currentTarget.blur(); fn(); }; }
$('start-btn').addEventListener('click', clickBtn(startGame));
$('dlg-btn').addEventListener('click', clickBtn(() => advanceDialog()));
$('credits-menu-btn').addEventListener('click', clickBtn(nextStep));

/* ============ DIALOGUE ============ */
const D = { text: '', i: 0, done: false };
function startDialog(s) {
  mode = 'dialog'; showScene('dialog-scene');
  $('dlg-tag').textContent = s.tag; $('dlg-btn').innerHTML = s.btn + ' &#9654;';
  $('dlg-text').textContent = ''; D.text = s.text; D.i = 0; D.done = false;
}
function advanceDialog() { if (!D.done) { D.i = D.text.length; } else nextStep(); }
function updateDialog() {
  if (!D.done) {
    D.i += 1.6;
    if (D.i >= D.text.length) { D.i = D.text.length; D.done = true; }
    $('dlg-text').textContent = D.text.slice(0, Math.floor(D.i));
    if (Math.floor(D.i) % 3 === 0 && !D.done) sfx(180, 0.02, 'square', 0.012);
  }
  if (pressed.Enter || pressed.Space) advanceDialog();
}

/* ============ HELPERS ============ */
function rnd(k) { const x = Math.sin(k * 127.1 + k * k * 0.013 + 311.7) * 43758.5453; return x - Math.floor(x); }
function overlap(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
function burst(L, x, y, color, n = 12, sp = 4, size = 3, life = 30, g = 0.15) {
  if (L.parts.length > 500) return;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * 6.283, s = Math.random() * sp + sp * 0.3;
    L.parts.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 1, life: life * (0.6 + Math.random() * 0.6), max: life, size: size * (0.5 + Math.random()), color, g });
  }
}
function ring(L, x, y, color, n = 12, sp = 3) {
  for (let i = 0; i < n; i++) {
    const a = i / n * 6.283;
    L.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4, life: 18, max: 18, size: 3, color, g: 0 });
  }
}
function floatText(L, x, y, text, color = '#e2a856') { L.texts.push({ x, y, text, color, life: 55 }); }

/* ============ LEVEL SETUP ============ */
function snapCheckpoint(plats, x) {
  let best = null, bd = 1e9;
  for (const p of plats) {
    if (p.w < 150) continue;
    const c = Math.max(p.x + 30, Math.min(x, p.x + p.w - 60));
    const d = Math.abs(c - x);
    if (d < bd) { bd = d; best = { x: c, y: p.y - 54 - 2 }; }
  }
  return best;
}
function initLevel(zi) {
  const cfg = ZONES[zi];
  const plats = cfg.platforms.map(a => ({ x: a[0], y: a[1], w: a[2], h: a[3], type: a[4] }));
  const enemies = cfg.enemies.map(a => {
    const sz = ENEMY_SIZE[a[0]];
    return { t: a[0], x: a[1], y: a[2], w: sz[0], h: sz[1], minX: a[3], maxX: a[4], sp: Math.abs(a[5]), dir: a[5] < 0 ? -1 : 1, alive: true, ph: Math.random() * 6, by: 0 };
  });
  const P = {
    worldX: 150, y: 280, prevX: 150, prevY: 280, w: 36, h: 54, vx: 0, vy: 0,
    speed: cfg.speed || 4.8, jumpPower: cfg.jump || -12, grounded: false, facing: 'right', state: 'idle',
    animT: 0, atkT: 0, dashT: 0, shootT: 0, slashCd: 0, dashCd: 0, rangedCd: 0, inv: 0,
    coyote: 0, jumpBuf: 0, airJumps: 0, cutImm: 0, slam: false, sprinting: false,
    swing: null, swingCd: 0, lives: 3
  };
  return {
    zi, cfg, P, plats, enemies, proj: [], parts: [], texts: [], ghosts: [],
    trees: (cfg.trees || []).map(x => ({ x, y: 300, chopped: false })),
    anchors: (cfg.anchors || []).map(a => ({ x: a[0], y: a[1] })),
    lasers: (cfg.lasers || []).map(a => ({ x: a[0], y: a[1], h: a[2], on: true, timer: 0 })),
    pebbles: cfg.pebbles || [],
    bodies: (cfg.bodies || []).map(x => ({ x, y: 400 })),
    cps: (cfg.cps || []).map(x => Object.assign(snapCheckpoint(plats, x), { hit: false })),
    cp: { x: 150, y: 346 },
    cam: 0, prevCam: 0, shake: 0, hit: 0, flash: 0, t: 0, over: false, paused: false, clearT: 0,
    combo: 0, comboT: 0, startScore: score, whisper: null, wIdx: 0
  };
}
function startZone(zi) {
  mode = 'zone'; showScene('game-scene');
  G = initLevel(zi);
  $('game-scene').style.background = ZONES[zi].bg;
  $('hint').textContent = ZONES[zi].hint;
  $('drone-upload-label').style.display = '';
  sfx(300, 0.3, 'triangle', 0.05, 300);
}
function retryLevel() { score = G.startScore; const zi = G.zi; G = initLevel(zi); }

/* ============ PLAYER ============ */
function killEnemy(L, en, base) {
  en.alive = false;
  L.combo++; L.comboT = 150;
  const mult = Math.min(L.combo, 5), pts = base * mult;
  score += pts;
  floatText(L, en.x, en.y + en.by - 8, '+' + pts + (mult > 1 ? ' x' + mult : ''), mult > 2 ? '#f87171' : '#e2a856');
  const col = ENEMY_COL[en.t];
  burst(L, en.x + en.w / 2, en.y + en.by + en.h / 2, col, 14, 5, 3, 30);
  burst(L, en.x + en.w / 2, en.y + en.by + en.h / 2, '#7a828e', 8, 4, 3, 36, 0.25);
  L.shake = Math.max(L.shake, 6); L.hit = 3;
  sfx(160 + mult * 40, 0.15, 'sawtooth', 0.06, -90);
}
function respawn(L) {
  const P = L.P;
  P.worldX = L.cp.x; P.y = L.cp.y; P.vx = 0; P.vy = 0; P.inv = 100; P.slam = false; P.swing = null;
  P.dashT = 0; P.atkT = 0; P.prevX = P.worldX; P.prevY = P.y;
  L.cam = Math.max(0, P.worldX - 220);
}
function die(L, force) {
  const P = L.P;
  if (L.cfg.safe) { respawn(L); return; }
  if (!force && (P.inv > 0 || P.dashT > 0)) return;
  P.lives--; falls++; L.combo = 0; L.comboT = 0;
  burst(L, P.worldX + 18, Math.min(P.y + 27, H - 20), '#c084fc', 28, 6, 4, 40);
  L.shake = 16; L.flash = 1; L.hit = 6;
  sfx(120, 0.5, 'sawtooth', 0.09, -90);
  if (P.lives <= 0) { L.over = true; return; }
  respawn(L);
}
function slamImpact(L) {
  const P = L.P, cxp = P.worldX + P.w / 2;
  L.shake = 16; L.hit = 4;
  burst(L, cxp, P.y + P.h, '#f59e0b', 20, 6, 3, 28);
  ring(L, cxp, P.y + P.h - 4, '#fde68a', 16, 5);
  sfx(70, 0.3, 'sawtooth', 0.1, -30);
  for (const en of L.enemies) if (en.alive && Math.abs(en.x + en.w / 2 - cxp) < 120 && Math.abs(en.y + en.by - P.y) < 90) killEnemy(L, en, 150);
  for (const t of L.trees) if (!t.chopped && Math.abs(t.x + 24 - cxp) < 110) chopTree(L, t);
}
function chopTree(L, t) {
  t.chopped = true; score += 300;
  floatText(L, t.x, t.y - 20, '+300', '#6ee7b7');
  burst(L, t.x + 24, t.y + 20, '#10b981', 28, 5, 4, 45, 0.2);
  burst(L, t.x + 24, t.y + 60, '#1a3328', 16, 4, 4, 40, 0.3);
  L.shake = Math.max(L.shake, 8); sfx(100, 0.25, 'square', 0.07, -50);
}
function updatePlayer(L) {
  const P = L.P, cfg = L.cfg, safe = !!cfg.safe;
  P.prevX = P.worldX; P.prevY = P.y;
  if (P.slashCd > 0) P.slashCd--; if (P.dashCd > 0) P.dashCd--; if (P.rangedCd > 0) P.rangedCd--;
  if (P.inv > 0) P.inv--; if (P.atkT > 0) P.atkT--; if (P.shootT > 0) P.shootT--; if (P.dashT > 0) P.dashT--;
  if (P.cutImm > 0) P.cutImm--;
  const left = keys.KeyA || keys.ArrowLeft, right = keys.KeyD || keys.ArrowRight;
  const jumpPress = pressed.Space || pressed.KeyW || pressed.ArrowUp;
  const jumpHeld = keys.Space || keys.KeyW || keys.ArrowUp;

  if (!safe) {
    if (keys.KeyJ && P.slashCd === 0 && P.atkT === 0 && P.dashT === 0) {
      P.atkT = ATK_LEN; P.slashCd = 32; sfx(240, 0.14, 'sawtooth', 0.05, -140);
    }
    if (keys.KeyK && P.dashCd === 0 && P.dashT === 0 && P.atkT === 0) {
      P.dashT = DASH_LEN; P.dashCd = 55; sfx(150, 0.2, 'triangle', 0.07, 350);
      burst(L, P.worldX + 18, P.y + P.h, '#a855f7', 8, 2, 3, 20, 0.02);
    }
    if (keys.KeyL && P.rangedCd === 0 && P.dashT === 0) {
      P.shootT = SHOOT_LEN; P.rangedCd = 40;
      const dir = P.facing === 'right' ? 1 : -1;
      const mx = P.facing === 'right' ? P.worldX + P.w + 14 : P.worldX - 14;
      L.proj.push({ x: P.facing === 'right' ? P.worldX + P.w : P.worldX - 16, y: P.y + P.h / 2 - 6, w: 16, h: 8, vx: dir * 10 });
      burst(L, mx, P.y + P.h / 2 - 2, '#7dd3fc', 7, 3, 3, 12, 0);
      L.shake = Math.max(L.shake, 2); sfx(800, 0.1, 'square', 0.04, -500);
    }
  }

  P.sprinting = !safe && !cfg.noSprint && (keys.ShiftLeft || keys.ShiftRight) && (left || right) && P.dashT === 0;
  const spd = P.speed * (P.sprinting ? 1.45 : 1);
  if (P.dashT > 0) {
    P.vx = P.facing === 'right' ? 14 : -14; P.vy = 0;
    if (P.dashT % 2 === 0) L.ghosts.push({ x: P.worldX, y: P.y, facing: P.facing, fr: anims.dash[1], life: 14 });
  } else if (P.atkT > 0) {
    P.vx = (P.facing === 'right' ? 1 : -1) * 1.4;
  } else if (left && !right) { P.vx = -spd; P.facing = 'left'; }
  else if (right && !left) { P.vx = spd; P.facing = 'right'; }
  else P.vx = 0;

  if (P.grounded) { P.coyote = 6; P.airJumps = 0; } else if (P.coyote > 0) P.coyote--;
  if (jumpPress) P.jumpBuf = 8; else if (P.jumpBuf > 0) P.jumpBuf--;
  if (P.jumpBuf > 0 && P.dashT === 0) {
    if (P.coyote > 0) {
      P.vy = P.jumpPower; P.coyote = 0; P.jumpBuf = 0; P.grounded = false;
      burst(L, P.worldX + 18, P.y + P.h, '#8a8478', 5, 1.5, 2, 16, 0.02); sfx(330, 0.1, 'square', 0.04, 220);
    } else if (!cfg.noDouble && !safe && P.airJumps < 1) {
      P.airJumps++; P.vy = P.jumpPower * 0.92; P.jumpBuf = 0; P.cutImm = 6;
      ring(L, P.worldX + 18, P.y + P.h, '#c084fc', 12, 3); sfx(540, 0.14, 'square', 0.04, 360);
    }
  }
  if (!jumpHeld && P.vy < -4 && P.cutImm === 0 && P.dashT === 0) P.vy = -4;
  if (!safe && pressed.ArrowDown && !P.grounded && P.dashT === 0 && !P.slam) { P.slam = true; P.vy = 15; sfx(200, 0.2, 'sawtooth', 0.06, -150); }
  if (P.dashT === 0) P.vy = Math.min(P.vy + 0.6, P.slam ? 18 : 14);

  P.worldX = Math.max(0, P.worldX + P.vx);
  P.y += P.vy;

  for (const t of L.trees) {
    if (t.chopped) continue;
    const tl = t.x + 12, tr = t.x + 36;
    if (P.worldX + P.w > tl && P.worldX < tr && P.y + P.h > t.y - 140) {
      if (P.prevX + P.w <= tl + 4) P.worldX = tl - P.w; else P.worldX = tr;
      P.vx = 0;
    }
  }

  const wasG = P.grounded; P.grounded = false;
  for (const p of L.plats) {
    if (P.worldX + 6 < p.x + p.w && P.worldX + P.w - 6 > p.x && P.vy >= 0 && P.prevY + P.h <= p.y + 6 && P.y + P.h >= p.y) {
      if (p.type === 'b') {
        P.y = p.y - P.h; P.vy = cfg.bounceVelocity || -19; P.airJumps = 0; P.coyote = 0; P.slam = false;
        burst(L, P.worldX + 18, p.y, '#fb7185', 12, 3, 3, 22, 0.04);
        sfx(360, 0.16, 'triangle', 0.06, 420);
      } else {
        if (!wasG && P.vy > 5) burst(L, P.worldX + 18, p.y, '#8a8478', 6, 1.8, 2, 16, 0.02);
        P.y = p.y - P.h; P.vy = 0; P.grounded = true;
        if (P.slam) { P.slam = false; slamImpact(L); }
      }
    }
  }
  if (P.y > 520) die(L, true);

  if (P.dashT > 0) P.state = 'dash';
  else if (P.atkT > 0) P.state = 'attack';
  else if (P.shootT > 0) P.state = 'shoot';
  else if (!P.grounded) P.state = P.vy < 0 ? 'jump' : 'fall';
  else if (P.vx !== 0) P.state = 'run';
  else P.state = 'idle';

  if (P.grounded && P.vx !== 0 && L.t % 8 === 0) burst(L, P.worldX + 18, P.y + P.h, '#6b6458', 1, 0.8, 2, 14, 0.01);
}
function updateSwing(L) {
  const P = L.P;
  if (P.swingCd > 0) P.swingCd--;
  if (!P.swing && keys.KeyS && P.swingCd === 0) {
    let best = null, md = 200;
    const pcx = P.worldX + P.w / 2, pcy = P.y + P.h / 2;
    for (const a of L.anchors) { const d = Math.hypot(pcx - a.x, pcy - a.y); if (d < md) { md = d; best = a; } }
    if (best) {
      const dx = pcx - best.x;
      P.swing = { a: best, ang: Math.atan2(pcy - best.y, dx), r: Math.max(80, Math.min(140, md)), dir: dx < 0 ? -1 : 1 };
      P.swingCd = 20; sfx(420, 0.15, 'triangle', 0.06, 300);
    }
  } else if (P.swing && (pressed.Space || pressed.KeyW || pressed.ArrowUp || pressed.KeyK)) {
    const s = P.swing, om = 0.05 * s.dir;
    P.vx = Math.max(-12, Math.min(12, -Math.sin(s.ang) * s.r * om * 1.6));
    P.vy = Math.cos(s.ang) * s.r * om * 1.6 - 4;
    if (Math.abs(P.vx) < 3) P.vx = (P.facing === 'right' ? 1 : -1) * 6;
    P.facing = P.vx >= 0 ? 'right' : 'left';
    P.swing = null; P.swingCd = 20; P.cutImm = 16; P.airJumps = 0; P.dashCd = Math.max(P.dashCd, 10);
    ring(L, P.worldX + 18, P.y + 27, '#34d399', 10, 3); sfx(600, 0.15, 'square', 0.05, 300);
    return false;
  }
  if (P.swing) {
    const s = P.swing, om = 0.05 * s.dir;
    s.ang += om;
    P.worldX = s.a.x + Math.cos(s.ang) * s.r - P.w / 2;
    P.y = s.a.y + Math.sin(s.ang) * s.r - P.h / 2;
    P.vx = 0; P.vy = 0; P.state = 'jump'; P.grounded = false; P.prevX = P.worldX; P.prevY = P.y;
    P.facing = Math.cos(s.ang + Math.PI / 2) * s.dir >= 0 ? 'right' : 'left';
    if (L.t % 4 === 0) burst(L, P.worldX + 18, P.y + 27, '#6ee7b7', 1, 1, 2, 14, 0);
    return true;
  }
  return false;
}

/* ============ ZONE UPDATE ============ */
function updateFx(L) {
  for (const p of L.parts) { p.x += p.vx; p.y += p.vy; p.vy += p.g; p.life--; }
  L.parts = L.parts.filter(p => p.life > 0);
  for (const t of L.texts) { t.y -= 0.6; t.life--; }
  L.texts = L.texts.filter(t => t.life > 0);
  for (const g of L.ghosts) g.life--;
  L.ghosts = L.ghosts.filter(g => g.life > 0);
  if (L.shake > 0) L.shake = Math.max(0, L.shake - 1);
  if (L.flash > 0) L.flash = Math.max(0, L.flash - 0.05);
  if (L.whisper) {
    if (L.cfg.whisperTypewriter && L.whisper.i < L.whisper.text.length) {
      L.whisper.i = Math.min(L.whisper.text.length, L.whisper.i + 0.8);
    }
    L.whisper.t--;
    if (L.whisper.t <= 0) L.whisper = null;
  }
}
function setHud(L) {
  const P = L.P, cfg = L.cfg;
  $('hZone').textContent = cfg.name;
  $('hLives').textContent = cfg.safe ? 'SAFE ZONE' : 'LIVES: ' + P.lives;
  $('hDist').textContent = `DIST: ${Math.floor(P.worldX)}/${cfg.goal}m`;
  $('hScore').textContent = 'SCORE: ' + score;
  $('hCombo').textContent = L.combo > 1 ? 'COMBO x' + Math.min(L.combo, 5) : '';
  const c = (cd) => cd === 0 ? 'READY' : Math.ceil(cd / 6);
  $('hCd').textContent = cfg.safe ? 'SLOW WALK MODE' :
    `J:${c(P.slashCd)} K:${c(P.dashCd)} ` + (cfg.anchors ? `S:${P.swing ? 'SWING' : 'READY'} ` : '') + `L:${c(P.rangedCd)}`;
}
function updateZone() {
  const L = G, P = L.P, cfg = L.cfg;
  if (pressed.KeyM) muted = !muted;
  if (L.over) {
    updateFx(L);
    if (pressed.Enter) retryLevel();
    else if (pressed.Escape) toTitle();
    return;
  }
  if (pressed.KeyP || pressed.Escape) L.paused = !L.paused;
  if (L.paused) { if (pressed.KeyR) { L.paused = false; retryLevel(); } return; }
  if (pressed.KeyR) { retryLevel(); return; }
  if (L.clearT > 0) {
    L.clearT--; L.prevCam = L.cam; updateFx(L);
    if (L.clearT === 0) nextStep();
    return;
  }
  if (L.hit > 0) { L.hit--; return; }
  L.t++; L.prevCam = L.cam;
  if (L.comboT > 0) { L.comboT--; if (!L.comboT) L.combo = 0; }

  let swinging = false;
  if (L.anchors.length) swinging = updateSwing(L);
  if (!swinging) updatePlayer(L);
  if (L.over) return;

  // checkpoints
  for (const cp of L.cps) if (!cp.hit && P.worldX > cp.x) {
    cp.hit = true; L.cp = { x: cp.x, y: cp.y };
    floatText(L, cp.x, cp.y - 40, 'CHECKPOINT', '#6ee7b7'); ring(L, cp.x, cp.y + 54, '#6ee7b7', 14, 4); sfx(660, 0.2, 'triangle', 0.06, 300);
  }

  // whispers (safe zone)
  if (cfg.whispers && L.wIdx < cfg.whispers.length && P.worldX > cfg.whispers[L.wIdx][0]) {
    L.whisper = { text: cfg.whispers[L.wIdx][1], t: 200, i: 0 }; L.wIdx++;
  }

  // slash hitbox vs trees
  const e = ATK_LEN - P.atkT, atkActive = P.atkT > 0 && e >= 5 && e <= 16;
  const atkBox = { x: P.facing === 'right' ? P.worldX + P.w - 4 : P.worldX - 48, y: P.y - 8, w: 52, h: P.h + 8 };
  if (atkActive) for (const t of L.trees) if (!t.chopped && overlap(atkBox, { x: t.x, y: t.y - 40, w: 48, h: 140 })) chopTree(L, t);

  // lasers
  for (const l of L.lasers) {
    l.timer++;
    if (l.timer > 90) { l.on = !l.on; l.timer = 0; if (l.on) sfx(90, 0.2, 'sawtooth', 0.04); }
    if (l.on && P.dashT === 0 && P.inv === 0 && P.worldX + P.w > l.x - 4 && P.worldX < l.x + 4 && P.y + P.h > l.y && P.y < l.y + l.h) die(L);
  }
  if (L.over) return;

  // projectiles
  for (let i = L.proj.length - 1; i >= 0; i--) {
    const pr = L.proj[i]; pr.x += pr.vx;
    let hit = false;
    for (const en of L.enemies) if (en.alive && overlap(pr, { x: en.x, y: en.y + en.by, w: en.w, h: en.h })) { killEnemy(L, en, 120); hit = true; break; }
    if (hit) burst(L, pr.x, pr.y, '#7dd3fc', 8, 4, 3, 16, 0);
    if (hit || pr.x - L.cam < -60 || pr.x - L.cam > W + 60) L.proj.splice(i, 1);
  }

  // enemies
  for (const en of L.enemies) {
    if (!en.alive) continue;
    const near = Math.abs(P.worldX - en.x) < 200 && en.t !== 'drone';
    let dir = en.dir, sp = en.sp;
    if (near) { dir = P.worldX > en.x ? 1 : -1; sp *= 1.5; en.dir = dir; }
    en.x += dir * sp;
    if (en.x < en.minX) { en.x = en.minX; en.dir = 1; } else if (en.x > en.maxX) { en.x = en.maxX; en.dir = -1; }
    en.by = en.t === 'drone' ? Math.sin(L.t * 0.08 + en.ph) * 8 : 0;
    const box = { x: en.x, y: en.y + en.by, w: en.w, h: en.h };
    if (atkActive && overlap(atkBox, box)) { killEnemy(L, en, 100); continue; }
    if (P.dashT > 0 && overlap({ x: P.worldX, y: P.y, w: P.w, h: P.h }, box)) { killEnemy(L, en, 100); continue; }
    const hurtBox = { x: P.worldX + 6, y: P.y + 6, w: P.w - 12, h: P.h - 6 };
    if (overlap(hurtBox, box)) {
      if (P.vy > 2 && P.y + P.h - box.y < 24 && P.dashT === 0) { killEnemy(L, en, 100); P.vy = -9; P.airJumps = 0; P.slam = false; }
      else { die(L); if (L.over) return; }
    }
  }

  // goal
  if (P.worldX >= cfg.goal) {
    L.clearT = 100; sfx(523, 0.4, 'triangle', 0.07, 520); ring(L, P.worldX + 18, P.y + 27, '#fde68a', 20, 5);
    burst(L, P.worldX + 18, P.y + 27, '#fde68a', 30, 6, 3, 40, 0.05);
  }

  const target = Math.max(0, P.worldX - 220 + (P.facing === 'right' ? 30 : -10));
  L.cam += (target - L.cam) * 0.12;
  updateFx(L);
}

/* ============ ZONE RENDER ============ */
function drawLevel(L) {
  const cam = L.cam, P = L.P, cfg = L.cfg, pal = cfg.pal, t = L.t;
  cx.clearRect(0, 0, W, H);

  if (cfg.moon) {
    const moonX = 620 - cam * 0.02, moonY = 100;
    const glow = cx.createRadialGradient(moonX, moonY, 24, moonX, moonY, 100);
    glow.addColorStop(0, 'rgba(255,230,210,.22)');
    glow.addColorStop(1, 'rgba(255,230,210,0)');
    cx.fillStyle = glow; cx.fillRect(moonX - 100, moonY - 100, 200, 200);
    cx.fillStyle = '#f5d6c8'; cx.beginPath(); cx.arc(moonX, moonY, 36, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = 'rgba(115,24,24,.18)';
    cx.beginPath(); cx.arc(moonX - 10, moonY - 7, 7, 0, Math.PI * 2); cx.fill();
    cx.beginPath(); cx.arc(moonX + 12, moonY + 9, 5, 0, Math.PI * 2); cx.fill();
  }

  // vines (zone 4)
  for (const a of L.anchors) {
    const ax = a.x - cam;
    if (ax < -100 || ax > W + 100) continue;
    cx.strokeStyle = '#10b981'; cx.lineWidth = 3; cx.beginPath(); cx.moveTo(ax, 0); cx.lineTo(ax, a.y); cx.stroke();
    const near = Math.hypot(P.worldX + 18 - a.x, P.y + 27 - a.y) < 200;
    cx.fillStyle = near ? '#fde68a' : '#6ee7b7'; cx.beginPath(); cx.arc(ax, a.y, near ? 8 : 6, 0, 6.3); cx.fill();
    if (near && !P.swing) { cx.strokeStyle = 'rgba(253,230,138,.4)'; cx.lineWidth = 1; cx.beginPath(); cx.arc(ax, a.y, 12 + Math.sin(t * 0.2) * 3, 0, 6.3); cx.stroke(); }
  }

  // platforms
  for (const p of L.plats) {
    const rx = p.x - cam;
    if (rx + p.w < -100 || rx > W + 100) continue;
    const ground = p.type === 'g';
    const bounce = p.type === 'b';
    cx.fillStyle = ground ? pal.g : bounce ? '#7f1d1d' : pal.p; cx.fillRect(rx, p.y, p.w, ground ? H - p.y + 20 : p.h);
    cx.fillStyle = ground ? pal.gt : bounce ? '#fb7185' : pal.pt; cx.fillRect(rx, p.y, p.w, ground ? 6 : 4);
    if (bounce) {
      cx.fillStyle = '#fecdd3';
      for (let x = 10; x < p.w - 8; x += 16) cx.fillRect(rx + x, p.y + 8, 4, p.h - 12);
      cx.strokeStyle = '#ffe4e6'; cx.lineWidth = 3; cx.beginPath();
      cx.moveTo(rx + p.w / 2 - 7, p.y - 5); cx.lineTo(rx + p.w / 2, p.y - 12); cx.lineTo(rx + p.w / 2 + 7, p.y - 5); cx.stroke();
    }
    cx.fillStyle = 'rgba(0,0,0,.25)';
    for (let x = Math.max(0, Math.floor(-rx / 40)) * 40; x < p.w; x += 40) { if (rx + x > W) break; cx.fillRect(rx + x, p.y + 8, 2, ground ? 40 : p.h - 8); }
    cx.globalAlpha = 0.25; cx.fillStyle = ground ? pal.gt : pal.pt; cx.fillRect(rx, p.y + (ground ? 6 : 4), p.w, 3); cx.globalAlpha = 1;
  }

  for (const body of L.bodies) {
    const x = body.x - cam;
    if (x > -60 && x < W + 60) drawSurvivorBody(cx, x, body.y);
  }

  // checkpoints
  for (const cp of L.cps) {
    const rx = cp.x - cam; if (rx < -40 || rx > W + 40) continue;
    cx.fillStyle = '#4a4542'; cx.fillRect(rx, cp.y + 14, 4, 40);
    cx.fillStyle = cp.hit ? '#6ee7b7' : '#596270'; const w = Math.sin(t * 0.1) * 2; cx.fillRect(rx + 4, cp.y + 14, 18 + w, 10);
  }

  // goal gate
  const gx = cfg.goal - cam;
  if (gx > -80 && gx < W + 80) {
    const pulse = 0.5 + 0.5 * Math.sin(t * 0.1);
    const gg = cx.createLinearGradient(gx, 0, gx + 40, 0);
    gg.addColorStop(0, 'rgba(253,230,138,0)'); gg.addColorStop(0.5, `rgba(253,230,138,${0.15 + pulse * 0.15})`); gg.addColorStop(1, 'rgba(253,230,138,0)');
    cx.fillStyle = gg; cx.fillRect(gx - 20, 0, 80, 400);
    cx.fillStyle = '#fde68a'; cx.fillRect(gx - 2, 120, 4, 280); cx.fillRect(gx + 38, 120, 4, 280);
  }

  // pebbles
  for (const px of L.pebbles) { const rx = px - cam; if (rx > -50 && rx < W + 50) drawPebble(cx, rx, 400); }

  // trees
  for (const tr of L.trees) {
    const rx = tr.x - cam; if (rx < -100 || rx > W + 100) continue;
    if (!tr.chopped) {
      drawCyberTree(cx, rx, tr.y, t);
      if (Math.abs(P.worldX - tr.x) < 140) { cx.fillStyle = '#e2a856'; cx.font = '8px "Press Start 2P"'; cx.textAlign = 'center'; cx.fillText('[J] CHOP', rx + 24, tr.y - 56); }
    } else { cx.fillStyle = '#11221c'; cx.fillRect(rx + 12, tr.y + 70, 24, 30); }
  }

  // lasers
  for (const l of L.lasers) {
    const lx = l.x - cam; if (lx < -50 || lx > W + 50) continue;
    cx.fillStyle = '#374151'; cx.fillRect(lx - 8, l.y - 8, 16, 8); cx.fillRect(lx - 8, l.y + l.h, 16, 8);
    if (l.on) {
      cx.fillStyle = 'rgba(239,68,68,.25)'; cx.fillRect(lx - 9, l.y, 18, l.h);
      cx.strokeStyle = '#ef4444'; cx.lineWidth = 4; cx.beginPath(); cx.moveTo(lx, l.y); cx.lineTo(lx, l.y + l.h); cx.stroke();
      cx.strokeStyle = '#fff'; cx.lineWidth = 1; cx.beginPath(); cx.moveTo(lx, l.y); cx.lineTo(lx, l.y + l.h); cx.stroke();
    } else if (l.timer > 70 && Math.floor(l.timer / 3) % 2 === 0) {
      cx.strokeStyle = 'rgba(239,68,68,.5)'; cx.lineWidth = 1; cx.setLineDash([6, 6]); cx.beginPath(); cx.moveTo(lx, l.y); cx.lineTo(lx, l.y + l.h); cx.stroke(); cx.setLineDash([]);
    }
  }

  // enemies
  for (const en of L.enemies) {
    if (!en.alive) continue;
    const ex = en.x - cam; if (ex < -100 || ex > W + 100) continue;
    const ey = en.y + en.by;
    cx.save();
    if (en.t !== 'drone' && en.dir < 0) { cx.translate(ex + en.w / 2, 0); cx.scale(-1, 1); cx.translate(-(ex + en.w / 2), 0); }
    if (en.t === 'drone') drawDrone(cx, ex, ey); else if (en.t === 'crawler') drawCrawler(cx, ex, ey);
    else if (en.t === 'zombie') drawZombie(cx, ex, ey); else if (en.t === 'redblob') drawRedBlob(cx, ex, ey);
    else drawSurvivor(cx, ex, ey);
    cx.restore();
  }

  // vine rope
  if (P.swing) {
    cx.strokeStyle = '#38bdf8'; cx.lineWidth = 2; cx.beginPath();
    cx.moveTo(P.swing.a.x - cam, P.swing.a.y); cx.lineTo(P.worldX + P.w / 2 - cam, P.y + P.h / 2); cx.stroke();
  }

  // dash ghosts
  for (const gh of L.ghosts) drawSprite(cx, gh.x - cam + P.w / 2, gh.y + P.h, gh.facing, gh.fr, gh.life / 14 * 0.45);

  // projectiles
  for (const pr of L.proj) {
    const prx = pr.x - cam, dir = Math.sign(pr.vx);
    cx.fillStyle = 'rgba(56,189,248,.25)'; cx.fillRect(dir > 0 ? prx - 30 : prx + 16, pr.y + 1, 30, 6);
    cx.fillStyle = 'rgba(56,189,248,.5)'; cx.fillRect(dir > 0 ? prx - 14 : prx + 16, pr.y, 14, 8);
    cx.fillStyle = '#38bdf8'; cx.fillRect(prx, pr.y, pr.w, pr.h);
    cx.fillStyle = '#fff'; cx.fillRect(prx + (dir > 0 ? 8 : 2), pr.y + 2, 6, 4);
  }

  // player
  if (!(P.inv > 0 && Math.floor(t / 4) % 2 === 0)) {
    if (P.sprinting && t % 3 === 0) L.ghosts.push({ x: P.worldX, y: P.y, facing: P.facing, fr: frameFor(P), life: 8 });
    drawSprite(cx, P.worldX - cam + P.w / 2, P.y + P.h, P.facing, frameFor(P));
  }
  // slash arc
  const e = ATK_LEN - P.atkT;
  if (P.atkT > 0 && e >= 4 && e <= 18) {
    const prog = Math.min(1, (e - 4) / 14);
    cx.save(); cx.translate(P.worldX - cam + P.w / 2, P.y + P.h / 2); if (P.facing === 'left') cx.scale(-1, 1);
    const a1 = -1.5 + prog * 2.4;
    cx.strokeStyle = `rgba(167,243,208,${0.9 - prog * 0.7})`; cx.lineWidth = 9 - prog * 6; cx.beginPath(); cx.arc(8, 0, 46, a1 - 1.0, a1); cx.stroke();
    cx.strokeStyle = `rgba(255,255,255,${0.9 - prog * 0.8})`; cx.lineWidth = 2; cx.beginPath(); cx.arc(8, 0, 46, a1 - 0.8, a1); cx.stroke();
    cx.restore();
  }
  // slam trail
  if (P.slam) { cx.fillStyle = 'rgba(245,158,11,.35)'; cx.fillRect(P.worldX - cam + 8, P.y - 40, 20, 50); }

  // particles
  for (const p of L.parts) {
    cx.globalAlpha = Math.max(0, p.life / p.max); cx.fillStyle = p.color;
    cx.fillRect(p.x - cam - p.size / 2, p.y - p.size / 2, p.size, p.size);
  }
  cx.globalAlpha = 1;
  // floating texts
  cx.font = '9px "Press Start 2P"'; cx.textAlign = 'center';
  for (const f of L.texts) { cx.globalAlpha = Math.min(1, f.life / 20); cx.fillStyle = '#000'; cx.fillText(f.text, f.x - cam + 1, f.y + 1); cx.fillStyle = f.color; cx.fillText(f.text, f.x - cam, f.y); }
  cx.globalAlpha = 1;
}
function centerText(text, y, size, color) {
  cx.font = size + 'px "Press Start 2P"'; cx.textAlign = 'center';
  cx.fillStyle = '#000'; cx.fillText(text, W / 2 + 2, y + 2); cx.fillStyle = color; cx.fillText(text, W / 2, y);
}
function renderZone() {
  const L = G; if (!L) return;
  cx.clearRect(0, 0, W, H);
  cx.save();
  if (L.shake > 0) cx.translate((Math.random() - 0.5) * L.shake, (Math.random() - 0.5) * L.shake);
  drawLevel(L);
  cx.restore();

  // vignette + scanlines
  const v = cx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  let va = 0.55;
  if (L.cfg.safe) va += 0.12 * (0.5 + 0.5 * Math.sin(L.t * 0.05));
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, `rgba(0,0,0,${va})`);
  cx.fillStyle = v; cx.fillRect(0, 0, W, H);
  cx.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
  if (L.flash > 0) { cx.fillStyle = `rgba(255,255,255,${L.flash * 0.5})`; cx.fillRect(0, 0, W, H); }

  // low life warning
  if (!L.cfg.safe && L.P.lives === 1) { cx.fillStyle = `rgba(185,28,28,${0.08 + 0.06 * Math.sin(L.t * 0.15)})`; cx.fillRect(0, 0, W, H); }

  // banner
  if (L.t < 120 && !L.over) {
    cx.globalAlpha = Math.min(1, (120 - L.t) / 40) * Math.min(1, L.t / 15);
    centerText(L.cfg.name, 120, 16, L.cfg.hud);
    cx.globalAlpha = 1;
  }
  if (L.whisper) {
    cx.globalAlpha = Math.min(1, L.whisper.t / 40, (200 - L.whisper.t) / 30);
    const text = L.cfg.whisperTypewriter ? L.whisper.text.slice(0, Math.floor(L.whisper.i)) : L.whisper.text;
    centerText(text, 90, 11, '#fecaca'); cx.globalAlpha = 1;
  }
  if (L.clearT > 0) { cx.fillStyle = 'rgba(0,0,0,.45)'; cx.fillRect(0, 0, W, H); centerText('ZONE CLEAR', 200, 22, '#fde68a'); centerText('SCORE ' + score, 245, 11, '#d4cbb8'); }
  if (L.over) { cx.fillStyle = 'rgba(0,0,0,.7)'; cx.fillRect(0, 0, W, H); centerText('GAME OVER', 190, 24, '#ef4444'); centerText('[ENTER] RETRY ZONE', 250, 10, '#e2a856'); centerText('[ESC] TITLE', 280, 10, '#7a828e'); }
  if (L.paused) {
    cx.fillStyle = 'rgba(0,0,0,.75)'; cx.fillRect(0, 0, W, H);
    centerText('PAUSED', 110, 22, '#e2a856');
    const lines = ['[A/D] MOVE      [W/SPACE] JUMP (x2)', '[SHIFT] SPRINT   [J] SLASH', '[K] DASH (INVULNERABLE)   [L] BLASTER', '[DOWN] GROUND SLAM (IN AIR)', '[S] GRAPPLE VINES (ZONE 4)', '[M] MUTE ' + (muted ? '(ON)' : '(OFF)') + '   [R] RESTART ZONE', '[P] RESUME'];
    lines.forEach((s, i) => centerText(s, 165 + i * 28, 9, '#d4cbb8'));
  }
  if (!L.paused) setHud(L);
}

/* ============ BOAT CINEMATIC ============ */
const B = { t: 0, boatX: -100, rain: [], flash: 0, foam: [] };
function startBoat() {
  mode = 'boat'; showScene('game-scene');
  $('game-scene').style.background = '#02060d';
  B.t = 0; B.boatX = -100; B.flash = 0; B.foam = [];
  B.rain = []; for (let i = 0; i < 90; i++) B.rain.push({ x: Math.random() * W, y: Math.random() * H, v: 8 + Math.random() * 6 });
  $('hZone').textContent = 'CINEMATIC // CROSSING THE GULF'; $('hLives').textContent = ''; $('hDist').textContent = 'DESTINATION: OVERGROWN SECTOR';
  $('hScore').textContent = 'SCORE: ' + score; $('hCombo').textContent = ''; $('hCd').textContent = '';
  $('drone-upload-label').style.display = 'none';
  $('hint').textContent = 'Sailing through dark tides...';
}
function updateBoat() {
  B.t++;
  if (pressed.KeyM) muted = !muted;
  if (B.boatX < 350) B.boatX += 1.2;
  else $('hint').textContent = 'Press [ENTER] to dock at the Cyber-Forest.';
  for (const r of B.rain) { r.y += r.v; r.x -= 2; if (r.y > H) { r.y = -10; r.x = Math.random() * (W + 40); } }
  if (B.flash > 0) B.flash -= 0.04;
  if (Math.random() < 0.004) { B.flash = 1; sfx(60, 0.6, 'sawtooth', 0.06, -20); }
  if (B.t % 4 === 0) B.foam.push({ x: B.boatX + 12 + Math.random() * 20, y: 355 + Math.random() * 4, vx: -1 - Math.random(), vy: -Math.random() * 1.5, life: 24 });
  for (const f of B.foam) { f.x += f.vx; f.y += f.vy; f.vy += 0.1; f.life--; }
  B.foam = B.foam.filter(f => f.life > 0);
  if (pressed.Enter) nextStep();
}
function renderBoat() {
  cx.clearRect(0, 0, W, H);
  const wave = B.t * 0.05;
  const sky = cx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#02060d'); sky.addColorStop(0.7, '#06281e'); sky.addColorStop(1, '#0f382b');
  cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
  cx.fillStyle = '#031810'; cx.fillRect(80, 130, 70, 220); cx.fillRect(280, 80, 100, 270); cx.fillRect(520, 150, 80, 200);
  cx.fillStyle = 'rgba(16,185,129,.5)'; cx.fillRect(110, 150, 6, 6); cx.fillRect(330, 110, 6, 6); cx.fillRect(560, 180, 6, 6);
  cx.fillStyle = 'rgba(180,200,200,.06)'; for (let i = 0; i < 3; i++) cx.fillRect(((B.t * 0.3 + i * 300) % 1000) - 200, 250 + i * 25, 400, 40);
  cx.fillStyle = '#041c12'; cx.fillRect(0, 320, W, 130);
  cx.strokeStyle = '#10b981'; cx.lineWidth = 2;
  for (let i = 0; i < 5; i++) { cx.beginPath(); const wy = 340 + i * 22; for (let x = 0; x < W; x += 20) { const y = wy + Math.sin(x * 0.02 + wave + i) * 4; x === 0 ? cx.moveTo(x, y) : cx.lineTo(x, y); } cx.stroke(); }
  const bY = 310 + Math.sin(wave * 2) * 3;
  cx.save(); cx.translate(B.boatX, bY);
  cx.fillStyle = 'rgba(16,185,129,.12)'; cx.beginPath(); cx.arc(60, 10, 70, 0, 6.3); cx.fill();
  cx.fillStyle = '#1e293b'; cx.beginPath(); cx.moveTo(10, 20); cx.lineTo(110, 20); cx.lineTo(95, 45); cx.lineTo(25, 45); cx.closePath(); cx.fill();
  cx.strokeStyle = '#10b981'; cx.lineWidth = 2; cx.stroke();
  cx.fillStyle = '#334155'; cx.fillRect(40, -5, 40, 25);
  cx.fillStyle = '#10b981'; cx.fillRect(56, -12, 8, 8);
  cx.fillStyle = '#6b5b8c'; cx.fillRect(45, -28, 16, 26);
  cx.fillStyle = '#241936'; cx.fillRect(43, -40, 20, 14);
  cx.fillStyle = '#c084fc'; cx.fillRect(54, -34, 6, 3);
  cx.restore();
  cx.fillStyle = '#a5f3fc'; for (const f of B.foam) { cx.globalAlpha = f.life / 24; cx.fillRect(f.x, f.y, 3, 3); } cx.globalAlpha = 1;
  cx.strokeStyle = 'rgba(165,243,252,.35)'; cx.lineWidth = 1; cx.beginPath();
  for (const r of B.rain) { cx.moveTo(r.x, r.y); cx.lineTo(r.x - 3, r.y + 10); } cx.stroke();
  if (B.flash > 0) { cx.fillStyle = `rgba(200,230,255,${B.flash * 0.35})`; cx.fillRect(0, 0, W, H); }
  const v = cx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95);
  v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.6)'); cx.fillStyle = v; cx.fillRect(0, 0, W, H);
  cx.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
}

/* ============ KYSTOS CINEMATIC ============ */
const K = { t: 0 };
const BF = {
  t: 0, started: false, won: false, bossHp: 12, maxBossHp: 12, bossHitCd: 0, bossFlash: 0,
  playerX: 70, playerY: H - 139, playerVY: 0, facing: 'right', grounded: true,
  lives: 5, inv: 0, slashCd: 0, slashT: 0, shotCd: 0, shots: [], bossShots: []
};
const bossArtwork = new Image();
bossArtwork.onerror = () => console.error('Could not load the boss image at boss.png.');
bossArtwork.src = 'boss.png';
function startKneel() {
  mode = 'kneel'; showScene('game-scene');
  $('game-scene').style.background = '#450a0a';
  $('hZone').textContent = 'CINEMATIC // THE BLOOD DRIVE';
  $('hLives').textContent = ''; $('hDist').textContent = '';
  $('hScore').textContent = ''; $('hCombo').textContent = ''; $('hCd').textContent = '';
  $('drone-upload-label').style.display = 'none';
  $('hint').textContent = 'Press [ENTER] when you are ready to continue.';
  K.t = 0;
}
function updateKneel() {
  K.t++;
  if (pressed.KeyM) muted = !muted;
  if (pressed.Enter || pressed.Space) nextStep();
}
function drawKneelingKystos(g, x, ground, t) {
  g.save(); g.translate(x, ground);
  g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(0, -2, 55, 9, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#241936'; g.beginPath();
  g.moveTo(-8, -72); g.lineTo(-24, -54); g.lineTo(-60, -8); g.lineTo(-28, -3); g.lineTo(-3, -36); g.closePath(); g.fill();
  g.strokeStyle = '#181524'; g.lineWidth = 15; g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(-5, -38); g.lineTo(-18, -20); g.lineTo(-30, -6); g.lineTo(-12, -6); g.stroke();
  g.beginPath(); g.moveTo(5, -38); g.lineTo(18, -20); g.lineTo(14, -6); g.lineTo(34, -6); g.stroke();
  g.fillStyle = '#14111f'; g.beginPath();
  g.moveTo(-14, -78); g.lineTo(12, -78); g.lineTo(17, -42); g.lineTo(-5, -32); g.lineTo(-20, -48); g.closePath(); g.fill();
  g.strokeStyle = '#241936'; g.lineWidth = 8;
  g.beginPath(); g.moveTo(-11, -68); g.lineTo(-8, -87); g.lineTo(-1, -92); g.stroke();
  g.beginPath(); g.moveTo(11, -68); g.lineTo(8, -87); g.lineTo(2, -92); g.stroke();
  g.fillStyle = '#261b38'; g.fillRect(-13, -111, 26, 27);
  g.fillStyle = '#473366'; g.fillRect(-12, -111, 24, 4);
  g.fillStyle = '#09070f'; g.fillRect(-7, -101, 16, 10);
  g.fillStyle = '#c084fc'; g.fillRect(-5, -98, 11, 3);
  const tear = (t % 48) / 48 * 17;
  g.strokeStyle = '#38bdf8'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(-5, -89); g.lineTo(-5, -89 + tear); g.stroke();
  g.beginPath(); g.moveTo(5, -89); g.lineTo(5, -89 + Math.max(0, tear - 8)); g.stroke();
  g.fillStyle = '#7dd3fc'; g.beginPath(); g.arc(-5, -89 + tear, 2, 0, Math.PI * 2); g.fill();
  g.restore();
}
function renderKneel() {
  cx.clearRect(0, 0, W, H);
  const sky = cx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, '#170608'); sky.addColorStop(1, '#450a0a');
  cx.fillStyle = sky; cx.fillRect(0, 0, W, H);
  const glow = cx.createRadialGradient(620, 105, 18, 620, 105, 105);
  glow.addColorStop(0, 'rgba(255,230,210,.25)'); glow.addColorStop(1, 'rgba(255,230,210,0)');
  cx.fillStyle = glow; cx.fillRect(515, 0, 210, 210);
  cx.fillStyle = '#f5d6c8'; cx.beginPath(); cx.arc(620, 105, 34, 0, Math.PI * 2); cx.fill();
  cx.fillStyle = '#5c1010'; cx.fillRect(0, 365, W, 85);
  cx.fillStyle = '#ef4444'; cx.fillRect(0, 365, W, 4);
  centerText('THE SURVIVORS ARE GONE', 95, 10, '#fecaca');
  drawKneelingKystos(cx, W / 2, 365, K.t);
  cx.fillStyle = 'rgba(0,0,0,.12)'; for (let y = 0; y < H; y += 3) cx.fillRect(0, y, W, 1);
}

/* ============ FINAL BOSS FIGHT ============ */
function startBoss() {
  mode = 'boss'; showScene('game-scene');
  $('game-scene').style.background = '#101820';
  $('hZone').textContent = 'FINAL BOSS // THE LAST QUESTION';
  $('hLives').textContent = ''; $('hDist').textContent = '';
  $('hScore').textContent = ''; $('hCombo').textContent = ''; $('hCd').textContent = '';
  $('drone-upload-label').style.display = 'none';
  $('hint').textContent = 'A/D: move | W/SPACE: jump | J: slash | L: blaster';
  BF.t = 0; BF.started = false; BF.won = false; BF.bossHp = BF.maxBossHp;
  BF.bossHitCd = 0; BF.bossFlash = 0; BF.playerX = 70; BF.playerY = H - 139;
  BF.playerVY = 0; BF.facing = 'right'; BF.grounded = true;
  BF.lives = 5; BF.inv = 0; BF.slashCd = 0; BF.slashT = 0; BF.shotCd = 0;
  BF.shots = []; BF.bossShots = [];
}
function damageBoss() {
  if (BF.bossHitCd > 0 || BF.won) return;
  BF.bossHp = Math.max(0, BF.bossHp - 1);
  BF.bossHitCd = 14; BF.bossFlash = 8;
  sfx(180, 0.12, 'square', 0.06, -80);
  if (BF.bossHp === 0) BF.won = true;
}
function updateBoss() {
  if (pressed.KeyM) muted = !muted;
  if (!BF.started) {
    if (pressed.Enter || pressed.Space) BF.started = true;
    return;
  }
  if (BF.won) { if (pressed.Enter) toTitle(); return; }
  if (BF.lives <= 0) {
    if (pressed.Enter) startBoss();
    else if (pressed.Escape) toTitle();
    return;
  }
  if (pressed.Escape) { toTitle(); return; }
  BF.t++;
  if (BF.inv > 0) BF.inv--;
  if (BF.slashCd > 0) BF.slashCd--;
  if (BF.slashT > 0) BF.slashT--;
  if (BF.shotCd > 0) BF.shotCd--;
  if (BF.bossHitCd > 0) BF.bossHitCd--;
  if (BF.bossFlash > 0) BF.bossFlash--;

  const left = keys.KeyA || keys.ArrowLeft, right = keys.KeyD || keys.ArrowRight;
  if (left && !right) { BF.playerX -= 4.8; BF.facing = 'left'; }
  else if (right && !left) { BF.playerX += 4.8; BF.facing = 'right'; }
  BF.playerX = Math.max(20, Math.min(720, BF.playerX));
  if ((pressed.Space || pressed.KeyW || pressed.ArrowUp) && BF.grounded) {
    BF.playerVY = -11; BF.grounded = false;
  }
  BF.playerVY = Math.min(BF.playerVY + 0.6, 14);
  BF.playerY += BF.playerVY;
  if (BF.playerY >= H - 139) { BF.playerY = H - 139; BF.playerVY = 0; BF.grounded = true; }

  if (keys.KeyJ && BF.slashCd === 0) {
    BF.slashCd = 24; BF.slashT = 12;
    if (BF.playerX > 420 && BF.playerX < 620) damageBoss();
  }
  if (keys.KeyL && BF.shotCd === 0) {
    BF.shotCd = 28; BF.shots.push({ x: BF.playerX + 34, y: BF.playerY + 24 });
    sfx(680, 0.08, 'square', 0.035, -300);
  }
  if (BF.t % 82 === 0) BF.bossShots.push({ x: 735, y: 295 + Math.random() * 45 });
  for (let i = BF.shots.length - 1; i >= 0; i--) {
    const shot = BF.shots[i]; shot.x += 9;
    if (shot.x >= 500) { damageBoss(); BF.shots.splice(i, 1); }
    else if (shot.x > W) BF.shots.splice(i, 1);
  }
  for (let i = BF.bossShots.length - 1; i >= 0; i--) {
    const shot = BF.bossShots[i]; shot.x -= 6;
    if (BF.inv === 0 && shot.x < BF.playerX + 36 && shot.x > BF.playerX && shot.y > BF.playerY && shot.y < BF.playerY + 54) {
      BF.lives--; BF.inv = 75; sfx(100, 0.2, 'sawtooth', 0.06, -60); BF.bossShots.splice(i, 1);
    } else if (shot.x < -20) BF.bossShots.splice(i, 1);
  }
  $('hLives').textContent = 'KYSTOS: ' + BF.lives;
  $('hDist').textContent = 'BOSS: ' + BF.bossHp + '/' + BF.maxBossHp;
}
function renderBoss() {
  cx.clearRect(0, 0, W, H);
  cx.fillStyle = '#172328'; cx.fillRect(0, 0, W, H);
  if (bossArtwork.complete && bossArtwork.naturalWidth) cx.drawImage(bossArtwork, 0, 0, W, 365);
  cx.fillStyle = 'rgba(5,9,13,.35)'; cx.fillRect(0, 0, W, 365);
  cx.fillStyle = '#263331'; cx.fillRect(0, 365, W, 85);
  cx.fillStyle = '#809080'; cx.fillRect(0, 365, W, 4);

  const barW = 460, barX = (W - barW) / 2;
  cx.fillStyle = 'rgba(0,0,0,.75)'; cx.fillRect(barX, 15, barW, 16);
  cx.fillStyle = '#ef4444'; cx.fillRect(barX + 2, 17, (barW - 4) * BF.bossHp / BF.maxBossHp, 12);
  centerText('THE MACHINE', 52, 9, '#fff1f2');
  if (BF.bossFlash > 0) { cx.fillStyle = 'rgba(255,255,255,.35)'; cx.fillRect(0, 0, W, 365); }

  for (const shot of BF.bossShots) {
    cx.fillStyle = 'rgba(239,68,68,.35)'; cx.beginPath(); cx.arc(shot.x, shot.y, 13, 0, Math.PI * 2); cx.fill();
    cx.fillStyle = '#f87171'; cx.beginPath(); cx.arc(shot.x, shot.y, 6, 0, Math.PI * 2); cx.fill();
  }
  for (const shot of BF.shots) {
    cx.fillStyle = '#38bdf8'; cx.fillRect(shot.x, shot.y, 16, 8);
    cx.fillStyle = '#e0f2fe'; cx.fillRect(shot.x + 5, shot.y + 2, 6, 4);
  }
  if (!(BF.inv > 0 && Math.floor(BF.t / 5) % 2 === 0)) {
    const moving = keys.KeyA || keys.KeyD || keys.ArrowLeft || keys.ArrowRight;
    const frames = moving ? anims.run : anims.idle;
    const fr = frames[Math.floor(BF.t / (moving ? 7 : 16)) % frames.length];
    drawSprite(cx, BF.playerX + 18, BF.playerY + 54, BF.facing, fr);
  }
  if (BF.slashT > 0) {
    cx.strokeStyle = 'rgba(167,243,208,.85)'; cx.lineWidth = 8; cx.beginPath();
    cx.arc(BF.playerX + (BF.facing === 'right' ? 45 : -9), BF.playerY + 24, 38, -1.2, 1.2); cx.stroke();
  }

  if (!BF.started || BF.won || BF.lives <= 0) {
    cx.fillStyle = 'rgba(0,0,0,.5)'; cx.fillRect(0, 0, W, H);
    if (!BF.started) {
      centerText('IF YOU KILL THE BOSS...', 85, 11, '#fecaca');
      centerText('CAN YOU BRING EVERYONE BACK?', 115, 9, '#fff1f2');
      centerText('[ENTER] BEGIN THE FIGHT', 400, 8, '#e2a856');
    } else if (BF.won) {
      centerText('THE BOSS HAS FALLEN', 180, 16, '#fde68a');
      centerText('CAN HE BRING THEM BACK?', 225, 10, '#fecaca');
      centerText('[ENTER] RETURN TO TITLE', 285, 8, '#d4cbb8');
    } else {
      centerText('KYSTOS HAS FALLEN', 180, 16, '#ef4444');
      centerText('[ENTER] TRY AGAIN', 240, 9, '#e2a856');
      centerText('[ESC] RETURN TO TITLE', 275, 8, '#d4cbb8');
    }
  }
}

/* ============ ENDING: SLOW SCROLLING STORY ============ */
const C = { y: 0, t: 0, end: false, endT: 0, stars: [], kx: -80 };
function startCredits() {
  mode = 'credits'; showScene('credits-scene');
  C.y = window.innerHeight + 30; C.t = 0; C.end = false; C.endT = 0; C.kx = -80;
  C.stars = []; for (let i = 0; i < 140; i++) C.stars.push({ x: Math.random(), y: Math.random() * 0.75, s: Math.random() < 0.15 ? 2 : 1, ph: Math.random() * 6 });
  $('credits-stats').textContent = `FINAL SCORE: ${score}   FALLS: ${falls}`;
  $('credits-menu-btn').classList.remove('show');
  $('credits-content').style.transform = `translateX(-50%) translateY(${C.y}px)`;
}
function updateCredits() {
  C.t++;
  if (pressed.KeyM) muted = !muted;
  const cc = $('credits-content'), el = $('credits-end');
  if (!C.end) {
    const fast = keys.ArrowDown || keys.Space;
    C.y -= fast ? 2.4 : 0.4;
    cc.style.transform = `translateX(-50%) translateY(${C.y}px)`;
    if (C.y + el.offsetTop + el.offsetHeight / 2 <= window.innerHeight / 2) { C.end = true; C.endT = 0; }
  } else {
    C.endT++;
    if (C.endT > 150) $('credits-menu-btn').classList.add('show');
    if (C.endT > 150 && pressed.Enter) nextStep();
  }
  const maxX = window.innerWidth * 0.72;
  if (C.kx < maxX) C.kx += 0.14;
}
function renderCredits() {
  const c = $('creditsBg'), w = window.innerWidth, h = window.innerHeight;
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  const g = c.getContext('2d'); g.imageSmoothingEnabled = false;
  const sky = g.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, '#000000'); sky.addColorStop(0.6, '#0a0a14'); sky.addColorStop(1, '#2a1410');
  g.fillStyle = sky; g.fillRect(0, 0, w, h);
  for (const s of C.stars) { g.globalAlpha = 0.4 + 0.6 * Math.abs(Math.sin(C.t * 0.02 + s.ph)); g.fillStyle = '#d4cbb8'; g.fillRect(s.x * w, s.y * h, s.s, s.s); }
  g.globalAlpha = 1;
  // distant warm light — where hope might be
  const lx = w - 90, ly = h - 80;
  const glow = g.createRadialGradient(lx, ly, 2, lx, ly, 180);
  glow.addColorStop(0, `rgba(253,230,138,${0.35 + 0.1 * Math.sin(C.t * 0.03)})`); glow.addColorStop(1, 'rgba(253,230,138,0)');
  g.fillStyle = glow; g.fillRect(lx - 200, ly - 200, 400, 400);
  g.fillStyle = '#fde68a'; g.fillRect(lx - 2, ly - 2, 4, 4);
  // ruined skyline
  g.fillStyle = '#0b0c10';
  for (let i = 0; i < w / 60 + 2; i++) { const bh = 30 + rnd(i * 3.7) * 90; g.fillRect(i * 60, h - 60 - bh, 44, bh); }
  g.fillStyle = '#07080a'; g.fillRect(0, h - 60, w, 60);
  g.fillStyle = '#1a1214'; g.fillRect(0, h - 60, w, 3);
  // Kystos, walking toward the light
  const walking = C.kx < w * 0.72 - 1;
  const list = walking ? anims.run : anims.idle;
  const fr = list[Math.floor(C.t / (walking ? 8 : 20)) % list.length];
  drawSprite(g, C.kx, h - 54, 'right', fr, 1, 110);
}

/* ============ MAIN LOOP (fixed 60 Hz) ============ */
function stepOnce() {
  if (mode === 'title') { if (pressed.Enter || pressed.Space) startGame(); }
  else if (mode === 'dialog') updateDialog();
  else if (mode === 'zone') updateZone();
  else if (mode === 'boat') updateBoat();
  else if (mode === 'kneel') updateKneel();
  else if (mode === 'boss') updateBoss();
  else if (mode === 'credits') updateCredits();
}
function render() {
  if (mode === 'zone') renderZone();
  else if (mode === 'boat') renderBoat();
  else if (mode === 'kneel') renderKneel();
  else if (mode === 'boss') renderBoss();
  else if (mode === 'credits') renderCredits();
}
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) {
    stepOnce();
    for (const k in pressed) delete pressed[k];
    acc -= 1000 / 60;
  }
  render();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);