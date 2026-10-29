/* Attack of Hunger — lógica do jogo independente do DOM.
 * Coordenadas em unidades lógicas, nunca em pixels DPR.
 * This file also works in Node so the game rules can be tested without a browser.
 */
(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.HungerGame = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const FIXED_STEP = 1 / 120;

  // Swept collision in ellipse space: a fast target cannot skip the player.
  function segmentHitsEllipse(ax, ay, bx, by, rx, ry) {
    const sx = ax / rx;
    const sy = ay / ry;
    const dx = (bx - ax) / rx;
    const dy = (by - ay) / ry;
    const lengthSquared = dx * dx + dy * dy;
    const t = lengthSquared > 0
      ? clamp(-(sx * dx + sy * dy) / lengthSquared, 0, 1)
      : 0;
    const x = sx + t * dx;
    const y = sy + t * dy;
    return x * x + y * y <= 1;
  }

  class HungerEngine {
    constructor(options = {}) {
      this.width = options.width || 480;
      this.height = options.height || 800;
      this.random = options.random || Math.random;
      this.state = 'menu';
      this.score = 0;
      this.elapsed = 0;
      this.entities = [];
      this.pool = [];
      this.events = [];
      this.player = { x: this.width / 2, targetX: this.width / 2, munch: 0 };
      this.spawnClock = 0.5;
      this.spawnCount = 0;
      this.lastLane = -1;
      this.titanStreak = 0;
      this.humanStreak = 0;
      this.serial = 0;
    }

    get mouthY() { return this.height - 103; }
    get level() { return 1 + Math.floor(this.score / 10); }
    get timeSpeedBoost() {
      // Speed ramps up with survived time even if the player scores nothing.
      // Full time bonus is reached after 150 seconds and then stays capped.
      return Math.min(Math.max(this.elapsed, 0) / 150, 1) * 0.12;
    }
    get fallSpeed() {
      const scoreBoost = Math.min(this.score, 100) * 0.00275;
      return this.height * Math.min(0.65, 0.255 + scoreBoost + this.timeSpeedBoost);
    }
    get spawnInterval() {
      // In short landscape worlds, keep a minimum absolute vertical gap as well.
      // Use the maximum possible fall speed (score + time) for fairness.
      const fairnessFloor = Math.max(0.58, 160 / (this.height * 0.65));
      return Math.max(fairnessFloor, 1.06 - this.score * 0.0065);
    }
    get laneCount() { return clamp(Math.floor((this.width - 72) / 72), 4, 10); }

    start() {
      while (this.entities.length) this.pool.push(this.entities.pop());
      this.score = 0;
      this.elapsed = 0;
      this.spawnClock = 0.45;
      this.spawnCount = 0;
      this.lastLane = -1;
      this.titanStreak = 0;
      this.humanStreak = 0;
      this.serial = 0;
      this.events.length = 0;
      this.player.x = this.width / 2;
      this.player.targetX = this.width / 2;
      this.player.munch = 0;
      this.state = 'playing';
      this.events.push({ type: 'start' });
    }

    pause() {
      if (this.state !== 'playing') return false;
      this.state = 'paused';
      return true;
    }

    resume() {
      if (this.state !== 'paused') return false;
      this.state = 'playing';
      return true;
    }

    menu() {
      this.state = 'menu';
      this.events.length = 0;
      while (this.entities.length) this.pool.push(this.entities.pop());
    }

    resize(width, height) {
      if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return;
      const sx = width / this.width;
      const sy = height / this.height;
      this.player.x *= sx;
      this.player.targetX *= sx;
      for (const entity of this.entities) {
        entity.x *= sx;
        entity.y *= sy;
      }
      this.width = width;
      this.height = height;
      this.setTarget(this.player.targetX);
    }

    setTarget(x) {
      if (Number.isFinite(x)) this.player.targetX = clamp(x, 43, this.width - 43);
    }

    move(direction, dt) {
      this.setTarget(this.player.targetX + direction * this.width * 1.8 * dt);
    }

    laneX(lane) {
      const margin = 48;
      return margin + lane * (this.width - margin * 2) / (this.laneCount - 1);
    }

    spawn() {
      // One target per wave, with a generous vertical gap even at maximum speed.
      // There is always an open lane; we never generate an unavoidable wall.
      const roll = this.random();
      let kind = this.spawnCount < 3 || roll > 0.33 ? 'human' : 'titan';
      if (this.titanStreak >= 2) kind = 'human';
      if (this.humanStreak >= 4) kind = 'titan';
      let lane = Math.floor(this.random() * this.laneCount);
      if (lane === this.lastLane) lane = (lane + 1 + Math.floor(this.random() * (this.laneCount - 1))) % this.laneCount;
      if (this.spawnCount === 0) lane = Math.floor(this.laneCount / 2);
      const entity = this.pool.pop() || {};
      entity.id = ++this.serial;
      entity.kind = kind;
      entity.x = this.laneX(clamp(lane, 0, this.laneCount - 1));
      entity.y = -48;
      entity.variant = Math.floor(this.random() * 3);
      entity.phase = this.random() * Math.PI * 2;
      this.entities.push(entity);
      this.lastLane = lane;
      this.spawnCount++;
      this.titanStreak = kind === 'titan' ? this.titanStreak + 1 : 0;
      this.humanStreak = kind === 'human' ? this.humanStreak + 1 : 0;
    }

    update(delta) {
      if (this.state !== 'playing' || !Number.isFinite(delta) || delta <= 0) return;
      // Cap long frames. Background tabs are explicitly paused by the controller.
      let remaining = Math.min(delta, 0.05);
      while (remaining > 0.000001 && this.state === 'playing') {
        const dt = Math.min(FIXED_STEP, remaining);
        this.step(dt);
        remaining -= dt;
      }
    }

    step(dt) {
      this.elapsed += dt;
      const previousX = this.player.x;
      const maxMove = this.width * 3.4 * dt;
      this.player.x += clamp(this.player.targetX - this.player.x, -maxMove, maxMove);
      this.player.munch = Math.max(0, this.player.munch - dt);
      this.spawnClock -= dt;
      if (this.spawnClock <= 0) {
        this.spawn();
        this.spawnClock += this.spawnInterval * (0.94 + this.random() * 0.12);
      }

      let writeIndex = 0;
      for (let i = 0; i < this.entities.length; i++) {
        const entity = this.entities[i];
        const oldY = entity.y;
        entity.y += this.fallSpeed * dt;
        const isTitan = entity.kind === 'titan';
        const hit = segmentHitsEllipse(
          entity.x - previousX, oldY - this.mouthY,
          entity.x - this.player.x, entity.y - this.mouthY,
          isTitan ? 51 : 39, isTitan ? 57 : 43
        );
        if (hit) {
          if (isTitan) {
            // Compact earlier captures, but keep this titan and all later targets.
            // Defeat freezes the exact collision frame without stale duplicates.
            this.entities[writeIndex++] = entity;
            for (let j = i + 1; j < this.entities.length; j++) this.entities[writeIndex++] = this.entities[j];
            this.entities.length = writeIndex;
            this.state = 'over';
            this.events.push({ type: 'defeat', x: entity.x, y: entity.y, score: this.score });
            return;
          }
          this.score++;
          this.player.munch = 0.25;
          this.events.push({ type: 'capture', x: entity.x, y: entity.y, score: this.score });
          this.pool.push(entity);
          continue;
        }
        if (entity.y > this.height + 65) {
          this.pool.push(entity);
          continue;
        }
        this.entities[writeIndex++] = entity;
      }
      this.entities.length = writeIndex;
    }

    drainEvents() {
      const events = this.events.slice();
      this.events.length = 0;
      return events;
    }
  }

  return { HungerEngine, segmentHitsEllipse, clamp };
});
