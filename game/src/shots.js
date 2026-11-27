// The screenshot scenes behind ?shot=start|play|chase|end. Each one plays the
// real rules forward from a fresh world for a fixed number of steps, steered
// by the autopilot, so the frame is what a short game really looks like and
// the same seed always gives the same frame.
import { STEP } from './config.js';
import { createWorld, stepWorld } from './world.js';
import { autopilotInput } from './autopilot.js';
import { SCREEN_ESCAPED, SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE } from './render.js';

const START_STEPS = 300;
const PLAY_STEPS = 480;
const CHASE_STEPS = 120;
const END_LIMIT_STEPS = 36000;

/**
 * Set `world` to the named scene and return the screen to draw over it and
 * the best score to show. Unknown names are the title scene.
 */
export function stageShot(name, world) {
  if (name === 'play') {
    const fresh = createWorld(0, world.seed);
    Object.assign(world, fresh);
    for (let i = 0; i < PLAY_STEPS; i += 1) {
      if (world.status !== 'playing') break;
      stepWorld(world, autopilotInput(world), STEP);
    }
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'chase') {
    const fresh = createWorld(2, world.seed);
    Object.assign(world, fresh);
    // Stage the chase for real: the turkey crosses the open kitchen floor
    // with the farmer a few steps behind it, so the frame shows the chase
    // the rules produce, not a quiet kitchen.
    const farmer = world.farmers[0];
    world.turkey.x = 480;
    world.turkey.y = 300;
    farmer.x = 370;
    farmer.y = 300;
    farmer.state = 'chase';
    farmer.lastSeen = { x: world.turkey.x, y: world.turkey.y };
    farmer.loseSight = 0;
    for (let i = 0; i < CHASE_STEPS; i += 1) {
      if (world.status !== 'playing') break;
      stepWorld(world, autopilotInput(world, true), STEP);
    }
    return { screen: SCREEN_PLAY, best: world.score };
  }
  if (name === 'end') {
    const fresh = createWorld(0, world.seed);
    Object.assign(world, fresh);
    for (let i = 0; i < END_LIMIT_STEPS; i += 1) {
      if (world.status !== 'playing') break;
      stepWorld(world, autopilotInput(world, true), STEP);
    }
    const escaped = world.status === 'escaped';
    return { screen: escaped ? SCREEN_ESCAPED : SCREEN_OVER, best: world.score };
  }
  const fresh = createWorld(0, world.seed);
  Object.assign(world, fresh);
  for (let i = 0; i < START_STEPS; i += 1) stepWorld(world, { mx: 0, my: 0, sprint: false, hide: false }, STEP);
  return { screen: SCREEN_TITLE, best: 0 };
}
