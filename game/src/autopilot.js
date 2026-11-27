// Self-play: the same steering the screenshot scenes use, and the Node test
// uses to prove the game can be won. It heads for the gate, ducks into a
// bush when a farmer is closing in, and never sprints in the open.
import { FARMER, KNIFE, STEP } from './config.js';

function distance(ax, ay, bx, by) {
  return Math.sqrt((ax - bx) * (ax - bx) + (ay - by) * (ay - by));
}

function nearestBush(world) {
  const t = world.turkey;
  let best = null;
  let bestDist = Infinity;
  for (const bush of world.stage.bushes) {
    const cx = bush.x + bush.w / 2;
    const cy = bush.y + bush.h / 2;
    const d = distance(t.x, t.y, cx, cy);
    if (d < bestDist) { bestDist = d; best = { x: cx, y: cy }; }
  }
  return best;
}

function knifeDanger(world) {
  if (!world.stage.knife) return null;
  const pivot = world.stage.knife.pivot;
  const tipX = pivot.x + Math.cos(world.knifeAngle) * KNIFE.length;
  const tipY = pivot.y + Math.sin(world.knifeAngle) * KNIFE.length;
  return { x: tipX, y: tipY };
}

function ovenDanger(world) {
  const t = world.turkey;
  for (const oven of world.stage.oven) {
    const cx = oven.x + oven.w / 2;
    const cy = oven.y + oven.h / 2;
    if (distance(t.x, t.y, cx, cy) < 110) return { x: cx, y: cy };
  }
  return null;
}

// Pick a target and a sprint flag for this step. The turkey follows its
// stage's nav waypoints to the gate (walls make a straight line unreliable),
// ducks into a bush when a farmer is closing in, and never sprints in the
// open. `bold` plays the end scene: it sprints whenever the coast is clear.
export function autopilotInput(world, bold = false) {
  const t = world.turkey;
  const gate = world.stage.gate;
  const gateX = gate.x + gate.w / 2;
  const gateY = gate.y + gate.h / 2;
  const nav = world.stage.nav || [];
  while (world.navIndex < nav.length && distance(t.x, t.y, nav[world.navIndex].x, nav[world.navIndex].y) < 45) {
    world.navIndex += 1;
  }
  const waypoint = world.navIndex < nav.length ? nav[world.navIndex] : { x: gateX, y: gateY };
  let target = { x: waypoint.x, y: waypoint.y };
  let sprint = false;
  const nearestFarmer = world.farmers.reduce(
    (best, f) => Math.min(best, distance(t.x, t.y, f.x, f.y)), Infinity);

  const chaser = world.farmers.find((f) => f.state === 'chase');
  const searcher = world.farmers.find((f) => f.state === 'suspicious');
  if (chaser) {
    // Run away from the farmer, toward the gate side if that is away too.
    const awayX = t.x + (t.x - chaser.x);
    const awayY = t.y + (t.y - chaser.y);
    const bush = nearestBush(world);
    const gateAway = (gateX - t.x) * (t.x - chaser.x) + (gateY - t.y) * (t.y - chaser.y) > 0;
    if (bush && !gateAway && distance(t.x, t.y, bush.x, bush.y) < 260) target = bush;
    else target = { x: awayX, y: awayY };
    sprint = t.stamina > 25;
  } else if (searcher) {
    const bush = nearestBush(world);
    if (bush && distance(t.x, t.y, bush.x, bush.y) < 200) target = bush;
    sprint = false;
  } else {
    // Calm: detour to the nearest corn when it is close and on the way.
    let corn = null;
    let cornDist = Infinity;
    for (const cob of world.corn) {
      if (cob.taken) continue;
      const d = distance(t.x, t.y, cob.x, cob.y);
      const towardGate = (cob.x - t.x) * (waypoint.x - t.x) + (cob.y - t.y) * (waypoint.y - t.y) > 0;
      if (d < cornDist && d < 170 && towardGate) { cornDist = d; corn = cob; }
    }
    if (corn) target = { x: corn.x, y: corn.y };
    sprint = bold && t.stamina > 40 && nearestFarmer > 250;
  }

  // Steer around the knife tip and the oven while they are near.
  const knife = knifeDanger(world);
  if (knife && distance(t.x, t.y, knife.x, knife.y) < 90) {
    target = { x: t.x + (t.x - knife.x) * 2, y: t.y + (t.y - knife.y) * 2 };
  }
  const oven = ovenDanger(world);
  if (oven && distance(t.x, t.y, oven.x, oven.y) < 110) {
    target = { x: t.x + (t.x - oven.x) * 2, y: t.y + (t.y - oven.y) * 2 };
  }

  const dx = target.x - t.x;
  const dy = target.y - t.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { mx: dx / len, my: dy / len, sprint, hide: false };
}

export { STEP };
