// Gobble's Great Escape — the world, pure logic with no DOM in it.
// The browser draws this state and Node's self-play test steps it, both from
// the same step function, so a game the test wins is a game a player can win.
import { DOG, FARMER, KNIFE, LIVES, SCORE, STAGES, STEP, TURKEY, VIEW } from './config.js';

export const EVENT_CORN = 'corn';
export const EVENT_SPOTTED = 'spotted';
export const EVENT_CAUGHT = 'caught';
export const EVENT_BARK = 'bark';
export const EVENT_BURN = 'burn';
export const EVENT_KNIFE = 'knife';
export const EVENT_STAGE = 'stage';
export const EVENT_ESCAPED = 'escaped';
export const EVENT_HIDDEN = 'hidden';

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function angleDifference(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function circleHitsRect(x, y, radius, rect) {
  const nearestX = clamp(x, rect.x, rect.x + rect.w);
  const nearestY = clamp(y, rect.y, rect.y + rect.h);
  const dx = x - nearestX;
  const dy = y - nearestY;
  return dx * dx + dy * dy < radius * radius;
}

// A straight line of sight is blocked when any sample point lands in a wall.
function lineBlocked(x0, y0, x1, y1, walls) {
  for (let i = 1; i < 12; i += 1) {
    const t = i / 12;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    for (const wall of walls) if (pointInRect(x, y, wall)) return true;
  }
  return false;
}

// Push a circle out of every wall it overlaps, one axis at a time so it
// slides along a wall instead of sticking to it.
function collideWalls(body, walls) {
  for (const wall of walls) {
    if (!circleHitsRect(body.x, body.y, body.radius, wall)) continue;
    const overlapLeft = body.x + body.radius - wall.x;
    const overlapRight = wall.x + wall.w - (body.x - body.radius);
    const overlapTop = body.y + body.radius - wall.y;
    const overlapBottom = wall.y + wall.h - (body.y - body.radius);
    const smallest = Math.min(overlapLeft, overlapRight, overlapTop, overlapBottom);
    if (smallest === overlapLeft) body.x = wall.x - body.radius;
    else if (smallest === overlapRight) body.x = wall.x + wall.w + body.radius;
    else if (smallest === overlapTop) body.y = wall.y - body.radius;
    else body.y = wall.y + wall.h + body.radius;
  }
  body.x = clamp(body.x, body.radius, VIEW.width - body.radius);
  body.y = clamp(body.y, body.radius, VIEW.height - body.radius);
}

export function createWorld(stageIndex, seed) {
  const stage = STAGES[stageIndex];
  return {
    stageIndex,
    stage,
    seed,
    time: 0,
    score: 0,
    lives: LIVES,
    status: 'playing',
    alert: 'calm',
    stageTime: 0,
    turkey: {
      x: stage.start.x, y: stage.start.y, radius: TURKEY.radius,
      angle: -Math.PI / 2, stamina: TURKEY.staminaMax,
      hidden: false, invulnerable: 0, moving: false, sprinting: false,
    },
    farmers: stage.farmers.map((f) => ({
      x: f.waypoints[0].x, y: f.waypoints[0].y, radius: FARMER.radius,
      angle: 0, state: 'patrol', waypointIndex: 1,
      waypoints: f.waypoints, lastSeen: null, loseSight: 0, scan: 0,
    })),
    dogs: stage.dogs.map((d) => ({
      x: d.waypoints[0].x, y: d.waypoints[0].y, radius: DOG.radius,
      angle: 0, waypointIndex: 1, waypoints: d.waypoints, barkCooldown: 0,
    })),
    corn: stage.corn.map((c) => ({ ...c, taken: false })),
    knifeAngle: stage.knife ? stage.knife.angle : 0,
    ovenCooldown: 0,
    wasHidden: false,
    navIndex: 0,
  };
}

export function distanceToGate(world) {
  const gate = world.stage.gate;
  const cx = gate.x + gate.w / 2;
  const cy = gate.y + gate.h / 2;
  const dx = world.turkey.x - cx;
  const dy = world.turkey.y - cy;
  return Math.max(0, Math.round(Math.sqrt(dx * dx + dy * dy) / 24));
}

function turkeyIsHidden(world) {
  const t = world.turkey;
  if (t.sprinting) return false;
  return world.stage.bushes.some((b) => pointInRect(t.x, t.y, b));
}

function canSee(agent, range, halfAngle, world) {
  const t = world.turkey;
  if (t.hidden) return false;
  const dx = t.x - agent.x;
  const dy = t.y - agent.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > range) return false;
  if (dist > 4 && Math.abs(angleDifference(Math.atan2(dy, dx), agent.angle)) > halfAngle) return false;
  return !lineBlocked(agent.x, agent.y, t.x, t.y, world.stage.walls);
}

