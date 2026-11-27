// Gobble's Great Escape — the game loop: screens, input, sound and the world.
// `?shot=<name>&seed=<n>` draws one deterministic frame for a screenshot;
// without it the game plays live with keyboard and mouse.
import { STEP, VIEW, rankFor } from './config.js';
import { createWorld, stepWorld, EVENT_BARK, EVENT_BURN, EVENT_CAUGHT, EVENT_CORN, EVENT_ESCAPED, EVENT_KNIFE, EVENT_SPOTTED, EVENT_STAGE } from './world.js';
import { drawWorld, SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PAUSE, SCREEN_PLAY, SCREEN_TITLE } from './render.js';
import { createInput } from './input.js';
import { createAudio } from './audio.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusLine = document.getElementById('status');
const params = new URLSearchParams(location.search);
const shotName = params.get('shot');
const seed = Number.parseInt(params.get('seed') || '1', 10) || 1;

const input = createInput(canvas);
const audio = createAudio();
let world = createWorld(0, seed);
let screen = SCREEN_TITLE;
let best = 0;
try {
  best = Number.parseInt(localStorage.getItem('gobble-best') || '0', 10) || 0;
} catch {
  best = 0;
}
let paused = false;
let lastFrame = performance.now();
let accumulator = 0;
let gobbleTimer = 0;
let moveTarget = null;
let pressedLastFrame = new Set();

function saveBest() {
  if (world.score > best) {
    best = world.score;
    try { localStorage.setItem('gobble-best', String(best)); } catch { /* private mode */ }
  }
}

function startRun() {
  world = createWorld(0, seed);
  screen = SCREEN_PLAY;
  moveTarget = null;
  statusLine.textContent = 'Run started. Reach the gate.';
}

// True only on the frame a key goes down, so P, M and R never double-fire.
function edge(key) {
  return input.pressed(key) && !pressedLastFrame.has(key.toLowerCase());
}

function snapshotKeys() {
  pressedLastFrame = new Set(
    ['enter', 'r', 'p', 'm'].filter((key) => input.pressed(key)),
  );
}

function resize() {
  const scale = Math.min(window.innerWidth / VIEW.width, window.innerHeight / VIEW.height);
  canvas.width = Math.round(VIEW.width * scale);
  canvas.height = Math.round(VIEW.height * scale);
  ctx.setTransform(canvas.width / VIEW.width, 0, 0, canvas.height / VIEW.height, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function playEvents(events) {
  for (const event of events) {
    if (event === EVENT_CORN) audio.corn();
    else if (event === EVENT_SPOTTED) audio.spotted();
    else if (event === EVENT_BARK) audio.bark();
    else if (event === EVENT_CAUGHT) audio.caught();
    else if (event === EVENT_BURN || event === EVENT_KNIFE) audio.burn();
    else if (event === EVENT_STAGE) audio.stage();
    else if (event === EVENT_ESCAPED) audio.escaped();
  }
  if (events.includes(EVENT_STAGE)) statusLine.textContent = `Stage cleared — score ${world.score}.`;
  if (events.includes(EVENT_ESCAPED)) {
    world.rank = rankFor(world.score, world.time);
    saveBest();
    screen = SCREEN_ESCAPED;
    statusLine.textContent = `Escaped! Score ${world.score}, rank ${world.rank}.`;
  }
  if (world.status === 'gameover') {
    saveBest();
    screen = SCREEN_OVER;
    statusLine.textContent = `Caught. Score ${world.score}. Press R to try again.`;
  }
}

function frame(now) {
  const elapsed = Math.min(0.1, (now - lastFrame) / 1000);
  lastFrame = now;
  const click = input.consumeClick();
  if (click) moveTarget = { x: click.x, y: click.y };

  if (screen === SCREEN_TITLE) {
    if (edge('enter') || click) startRun();
  } else if (screen === SCREEN_OVER || screen === SCREEN_ESCAPED) {
    if (edge('r') || click) startRun();
  } else {
    if (edge('p')) {
      paused = !paused;
      screen = paused ? SCREEN_PAUSE : SCREEN_PLAY;
    }
    if (edge('m')) audio.toggleMute();
    if (edge('r')) startRun();
    if (!paused && screen === SCREEN_PLAY) {
      accumulator += elapsed;
      let guard = 0;
      while (accumulator >= STEP && guard < 5) {
        accumulator -= STEP;
        guard += 1;
        const state = input.state;
        let mx = state.mx;
        let my = state.my;
        if (mx === 0 && my === 0 && moveTarget) {
          const dx = moveTarget.x - world.turkey.x;
          const dy = moveTarget.y - world.turkey.y;
          const len = Math.sqrt(dx * dx + dy * dy);
          if (len > 10) { mx = dx / len; my = dy / len; }
          else moveTarget = null;
        } else if (mx !== 0 || my !== 0) {
          moveTarget = null;
        }
        playEvents(stepWorld(world, { mx, my, sprint: state.sprint, hide: state.hide }));
        if (screen !== SCREEN_PLAY) break;
      }
      gobbleTimer += elapsed;
      if (gobbleTimer > 7) {
        gobbleTimer = 0;
        if (world.status === 'playing') audio.gobble();
      }
    }
  }

  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawWorld(ctx, world, screen, best);
  snapshotKeys();
  requestAnimationFrame(frame);
}

if (shotName) {
  // One deterministic frame: stage the scene, draw it once, stop.
  const staged = stageShot(shotName, world);
  screen = staged.screen;
  best = staged.best;
  if (screen === SCREEN_ESCAPED) {
    world.rank = rankFor(world.score, world.time);
  }
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  drawWorld(ctx, world, screen, best);
  document.title = `Gobble's Great Escape — ${shotName}`;
} else {
  requestAnimationFrame(frame);
}
