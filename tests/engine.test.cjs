'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { HungerEngine, segmentHitsEllipse, clamp } = require('../game.js');

function seeded(seed) {
  return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
}
function target(engine, kind, x = engine.width / 2, y = engine.mouthY) {
  const entity = { id: 999, kind, x, y, variant: 0, phase: 0 };
  engine.entities.push(entity);
  return entity;
}

test('menu is idle; starting resets the complete round state', () => {
  const game = new HungerEngine({ random: seeded(1) });
  game.update(1);
  assert.equal(game.elapsed, 0);
  assert.equal(game.entities.length, 0);
  game.start();
  assert.equal(game.state, 'playing');
  assert.equal(game.score, 0);
  assert.equal(game.player.x, 240);
  assert.equal(game.player.targetX, 240);
});

test('a human gives exactly one point, a capture event, and is removed', () => {
  const game = new HungerEngine(); game.start(); game.drainEvents();
  target(game, 'human', 240, game.mouthY - 1);
  game.update(1 / 60);
  assert.equal(game.score, 1);
  assert.equal(game.entities.length, 0);
  assert.ok(game.player.munch > 0.23 && game.player.munch <= 0.25);
  assert.deepEqual(game.drainEvents().map(e => e.type), ['capture']);
  game.update(1 / 60);
  assert.equal(game.score, 1);
});

test('a titan ends the game immediately and freezes all remaining entities', () => {
  const game = new HungerEngine(); game.start();
  target(game, 'titan', 240, game.mouthY - 1);
  const laterHuman = target(game, 'human', 240, game.mouthY - 1);
  game.update(1 / 60);
  assert.equal(game.state, 'over');
  assert.equal(game.score, 0);
  const frozen = JSON.stringify(game.entities);
  const elapsed = game.elapsed;
  game.update(1);
  assert.equal(JSON.stringify(game.entities), frozen);
  assert.equal(game.elapsed, elapsed);
  assert.ok(game.entities.includes(laterHuman));
  assert.ok(game.drainEvents().some(e => e.type === 'defeat'));
});

test('earlier captures count before defeat, without stale duplicate entities', () => {
  const game = new HungerEngine(); game.start();
  target(game, 'human', 240, game.mouthY - 1);
  const titan = target(game, 'titan', 240, game.mouthY - 1);
  const later = target(game, 'human', 100, 100);
  game.update(1 / 60);
  assert.equal(game.score, 1);
  assert.equal(game.state, 'over');
  assert.deepEqual(game.entities, [titan, later]);
});

test('missing a human costs nothing and offscreen entities are recycled', () => {
  const game = new HungerEngine(); game.start();
  target(game, 'human', 50, game.height + 64);
  game.update(1 / 60);
  assert.equal(game.score, 0);
  assert.equal(game.entities.length, 0);
  assert.equal(game.pool.length, 1);
  assert.equal(game.state, 'playing');
});

test('near misses do not collide; swept collisions catch fast crossings', () => {
  assert.equal(segmentHitsEllipse(40, -100, 40, 100, 39, 43), false);
  assert.equal(segmentHitsEllipse(0, -100, 0, 100, 39, 43), true);
  assert.equal(segmentHitsEllipse(10, 10, 10, 10, 39, 43), true);
  const game = new HungerEngine({ height: 10000 }); game.start();
  target(game, 'human', 240, game.mouthY - 75);
  game.update(0.05);
  assert.equal(game.score, 1);
});

test('pause/resume preserves score, positions and elapsed time', () => {
  const game = new HungerEngine({ random: seeded(3) }); game.start();
  game.update(0.05); game.pause();
  const before = JSON.stringify({ entities: game.entities, player: game.player, elapsed: game.elapsed });
  game.update(0.05);
  assert.equal(JSON.stringify({ entities: game.entities, player: game.player, elapsed: game.elapsed }), before);
  assert.equal(game.resume(), true);
  game.update(0.05);
  assert.ok(game.elapsed > 0.05);
});

test('movement is responsive, bounded, and ignores invalid coordinates', () => {
  const game = new HungerEngine(); game.start();
  game.setTarget(-999);
  for (let i = 0; i < 4; i++) game.update(0.05);
  assert.equal(game.player.x, 43);
  game.setTarget(9999);
  for (let i = 0; i < 6; i++) game.update(0.05);
  assert.equal(game.player.x, game.width - 43);
  game.setTarget(NaN);
  assert.equal(game.player.targetX, game.width - 43);
  game.move(-1, 0.05);
  assert.ok(game.player.targetX < game.width - 43);
  assert.equal(clamp(9, 0, 5), 5);
});

