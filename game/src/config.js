// Gobble's Great Escape — tuning and stage layouts.
// One file holds every number the world, the autopilot and the renderer share,
// so a balance change is made once, here, and every system sees it.
export const VIEW = { width: 960, height: 600 };
export const STEP = 1 / 60;

export const TURKEY = {
  radius: 16,
  walk: 175,
  sprint: 265,
  staminaMax: 100,
  staminaDrain: 34,
  staminaRegen: 22,
  invulnerableSeconds: 2,
};

export const FARMER = {
  radius: 18,
  patrol: 95,
  chase: 205,
  suspicious: 130,
  visionRange: 235,
  visionHalfAngle: 0.62,
  loseSightSeconds: 2.5,
  catchRadius: 30,
};

export const DOG = {
  radius: 13,
  patrol: 150,
  visionRange: 165,
  visionHalfAngle: 0.9,
  barkRadius: 320,
};

export const KNIFE = { length: 110, speed: 1.5, hitRadius: 22 };
export const SCORE = { corn: 50, goldenCorn: 150, stageClear: 250, timeBonusMax: 200 };
export const LIVES = 3;

// A wall is a solid rectangle; a bush hides a still turkey; corn is a pickup;
// the gate is the stage exit; the oven is a hot floor tile that burns.
function stageFarmyard() {
  return {
    name: 'Farmyard',
    subtitle: 'Dawn in the yard — slip past the farmer to the gate',
    start: { x: 80, y: 520 },
    gate: { x: 884, y: 120, w: 56, h: 56 },
    nav: [{ x: 450, y: 500 }, { x: 450, y: 250 }, { x: 700, y: 150 }, { x: 850, y: 100 }],
    walls: [
      { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 576, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 600 }, { x: 936, y: 0, w: 24, h: 600 },
      { x: 250, y: 120, w: 180, h: 26 }, { x: 530, y: 300, w: 26, h: 150 },
      { x: 180, y: 380, w: 200, h: 26 },
    ],
    bushes: [
      { x: 90, y: 120, w: 110, h: 80 }, { x: 620, y: 90, w: 120, h: 80 },
      { x: 700, y: 420, w: 130, h: 90 },
    ],
    corn: [
      { x: 320, y: 90, golden: false }, { x: 470, y: 200, golden: false },
      { x: 640, y: 250, golden: false }, { x: 300, y: 470, golden: false },
      { x: 820, y: 300, golden: true }, { x: 120, y: 300, golden: false },
    ],
    oven: [],
    knife: null,
    farmers: [
      { waypoints: [{ x: 300, y: 200 }, { x: 700, y: 200 }, { x: 700, y: 430 }, { x: 300, y: 430 }] },
    ],
    dogs: [],
  };
}

function stageBarn() {
  return {
    name: 'The Barn',
    subtitle: 'Hay bales, a nosy dog, and the farmer with his lantern',
    start: { x: 80, y: 520 },
    gate: { x: 884, y: 120, w: 56, h: 56 },
    nav: [{ x: 400, y: 500 }, { x: 400, y: 300 }, { x: 400, y: 150 }, { x: 600, y: 120 }, { x: 850, y: 120 }],
    walls: [
      { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 576, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 600 }, { x: 936, y: 0, w: 24, h: 600 },
      { x: 200, y: 100, w: 26, h: 180 }, { x: 480, y: 320, w: 26, h: 180 },
      { x: 660, y: 80, w: 200, h: 26 }, { x: 120, y: 420, w: 220, h: 26 },
    ],
    bushes: [
      { x: 260, y: 120, w: 130, h: 90 }, { x: 540, y: 420, w: 130, h: 90 },
      { x: 760, y: 300, w: 120, h: 90 },
    ],
    corn: [
      { x: 330, y: 300, golden: false }, { x: 580, y: 180, golden: false },
      { x: 830, y: 180, golden: false }, { x: 430, y: 480, golden: false },
      { x: 130, y: 200, golden: true }, { x: 700, y: 520, golden: false },
    ],
    oven: [],
    knife: null,
    farmers: [
      { waypoints: [{ x: 400, y: 150 }, { x: 820, y: 150 }, { x: 820, y: 480 }, { x: 400, y: 480 }] },
    ],
    dogs: [
      { waypoints: [{ x: 150, y: 150 }, { x: 150, y: 480 }, { x: 600, y: 480 }, { x: 600, y: 150 }] },
    ],
  };
}

function stageKitchen() {
  return {
    name: 'The Kitchen',
    subtitle: 'The oven is lit and the knife is out — reach the back door',
    start: { x: 80, y: 520 },
    gate: { x: 884, y: 120, w: 56, h: 56 },
    nav: [{ x: 200, y: 450 }, { x: 200, y: 200 }, { x: 450, y: 120 }, { x: 700, y: 200 }, { x: 850, y: 120 }],
    walls: [
      { x: 0, y: 0, w: 960, h: 24 }, { x: 0, y: 576, w: 960, h: 24 },
      { x: 0, y: 0, w: 24, h: 600 }, { x: 936, y: 0, w: 24, h: 600 },
      { x: 300, y: 150, w: 26, h: 160 }, { x: 620, y: 330, w: 26, h: 160 },
    ],
    bushes: [
      { x: 120, y: 110, w: 120, h: 80 }, { x: 700, y: 130, w: 120, h: 80 },
    ],
    corn: [
      { x: 380, y: 90, golden: false }, { x: 500, y: 480, golden: false },
      { x: 820, y: 300, golden: true }, { x: 200, y: 300, golden: false },
    ],
    oven: [
      { x: 340, y: 520, w: 280, h: 56 },
      { x: 60, y: 240, w: 56, h: 140 },
    ],
    knife: { pivot: { x: 480, y: 300 }, angle: 0 },
    farmers: [
      { waypoints: [{ x: 250, y: 250 }, { x: 750, y: 250 }, { x: 750, y: 450 }, { x: 250, y: 450 }] },
    ],
    dogs: [
      { waypoints: [{ x: 850, y: 150 }, { x: 850, y: 500 }, { x: 550, y: 500 }, { x: 550, y: 150 }] },
    ],
  };
}

export const STAGES = [stageFarmyard(), stageBarn(), stageKitchen()];

export function rankFor(score, seconds) {
  if (score >= 2200 && seconds <= 240) return 'S';
  if (score >= 1700) return 'A';
  if (score >= 1200) return 'B';
  return 'C';
}