function moveToward(body, targetX, targetY, speed, dt, walls) {
  const dx = targetX - body.x;
  const dy = targetY - body.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  body.x += (dx / dist) * step;
  body.y += (dy / dist) * step;
  body.angle = Math.atan2(dy, dx);
  collideWalls(body, walls);
  return dist - step < 2;
}

function loseLife(world, events, kind) {
  const t = world.turkey;
  if (t.invulnerable > 0 || world.status !== 'playing') return;
  world.lives -= 1;
  t.invulnerable = TURKEY.invulnerableSeconds;
  events.push(kind);
  if (world.lives <= 0) {
    world.status = 'gameover';
    return;
  }
  t.x = world.stage.start.x;
  t.y = world.stage.start.y;
  t.stamina = TURKEY.staminaMax;
  for (const farmer of world.farmers) {
    farmer.state = 'patrol';
    farmer.x = farmer.waypoints[0].x;
    farmer.y = farmer.waypoints[0].y;
    farmer.waypointIndex = 1;
    farmer.lastSeen = null;
  }
}

// One fixed step. `input` is { mx, my, sprint, hide } with mx/my in [-1, 1].
// Returns the list of events this step raised, for sound and feedback.
export function stepWorld(world, input, dt = STEP) {
  const events = [];
  if (world.status !== 'playing') return events;
  world.time += dt;
  world.stageTime += dt;
  const t = world.turkey;
  const walls = world.stage.walls;
  if (t.invulnerable > 0) t.invulnerable -= dt;
  if (world.ovenCooldown > 0) world.ovenCooldown -= dt;

  // --- the turkey moves ---
  let mx = input.mx || 0;
  let my = input.my || 0;
  const mag = Math.sqrt(mx * mx + my * my);
  if (mag > 1) { mx /= mag; my /= mag; }
  const wantSprint = Boolean(input.sprint) && t.stamina > 1 && mag > 0.1;
  t.sprinting = wantSprint;
  const speed = wantSprint ? TURKEY.sprint : TURKEY.walk;
  t.moving = mag > 0.1;
  if (t.moving) {
    t.x += mx * speed * dt;
    t.y += my * speed * dt;
    t.angle = Math.atan2(my, mx);
    collideWalls(t, walls);
  }
  if (wantSprint) t.stamina = Math.max(0, t.stamina - TURKEY.staminaDrain * dt);
  else t.stamina = Math.min(TURKEY.staminaMax, t.stamina + TURKEY.staminaRegen * dt);
  t.hidden = turkeyIsHidden(world);
  if (t.hidden && !world.wasHidden) events.push(EVENT_HIDDEN);
  world.wasHidden = t.hidden;

  // Sprinting is loud: a farmer close by turns to investigate the noise.
  if (t.sprinting) {
    for (const farmer of world.farmers) {
      const dx = t.x - farmer.x;
      const dy = t.y - farmer.y;
      if (dx * dx + dy * dy < 200 * 200 && farmer.state === 'patrol') {
        farmer.state = 'suspicious';
        farmer.lastSeen = { x: t.x, y: t.y };
      }
    }
  }

  // --- the farmer: patrol, chase, search ---
  let chased = false;
  for (const farmer of world.farmers) {
    const sees = canSee(farmer, FARMER.visionRange, FARMER.visionHalfAngle, world);
    if (sees) {
      farmer.lastSeen = { x: t.x, y: t.y };
      farmer.loseSight = 0;
      if (farmer.state !== 'chase') {
        farmer.state = 'chase';
        events.push(EVENT_SPOTTED);
      }
    }
    if (farmer.state === 'chase') {
      chased = true;
      const target = farmer.lastSeen || { x: t.x, y: t.y };
      moveToward(farmer, target.x, target.y, FARMER.chase, dt, walls);
      if (!sees) {
        farmer.loseSight += dt;
        if (farmer.loseSight > FARMER.loseSightSeconds) {
          farmer.state = 'suspicious';
          farmer.scan = 0;
        }
      }
      const dx = t.x - farmer.x;
      const dy = t.y - farmer.y;
      if (dx * dx + dy * dy < FARMER.catchRadius * FARMER.catchRadius) {
        loseLife(world, events, EVENT_CAUGHT);
        if (world.status !== 'playing') return events;
      }
    } else if (farmer.state === 'suspicious') {
      if (farmer.lastSeen) {
        const arrived = moveToward(farmer, farmer.lastSeen.x, farmer.lastSeen.y, FARMER.suspicious, dt, walls);
        if (arrived) {
          farmer.scan += dt;
          farmer.angle += dt * 1.6;
          if (farmer.scan > 2) { farmer.state = 'patrol'; farmer.lastSeen = null; }
        }
      } else farmer.state = 'patrol';
    } else {
      const wp = farmer.waypoints[farmer.waypointIndex];
      if (moveToward(farmer, wp.x, wp.y, FARMER.patrol, dt, walls)) {
        farmer.waypointIndex = (farmer.waypointIndex + 1) % farmer.waypoints.length;
      }
    }
  }

  // --- the dog: patrols fast, barks, and gives the turkey away ---
  for (const dog of world.dogs) {
    if (dog.barkCooldown > 0) dog.barkCooldown -= dt;
    const wp = dog.waypoints[dog.waypointIndex];
    if (moveToward(dog, wp.x, wp.y, DOG.patrol, dt, walls)) {
      dog.waypointIndex = (dog.waypointIndex + 1) % dog.waypoints.length;
    }
    if (dog.barkCooldown <= 0 && canSee(dog, DOG.visionRange, DOG.visionHalfAngle, world)) {
      dog.barkCooldown = 3;
      events.push(EVENT_BARK);
      for (const farmer of world.farmers) {
        const dx = t.x - farmer.x;
        const dy = t.y - farmer.y;
        if (dx * dx + dy * dy < DOG.barkRadius * DOG.barkRadius && farmer.state !== 'chase') {
          farmer.state = 'chase';
          farmer.lastSeen = { x: t.x, y: t.y };
          farmer.loseSight = 0;
        }
      }
    }
    const dx = t.x - dog.x;
    const dy = t.y - dog.y;
    if (dx * dx + dy * dy < (DOG.radius + TURKEY.radius + 4) * (DOG.radius + TURKEY.radius + 4)) {
      loseLife(world, events, EVENT_CAUGHT);
      if (world.status !== 'playing') return events;
    }
  }

  // --- the carving knife swings; the oven floor burns ---
  if (world.stage.knife) {
    world.knifeAngle += KNIFE.speed * dt;
    const pivot = world.stage.knife.pivot;
    const tipX = pivot.x + Math.cos(world.knifeAngle) * KNIFE.length;
    const tipY = pivot.y + Math.sin(world.knifeAngle) * KNIFE.length;
    const dx = t.x - tipX;
    const dy = t.y - tipY;
    if (dx * dx + dy * dy < KNIFE.hitRadius * KNIFE.hitRadius) {
      loseLife(world, events, EVENT_KNIFE);
      if (world.status !== 'playing') return events;
    }
  }
  for (const oven of world.stage.oven) {
    if (world.ovenCooldown <= 0 && pointInRect(t.x, t.y, oven)) {
      world.ovenCooldown = 1;
      loseLife(world, events, EVENT_BURN);
      if (world.status !== 'playing') return events;
    }
  }

  // --- corn, then the gate ---
  for (const cob of world.corn) {
    if (cob.taken) continue;
    const dx = t.x - cob.x;
    const dy = t.y - cob.y;
    if (dx * dx + dy * dy < 28 * 28) {
      cob.taken = true;
      world.score += cob.golden ? SCORE.goldenCorn : SCORE.corn;
      events.push(EVENT_CORN);
    }
  }
  const gate = world.stage.gate;
  if (pointInRect(t.x, t.y, gate)) {
    const timeBonus = Math.max(0, SCORE.timeBonusMax - Math.floor(world.stageTime) * 2);
    world.score += SCORE.stageClear + timeBonus;
    events.push(EVENT_STAGE);
    if (world.stageIndex >= STAGES.length - 1) {
      world.status = 'escaped';
      events.push(EVENT_ESCAPED);
    } else {
      const next = createWorld(world.stageIndex + 1, world.seed);
      next.score = world.score;
      next.lives = world.lives;
      next.time = world.time;
      Object.assign(world, next);
      world.status = 'playing';
    }
    return events;
  }

  world.alert = chased ? 'chased' : (world.farmers.some((f) => f.state === 'suspicious') ? 'spotted' : (t.hidden ? 'hidden' : 'calm'));
  return events;
}