test('difficulty increases gradually and remains bounded', () => {
  const game = new HungerEngine();
  const initialSpeed = game.fallSpeed;
  const initialInterval = game.spawnInterval;
  game.score = 20;
  assert.ok(game.fallSpeed > initialSpeed);
  assert.ok(game.spawnInterval < initialInterval);
  assert.equal(game.level, 3);
  game.score = 100000;
  assert.equal(game.fallSpeed, game.height * 0.53);
  assert.equal(game.spawnInterval, 0.58);
  // Even the fastest waves leave more vertical space than a titan occupies.
  assert.ok(game.fallSpeed * game.spawnInterval * 0.94 > 150);
});

test('short landscape worlds preserve a fair absolute spawn gap at max speed', () => {
  const game = new HungerEngine({ width: 844, height: 360 });
  game.score = 100000;
  assert.ok(game.fallSpeed * game.spawnInterval * 0.94 > 150);
});

test('resize preserves relative positions and play state', () => {
  const game = new HungerEngine(); game.start();
  const entity = target(game, 'human', 120, 200);
  game.resize(840, 390);
  assert.equal(game.player.x, 420);
  assert.equal(entity.x, 210);
  assert.equal(entity.y, 97.5);
  assert.equal(game.state, 'playing');
  game.resize(-1, 0);
  assert.equal(game.width, 840);
});

test('invalid deltas do not advance or break the simulation', () => {
  const game = new HungerEngine(); game.start();
  for (const dt of [0, -1, NaN, Infinity]) game.update(dt);
  assert.equal(game.elapsed, 0);
  assert.equal(game.entities.length, 0);
});

test('100 restarts clear targets, score, input and pending events', () => {
  const game = new HungerEngine({ random: seeded(8) });
  for (let i = 0; i < 100; i++) {
    game.start();
    game.setTarget(50);
    for (let frame = 0; frame < 40; frame++) game.update(1 / 60);
    const obstacle = game.entities[0] || target(game, 'titan');
    obstacle.kind = 'titan'; obstacle.x = game.player.x; obstacle.y = game.mouthY;
    game.update(1 / 60);
    assert.equal(game.state, 'over');
    game.start();
    assert.equal(game.score, 0);
    assert.equal(game.entities.length, 0);
    assert.equal(game.player.x, game.width / 2);
    assert.equal(game.player.targetX, game.width / 2);
    assert.equal(game.player.munch, 0);
    assert.deepEqual(game.drainEvents(), [{ type: 'start' }]);
  }
  assert.ok(game.pool.length < 20);
});

test('long seeded sessions keep fair spacing, no target overlap and bounded memory', () => {
  for (let seed = 1; seed <= 24; seed++) {
    const game = new HungerEngine({ random: seeded(seed) }); game.start();
    let lastSerial = 0;
    let titanStreak = 0;
    for (let frame = 0; frame < 60 * 90; frame++) {
      // A simple legal autoplayer demonstrates that every wave has an escape.
      const threats = game.entities.filter(e => e.kind === 'titan' && e.y > game.mouthY - 180 && e.y < game.mouthY + 80);
      if (threats.length) {
        let safeX = game.player.x;
        let bestClearance = -Infinity;
        for (let x = 48; x <= game.width - 48; x += 16) {
          const clearance = Math.min(...threats.map(e => Math.abs(e.x - x))) - Math.abs(game.player.x - x) * 0.05;
          if (clearance > bestClearance) { bestClearance = clearance; safeX = x; }
        }
        game.setTarget(safeX);
      } else {
        const human = game.entities.filter(e => e.kind === 'human' && e.y < game.mouthY).sort((a,b) => b.y-a.y)[0];
        if (human) game.setTarget(human.x);
      }
      game.update(1 / 60);
      assert.notEqual(game.state, 'over', `unavoidable collision with seed ${seed}`);
      assert.ok(game.entities.length <= 10);
      for (const entity of game.entities) {
        if (entity.id > lastSerial) {
          lastSerial = entity.id;
          titanStreak = entity.kind === 'titan' ? titanStreak + 1 : 0;
          assert.ok(titanStreak <= 2);
          const previous = game.entities[game.entities.length - 2];
          if (previous) assert.ok(entity.y - previous.y < -100 || game.height < 500);
        }
        assert.ok(entity.x >= 43 && entity.x <= game.width - 43);
      }
      game.drainEvents();
    }
    assert.ok(game.score > 40);
    assert.ok(game.pool.length <= 10);
  }
});
