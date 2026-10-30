/* Attack of Hunger — sprite atlas metadata (user-provided artwork). */
(function (root, factory) {
  'use strict';
  const data = factory();
  if (typeof module === 'object' && module.exports) module.exports = data;
  else root.HungerSprites = data;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  return {
  "src": "./assets/sprites.png",
  "width": 1024,
  "height": 1789,
  "frames": {
    "player_idle": {
      "x": 6,
      "y": 6,
      "w": 280,
      "h": 745
    },
    "player_eat": {
      "x": 292,
      "y": 6,
      "w": 280,
      "h": 745
    },
    "rival_beast": {
      "x": 578,
      "y": 6,
      "w": 292,
      "h": 532
    },
    "rival_armored": {
      "x": 6,
      "y": 757,
      "w": 249,
      "h": 636
    },
    "human_0": {
      "x": 261,
      "y": 757,
      "w": 126,
      "h": 384
    },
    "human_1": {
      "x": 393,
      "y": 757,
      "w": 189,
      "h": 384
    },
    "human_2": {
      "x": 588,
      "y": 757,
      "w": 136,
      "h": 384
    },
    "human_3": {
      "x": 730,
      "y": 757,
      "w": 144,
      "h": 384
    },
    "human_4": {
      "x": 6,
      "y": 1399,
      "w": 299,
      "h": 384
    },
    "human_5": {
      "x": 311,
      "y": 1399,
      "w": 199,
      "h": 384
    },
    "human_6": {
      "x": 516,
      "y": 1399,
      "w": 139,
      "h": 384
    }
  }
};
});
