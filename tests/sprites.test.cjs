'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../assets/sprites.js');

test('sprite atlas manifest contains the full requested cast', () => {
  const names = Object.keys(manifest.frames);
  assert.ok(names.includes('player_idle'));
  assert.ok(names.includes('player_eat'));
  assert.ok(names.includes('rival_beast'));
  assert.ok(names.includes('rival_armored'));
  for (let i = 0; i < 7; i++) assert.ok(names.includes('human_' + i));
  assert.equal(names.length, 11);
});

test('every sprite frame stays inside the atlas bounds', () => {
  for (const [name, frame] of Object.entries(manifest.frames)) {
    assert.ok(frame.w > 0 && frame.h > 0, name);
    assert.ok(frame.x >= 0 && frame.y >= 0, name);
    assert.ok(frame.x + frame.w <= manifest.width, name);
    assert.ok(frame.y + frame.h <= manifest.height, name);
  }
});

test('atlas PNG exists and matches the manifest dimensions', () => {
  const file = path.join(__dirname, '..', manifest.src.replace(/^\.\//, ''));
  const buffer = fs.readFileSync(file);
  assert.equal(buffer.toString('ascii', 1, 4), 'PNG');
  assert.equal(buffer.readUInt32BE(16), manifest.width);
  assert.equal(buffer.readUInt32BE(20), manifest.height);
});
