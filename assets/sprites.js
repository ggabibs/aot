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
  "height": 1296,
  "frames": {
    "player_idle": {
      "x": 4,
      "y": 4,
      "w": 201,
      "h": 512
    },
    "player_eat": {
      "x": 209,
      "y": 4,
      "w": 202,
      "h": 512
    },
    "rival_beast": {
      "x": 415,
      "y": 4,
      "w": 201,
      "h": 384
    },
    "rival_armored": {
      "x": 620,
      "y": 4,
      "w": 164,
      "h": 384
    },
    "human_0": {
      "x": 788,
      "y": 4,
      "w": 131,
      "h": 384
    },
    "human_1": {
      "x": 4,
      "y": 520,
      "w": 194,
      "h": 384
    },
    "human_2": {
      "x": 202,
      "y": 520,
      "w": 141,
      "h": 384
    },
    "human_3": {
      "x": 347,
      "y": 520,
      "w": 148,
      "h": 384
    },
    "human_4": {
      "x": 499,
      "y": 520,
      "w": 303,
      "h": 384
    },
    "human_5": {
      "x": 806,
      "y": 520,
      "w": 202,
      "h": 384
    },
    "human_6": {
      "x": 4,
      "y": 908,
      "w": 146,
      "h": 384
    }
  }
};
});
