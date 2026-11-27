// Gobble's Great Escape — everything the player sees, drawn on one canvas
// with flat shapes and the game's own autumn palette. No image files: the
// turkey, the farmer, the dog and the farm are all drawn from code.
import { DOG, FARMER, KNIFE, TURKEY, VIEW } from './config.js';
import { distanceToGate } from './world.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';
export const SCREEN_ESCAPED = 'escaped';
export const SCREEN_PAUSE = 'pause';

const PALETTE = {
  grass: '#7da65c', grassDark: '#6d9450', dirt: '#c9a06a', barn: '#8a5a34',
  barnDark: '#744a2b', kitchen: '#d8cfc0', tile: '#cfc3b0', wall: '#5d4030',
  bush: '#3f7a34', bushDark: '#2f5e28', oven: '#c0392b', ovenHot: '#ff6b35',
  gate: '#f4d35e', corn: '#ffd23f', gold: '#ffb703', heart: '#e63946',
};

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawTurkey(ctx, x, y, angle, hidden, invulnerable, t) {
  ctx.save();
  ctx.translate(x, y);
  if (invulnerable > 0 && Math.floor(t * 8) % 2 === 0) ctx.globalAlpha = 0.45;
  ctx.rotate(angle + Math.PI / 2);
  const waddle = Math.sin(t * 14) * 0.06;
  ctx.rotate(waddle);
  // Tail fan.
  ctx.fillStyle = '#8b5a2b';
  for (let i = -2; i <= 2; i += 1) {
    ctx.save();
    ctx.rotate(i * 0.35);
    ctx.beginPath();
    ctx.ellipse(0, -20, 6, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // Body, wing, head, beak and wattle.
  ctx.fillStyle = '#a06830';
  ctx.beginPath(); ctx.ellipse(0, 0, 15, 17, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7a4a20';
  ctx.beginPath(); ctx.ellipse(-9, 2, 6, 10, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c98a4b';
  ctx.beginPath(); ctx.arc(0, -16, 9, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ff8c1a';
  ctx.beginPath(); ctx.moveTo(-4, -20); ctx.lineTo(4, -20); ctx.lineTo(0, -13); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#d62828';
  ctx.beginPath(); ctx.ellipse(0, -11, 2.5, 4, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-3.5, -18, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(3.5, -18, 1.6, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  if (hidden) {
    ctx.fillStyle = 'rgba(47, 94, 40, 0.55)';
    ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.fill();
  }
}

function drawFarmer(ctx, farmer, chasing) {
  ctx.save();
  ctx.translate(farmer.x, farmer.y);
  // Vision cone: amber while patrolling, red while chasing.
  ctx.save();
  ctx.rotate(farmer.angle);
  ctx.fillStyle = chasing ? 'rgba(230, 57, 70, 0.20)' : 'rgba(244, 211, 94, 0.16)';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, FARMER.visionRange, -FARMER.visionHalfAngle, FARMER.visionHalfAngle);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
  ctx.rotate(farmer.angle + Math.PI / 2);
  ctx.fillStyle = '#3a6ea5';
  ctx.beginPath(); ctx.ellipse(0, 0, 16, 18, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(0, -17, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4d35e';
  ctx.beginPath(); ctx.ellipse(0, -21, 14, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath(); ctx.arc(-11, -2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(11, -2, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(-4, -19, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(4, -19, 1.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawDog(ctx, dog, t) {
  ctx.save();
  ctx.translate(dog.x, dog.y);
  ctx.rotate(dog.angle + Math.PI / 2 + Math.sin(t * 10) * 0.05);
  ctx.fillStyle = '#6b4226';
  ctx.beginPath(); ctx.ellipse(0, 0, 11, 14, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#4a2c17';
  ctx.beginPath(); ctx.ellipse(-8, -10, 3.5, 6, -0.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(8, -10, 3.5, 6, 0.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8a5a34';
  ctx.beginPath(); ctx.arc(0, -13, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#1b1b1b';
  ctx.beginPath(); ctx.arc(0, -17, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawFloor(ctx, world) {
  const stage = world.stage;
  if (world.stageIndex === 2) {
    ctx.fillStyle = PALETTE.kitchen;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = PALETTE.tile;
    for (let y = 0; y < VIEW.height; y += 60) {
      for (let x = 0; x < VIEW.width; x += 60) {
        if ((x + y) % 120 === 0) ctx.fillRect(x, y, 58, 58);
      }
    }
  } else if (world.stageIndex === 1) {
    ctx.fillStyle = PALETTE.barn;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = PALETTE.barnDark;
    for (let y = 24; y < VIEW.height; y += 48) ctx.fillRect(0, y, VIEW.width, 3);
  } else {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = PALETTE.grassDark;
    for (let i = 0; i < 40; i += 1) {
      const x = (i * 173) % VIEW.width;
      const y = (i * 97) % VIEW.height;
      ctx.fillRect(x, y, 26, 4);
    }
    ctx.fillStyle = PALETTE.dirt;
    ctx.beginPath();
    ctx.ellipse(480, 300, 330, 90, 0.12, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGate(ctx, gate, t) {
  const pulse = 1 + Math.sin(t * 3) * 0.06;
  ctx.save();
  ctx.translate(gate.x + gate.w / 2, gate.y + gate.h / 2);
  ctx.scale(pulse, pulse);
  ctx.fillStyle = '#2f5e28';
  roundRect(ctx, -30, -28, 60, 56, 8);
  ctx.fill();
  ctx.fillStyle = PALETTE.gate;
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('GATE', 0, -34);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText('→', 0, 8);
  ctx.font = '11px sans-serif';
  ctx.fillText('FREEDOM', 0, 24);
  ctx.restore();
}

function drawKnife(ctx, pivot, angle) {
  ctx.save();
  ctx.translate(pivot.x, pivot.y);
  ctx.rotate(angle);
  ctx.fillStyle = '#8d99ae';
  ctx.beginPath();
  ctx.moveTo(10, -7);
  ctx.lineTo(KNIFE.length, -4);
  ctx.lineTo(KNIFE.length, 4);
  ctx.lineTo(10, 7);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5c3d24';
  ctx.fillRect(-14, -8, 24, 16);
  ctx.fillStyle = '#e63946';
  ctx.beginPath(); ctx.arc(KNIFE.length, 0, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
  ctx.fillStyle = '#5c3d24';
  ctx.beginPath(); ctx.arc(pivot.x, pivot.y, 10, 0, Math.PI * 2); ctx.fill();
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = 'rgba(20, 16, 10, 0.72)';
  roundRect(ctx, x, y, w, h, 12);
  ctx.fill();
}

function drawHud(ctx, world) {
  const t = world.turkey;
  panel(ctx, 12, 10, 250, 64);
  ctx.fillStyle = '#fff';
  ctx.textAlign = 'left';
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(`Score ${world.score}`, 24, 36);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#ffd23f';
  ctx.fillText(`${world.stage.name}  •  Gate ${distanceToGate(world)}m`, 24, 58);
  panel(ctx, VIEW.width - 262, 10, 250, 64);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 20px sans-serif';
  let hearts = '';
  for (let i = 0; i < world.lives; i += 1) hearts += '♥ ';
  ctx.fillStyle = PALETTE.heart;
  ctx.fillText(hearts || '—', VIEW.width - 24, 36);
  ctx.fillStyle = '#fff';
  ctx.font = '13px sans-serif';
  ctx.fillText(`Stamina ${Math.round(t.stamina)}`, VIEW.width - 24, 58);
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fillRect(VIEW.width - 238, 64, 214, 6);
  ctx.fillStyle = t.stamina > 30 ? '#7bd88a' : '#e63946';
  ctx.fillRect(VIEW.width - 238, 64, 214 * (t.stamina / 100), 6);

  if (world.alert === 'chased') {
    panel(ctx, VIEW.width / 2 - 130, 84, 260, 34);
    ctx.fillStyle = '#ff5964';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('! SPOTTED — RUN !', VIEW.width / 2, 107);
  } else if (world.alert === 'spotted') {
    panel(ctx, VIEW.width / 2 - 130, 84, 260, 34);
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('The farmer is looking…', VIEW.width / 2, 107);
  } else if (world.alert === 'hidden') {
    panel(ctx, VIEW.width / 2 - 110, 84, 220, 34);
    ctx.fillStyle = '#7bd88a';
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Hidden in the bush', VIEW.width / 2, 107);
  }
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('WASD / arrows move • Shift sprint • H hide in a bush • click to walk • P pause • M mute', VIEW.width / 2, VIEW.height - 12);
}

function drawTitle(ctx, world, best) {
  ctx.fillStyle = 'rgba(30, 20, 8, 0.45)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 180, 90, 600, 380);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 46px sans-serif';
  ctx.fillText("GOBBLE'S", 480, 165);
  ctx.fillStyle = '#fff';
  ctx.fillText('GREAT ESCAPE', 480, 215);
  ctx.fillStyle = '#ffb703';
  ctx.font = 'italic 18px sans-serif';
  ctx.fillText('Thanksgiving is coming. The farmer is coming faster.', 480, 252);
  ctx.fillStyle = '#fff';
  ctx.font = '15px sans-serif';
  ctx.fillText('Sneak past the farmer, dodge the dog, the oven and the carving knife,', 480, 292);
  ctx.fillText('grab the corn, and reach the gate — through the farmyard, the barn,', 480, 314);
  ctx.fillText('and the kitchen. Three lives. One very nervous turkey.', 480, 336);
  ctx.fillStyle = '#7bd88a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Press ENTER or click to start', 480, 386);
  ctx.fillStyle = '#fff';
  ctx.font = '14px sans-serif';
  ctx.fillText('WASD / arrows move  •  Shift sprint (loud!)  •  H hide in a bush  •  click to walk', 480, 420);
  if (best > 0) {
    ctx.fillStyle = '#ffd23f';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Best escape so far: ${best}`, 480, 448);
  }
  drawTurkey(ctx, 480, 505, -Math.PI / 2, false, 0, 0.4);
}

function drawEnd(ctx, world, best, escaped) {
  ctx.fillStyle = escaped ? 'rgba(20, 60, 20, 0.55)' : 'rgba(60, 10, 10, 0.55)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  panel(ctx, 230, 110, 500, 340);
  ctx.textAlign = 'center';
  if (escaped) {
    ctx.fillStyle = '#7bd88a';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('FREE AT LAST!', 480, 185);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('Gobble slipped the gate, the farmer, the dog,', 480, 225);
    ctx.fillText('the oven and the knife — and Thanksgiving', 480, 250);
    ctx.fillText('will have to do without him this year.', 480, 275);
  } else {
    ctx.fillStyle = '#ff5964';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('CAUGHT!', 480, 185);
    ctx.fillStyle = '#fff';
    ctx.font = '18px sans-serif';
    ctx.fillText('The farmer has his turkey. Dinner is served…', 480, 225);
    ctx.fillText('…unless you try again, quicker and quieter.', 480, 250);
  }
  ctx.fillStyle = '#ffd23f';
  ctx.font = 'bold 22px sans-serif';
  ctx.fillText(`Score ${world.score}   •   Best ${Math.max(best, world.score)}`, 480, 320);
  if (escaped) {
    ctx.fillStyle = '#fff';
    ctx.font = '17px sans-serif';
    ctx.fillText(`Escape rank: ${world.rank || 'C'} — ${world.time.toFixed(0)} seconds on the run`, 480, 352);
  }
  ctx.fillStyle = '#7bd88a';
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Press R or click to play again', 480, 400);
}

export function drawWorld(ctx, world, screen, best) {
  const t = world.time;
  drawFloor(ctx, world);
  for (const oven of world.stage.oven) {
    ctx.fillStyle = Math.floor(t * 4) % 2 === 0 ? PALETTE.ovenHot : PALETTE.oven;
    roundRect(ctx, oven.x, oven.y, oven.w, oven.h, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('HOT OVEN', oven.x + oven.w / 2, oven.y + oven.h / 2 + 5);
  }
  for (const bush of world.stage.bushes) {
    ctx.fillStyle = PALETTE.bushDark;
    roundRect(ctx, bush.x, bush.y, bush.w, bush.h, 18);
    ctx.fill();
    ctx.fillStyle = PALETTE.bush;
    for (let i = 0; i < 6; i += 1) {
      ctx.beginPath();
      ctx.arc(bush.x + 18 + i * 18, bush.y + bush.h / 2 + (i % 2 === 0 ? -12 : 10), 16, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.fillStyle = PALETTE.wall;
  for (const wall of world.stage.walls) ctx.fillRect(wall.x, wall.y, wall.w, wall.h);
  for (const cob of world.corn) {
    if (cob.taken) continue;
    ctx.save();
    ctx.translate(cob.x, cob.y + Math.sin(t * 3 + cob.x) * 2);
    ctx.fillStyle = cob.golden ? PALETTE.gold : PALETTE.corn;
    ctx.beginPath(); ctx.ellipse(0, 0, 9, 13, 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3f7a34';
    ctx.fillRect(-2, -18, 4, 8);
    ctx.restore();
  }
  drawGate(ctx, world.stage.gate, t);
  if (world.stage.knife) drawKnife(ctx, world.stage.knife.pivot, world.knifeAngle);
  for (const dog of world.dogs) drawDog(ctx, dog, t);
  for (const farmer of world.farmers) drawFarmer(ctx, farmer, farmer.state === 'chase');
  if (screen !== SCREEN_TITLE) {
    drawTurkey(ctx, world.turkey.x, world.turkey.y, world.turkey.angle, world.turkey.hidden, world.turkey.invulnerable, t);
  }
  if (screen === SCREEN_PLAY || screen === SCREEN_PAUSE) drawHud(ctx, world);
  if (screen === SCREEN_TITLE) drawTitle(ctx, world, best);
  if (screen === SCREEN_OVER) drawEnd(ctx, world, best, false);
  if (screen === SCREEN_ESCAPED) drawEnd(ctx, world, best, true);
  if (screen === SCREEN_PAUSE) {
    ctx.fillStyle = 'rgba(20, 16, 10, 0.6)';
    ctx.fillRect(0, 0, VIEW.width, VIEW.height);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 40px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', VIEW.width / 2, VIEW.height / 2);
    ctx.font = '16px sans-serif';
    ctx.fillText('Press P to keep running', VIEW.width / 2, VIEW.height / 2 + 32);
  }
}
